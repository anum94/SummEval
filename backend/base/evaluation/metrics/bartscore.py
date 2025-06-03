import logging
import os
import subprocess
import traceback
from typing import List

import numpy as np
import torch
import torch.nn as nn
from transformers import BartForConditionalGeneration, BartTokenizer

from .metric import Metric

logger = logging.getLogger(__name__)


class BartScore(Metric):
    metric_name = "bartscore"
    """
    The BARTScore metric, based on the example from https://github.com/neulab/BARTScore
    """

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        current_directory = os.getcwd()
        bart_weight_pth = os.path.join(current_directory, "metrics", "bart.pth")
        if os.path.isfile(os.path.join(bart_weight_pth)):
            subprocess.run(
                "gdown --id 1_7JfF7KOInb7ZrxKHIigTMR4ChVET01m --output bart.pth",
                shell=True,
            )
            current_file = os.path.join(current_directory, "bart.pth")
            subprocess.run(
                f"mv {current_file} {bart_weight_pth}",
                shell=True,
            )

        # we use 3 bart scorers: the vanilla, cnn, and para variants
        self.bart_scorers_initializers = {
            "vanilla": self.get_vanilla_scorer,
            "cnn": self.get_cnn_scorer,
            "para": self.get_para_scorer,
        }
        self.requires_decoded = True

    @staticmethod
    def get_vanilla_scorer():
        """
        returns the the vanilla bart scorer
        """
        bart_scorer = BARTScorer(device="cpu", checkpoint="facebook/bart-large")
        return bart_scorer

    @staticmethod
    def get_cnn_scorer():
        """
        returns the the cnn version of bart sore
        """
        bart_scorer = BARTScorer(device="cpu", checkpoint="facebook/bart-large-cnn")
        return bart_scorer

    @staticmethod
    def get_para_scorer():
        """
        returns the parabank version of bart score
        """
        # for the parabank model, first init a bart model, then load the local para model from BARTScore/bart.pth
        #  See the documentation from https://github.com/neulab/BARTScore for reference

        bart_scorer = BARTScorer(device="cpu", checkpoint="facebook/bart-large-cnn")
        bart_scorer.load(path="metrics/BARTScore/bart.pth")
        return bart_scorer

    def compute_bart_score(self, prediction, gold_labels, scorer):
        """
        calculate the bart score for a prediction given the gold labels for a specific scorer
        """

        # num_gold_labels
        num_gold_labels = len(gold_labels)
        print(num_gold_labels)

        # ref to hypo scores are the precision
        ref_hypo_scores = np.array(
            scorer.score(gold_labels, prediction * num_gold_labels, batch_size=4)
        )

        # hypo to ref scores are the recall
        hypo_ref_scores = np.array(
            scorer.score(prediction * num_gold_labels, gold_labels, batch_size=4)
        )

        # take max and average
        max_avg_f = (0.5 * (ref_hypo_scores + hypo_ref_scores)).max()
        hypo_ref = hypo_ref_scores.max()
        ref_hypo = ref_hypo_scores.max()

        return {"f_score": max_avg_f, "precision": ref_hypo, "recall": hypo_ref}

    def compute(self, predictions, references, scorer_str="cnn"):
        scorer = self.bart_scorers_initializers[scorer_str]()

        result = {
            "f_score": [],
            "precision": [],
            "recall": [],
            "f_score_overall": None,
            "precision_overall": None,
            "recall_overall": None,
        }

        for pred, ref in zip(predictions, references):
            result_value = self.compute_bart_score([pred], [ref], scorer)
            result["f_score"].append(result_value["f_score"])
            result["precision"].append(result_value["precision"])
            result["recall"].append(result_value["recall"])

        result["f_score_overall"] = np.mean(result["f_score"])
        result["precision_overall"] = np.mean(result["precision"])
        result["recall_overall"] = np.mean(result["recall"])

        return result


class BARTScorer:
    def __init__(
        self, device="cuda:0", max_length=1024, checkpoint="facebook/bart-large-cnn"
    ):
        # Set up model
        self.device = device
        self.max_length = max_length
        self.tokenizer = BartTokenizer.from_pretrained(checkpoint)
        self.model = BartForConditionalGeneration.from_pretrained(checkpoint)
        self.model.eval()
        self.model.to(device)

        # Set up loss
        self.loss_fct = nn.NLLLoss(
            reduction="none", ignore_index=self.model.config.pad_token_id
        )
        self.lsm = nn.LogSoftmax(dim=1)

    def load(self, path=None):
        """Load model from paraphrase finetuning"""
        if path is None:
            path = "models/bart.pth"
        self.model.load_state_dict(torch.load(path, map_location=self.device))

    def score(self, srcs, tgts, batch_size=4):
        """Score a batch of examples"""
        score_list = []
        for i in range(0, len(srcs), batch_size):
            src_list = srcs[i : i + batch_size]
            tgt_list = tgts[i : i + batch_size]
            try:
                with torch.no_grad():
                    encoded_src = self.tokenizer(
                        src_list,
                        max_length=self.max_length,
                        truncation=True,
                        padding=True,
                        return_tensors="pt",
                    )
                    encoded_tgt = self.tokenizer(
                        tgt_list,
                        max_length=self.max_length,
                        truncation=True,
                        padding=True,
                        return_tensors="pt",
                    )
                    src_tokens = encoded_src["input_ids"].to(self.device)
                    src_mask = encoded_src["attention_mask"].to(self.device)

                    tgt_tokens = encoded_tgt["input_ids"].to(self.device)
                    tgt_mask = encoded_tgt["attention_mask"]
                    tgt_len = tgt_mask.sum(dim=1).to(self.device)

                    output = self.model(
                        input_ids=src_tokens, attention_mask=src_mask, labels=tgt_tokens
                    )
                    logits = output.logits.view(-1, self.model.config.vocab_size)
                    loss = self.loss_fct(self.lsm(logits), tgt_tokens.view(-1))
                    loss = loss.view(tgt_tokens.shape[0], -1)
                    loss = loss.sum(dim=1) / tgt_len
                    curr_score_list = [-x.item() for x in loss]
                    score_list += curr_score_list

            except RuntimeError:
                traceback.print_exc()
                print(f"source: {src_list}")
                print(f"target: {tgt_list}")
                exit(0)
        return score_list

    def multi_ref_score(self, srcs, tgts: List[List[str]], agg="mean", batch_size=4):
        # Assert we have the same number of references
        ref_nums = [len(x) for x in tgts]
        if len(set(ref_nums)) > 1:
            raise Exception("You have different number of references per test sample.")

        ref_num = len(tgts[0])
        score_matrix = []
        for i in range(ref_num):
            curr_tgts = [x[i] for x in tgts]
            scores = self.score(srcs, curr_tgts, batch_size)
            score_matrix.append(scores)
        if agg == "mean":
            score_list = np.mean(score_matrix, axis=0)
        elif agg == "max":
            score_list = np.max(score_matrix, axis=0)
        else:
            raise NotImplementedError
        return list(score_list)

    def test(self, batch_size=3):
        """Test"""
        src_list = [
            "This is a very good idea. Although simple, but very insightful.",
            "Can I take a look?",
            "Do not trust him, he is a liar.",
        ]

        tgt_list = ["That's stupid.", "What's the problem?", "He is trustworthy."]

        print(self.score(src_list, tgt_list, batch_size))
