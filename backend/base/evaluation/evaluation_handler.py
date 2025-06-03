import numpy as np

from base.evaluation.celery_progress_manager import CeleryProgressManager
from base.evaluation.metrics.bartscore import BartScore
from base.evaluation.metrics.bertscore import BertScore
from base.evaluation.metrics.bleu import Bleu
from base.evaluation.metrics.factscore_metric import FactScoreMetric
from base.evaluation.metrics.gpt_eval import GPTEval
from base.evaluation.metrics.meteor import Meteor
from base.evaluation.metrics.rouge import Rouge
from base.evaluation.metrics.unieval import UniEval


class EvaluationHandler():
    def __init__(self) -> None:
        self.function_map = {
            "rouge": self.calc_rogue,
            "meteor": self.calc_meteor,
            "bleu": self.calc_bleu,
            "bertscore": self.calc_bert,
            "bartscore": self.calc_bart,
            "unieval": self.calc_unieval,
            "llm_evaluation": self.calc_llm_evaluation,
            "factscore": self.calc_factscore,
        }
        self.rouge = Rouge()
        self.meteor = Meteor()
        self.bleu = Bleu()
        self.bertscore = BertScore()
        self.bartscore = BartScore()
        self.unieval = UniEval()
        self.factscore = FactScoreMetric()

    def calc_rogue(self, output, reference):
        results = []
        results.append(self.rouge.compute(predictions=output, references=reference))  # calculate total rouge scores
        # Calculate rouge scores for each output-reference pair
        for out, ref in zip(output, reference):
            results.append(self.rouge.compute(predictions=[out], references=[ref]))

        return results

    def calc_meteor(self, output, reference):
        results = []
        for out, ref in zip(output, reference):
            meteor_score = self.meteor.compute([out], [ref])
            results.append({"meteor": meteor_score["meteor"]})
        results.insert(0, {"meteor": np.mean(
            [result["meteor"] for result in results])})  # insert total meteor score by averaging all meteor scores
        return results

    def calc_bleu(self, output, reference):
        results = []
        results.append(self.bleu.compute(predictions=output, references=reference))  # calculate total bleu scores
        # Calculate bleu scores for each output-reference pair
        for out, ref in zip(output, reference):
            results.append(self.bleu.compute(predictions=[out], references=[ref]))

        return results

    def calc_bert(self, output, reference):
        results = []
        total_result = self.bertscore.compute(predictions=output, references=reference)
        total_result.pop('hashcode', None)
        results.append(total_result)  # calculate total bert scores
        # Calculate bert scores for each output-reference pair
        for out, ref in zip(output, reference):
            single_result = self.bertscore.compute(predictions=[out], references=[ref])
            single_result.pop('hashcode', None)
            results.append(single_result)

        return results

    def calc_bart(self, output, reference):
        results = []
        bart_scores = self.bartscore.compute(predictions=output, references=reference)
        results.append({"f_score": bart_scores["f_score_overall"], "precision": bart_scores["precision_overall"],
                        "recall": bart_scores["recall_overall"]})
        # Calculate bart scores for each output-reference pair
        for i in range(len(output)):
            results.append({"f_score": bart_scores["f_score"][i], "precision": bart_scores["precision"][i],
                            "recall": bart_scores["recall"][i]})
        return results

    def calc_unieval(self, output, reference, source):
        results = []
        unieval = self.unieval.compute(output, reference, source)
        coherence = [item["coherence"] for item in unieval]
        consistency = [item["consistency"] for item in unieval]
        fluency = [item["fluency"] for item in unieval]
        relevance = [item["relevance"] for item in unieval]
        overall = [item["overall"] for item in unieval]

        results.append(
            {"coherence": np.mean(coherence), "consistency": np.mean(consistency), "fluency": np.mean(fluency),
             "relevance": np.mean(relevance), "overall": np.mean(overall)})
        for i in range(len(output)):
            results.append({"coherence": coherence[i], "consistency": consistency[i], "fluency": fluency[i],
                            "relevance": relevance[i], "overall": overall[i]})
        return results

    def calc_llm_evaluation(self, api_key, input_articles, predicted_summary):
        eval_model = GPTEval(api_key)
        results = eval_model.evaluate(input_articles, predicted_summary)

        domain_adaptation = [item["Domain_Adaptation"] for item in results]
        coherence = [item["Coherence"] for item in results]
        fluency = [item["Fluency"] for item in results]
        relevance = [item["Relevance"] for item in results]
        consistency = [item["Consistency"] for item in results]

        results.insert(0, {"Domain_Adaptation": np.mean(domain_adaptation), "Coherence": np.mean(coherence),
                           "Fluency": np.mean(fluency), "Relevance": np.mean(relevance),
                           "Consistency": np.mean(consistency)})
        print(results)

        return results

    def calc_factscore(self, input_articles, predicted_summaries, pm: CeleryProgressManager):
        results = []

        pm.update_phase('calculate_metrics_factscore', 1, total_steps=len(predicted_summaries) + 1)
        overall_fact_score = self.factscore.compute(references=input_articles, predictions=predicted_summaries)

        # filter out atomic facts metadata
        overall_fact_score.pop('decisions', None)
        overall_fact_score.pop('wrong_facts', None)
        overall_fact_score.pop('init_score', None)
        overall_fact_score.pop('respond_ratio', None)
        results.append(overall_fact_score)

        # compute fact_score for each individual summary
        for i, (article, summary) in enumerate(zip(input_articles, predicted_summaries)):
            pm.update_phase('calculate_metrics_factscore', 2 + i, total_steps=len(predicted_summaries) + 1)

            single_fact_score = self.factscore.compute(references=[article], predictions=[summary])
            # filter out atomic facts metadata
            single_fact_score.pop('decisions', None)
            single_fact_score.pop('wrong_facts', None)
            single_fact_score.pop('init_score', None)
            single_fact_score.pop('respond_ratio', None)
            results.append(single_fact_score)

        return results
