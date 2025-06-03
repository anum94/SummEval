import json
import logging
import os
import string
from typing import List

import numpy as np
from dotenv import load_dotenv, dotenv_values
from tqdm import tqdm

from base.evaluation.metrics.factscore.abstain_detection import is_response_abstained
from base.evaluation.metrics.factscore.atomic_facts import AtomicFactGenerator
from base.evaluation.metrics.factscore.clm import CLM
from base.evaluation.metrics.factscore.fscore_utils import get_wiki_topic
from base.evaluation.metrics.factscore.npm import NPM
from base.evaluation.metrics.factscore.openai_lm import OpenAIModel
from base.evaluation.metrics.factscore.retrieval import DocDB, Retrieval
from base.evaluation.metrics.factscore.search_wiki import search_wiki


class FactScorer(object):
    def __init__(
            self,
            model_name="gpt-4o-mini",
            data_dir=".cache/factscore",
            model_dir=".cache/factscore",
            cache_dir=".cache/factscore",
            openai_key="api.key",
            cost_estimate="consider_cache",
            abstain_detection_type=None,
            grounding_provided=False,
            batch_size=256,
    ):
        assert model_name in [
            "retrieval+llama",
            "retrieval+llama+npm",
            "retrieval+ChatGPT",
            "npm",
            "retrieval+ChatGPT+npm",
            "gpt-4o-mini",
        ]
        self.model_name = model_name

        self.db = {}
        self.retrieval = {}
        self.npm = {}
        self.batch_size = batch_size  # batch size for retrieval
        self.openai_key = openai_key
        self.abstain_detection_type = abstain_detection_type
        self.grounding_provided = grounding_provided

        self.data_dir = data_dir
        self.cache_dir = cache_dir
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir)

        self.af_generator = None
        self.cost_estimate = cost_estimate

        if "llama" in model_name:
            self.lm = CLM(
                "inst-llama-7B",
                model_dir=os.path.join(model_dir, "inst-llama-7B"),
                cache_file=os.path.join(cache_dir, "inst-llama-7B.pkl"),
            )
        elif "GPT-4" in model_name.upper():
            self.lm = OpenAIModel(
                "gpt-4o-mini",
                cache_file=os.path.join(cache_dir, "GPT4o-mini.pkl"),
                openai_key=openai_key,
            )
        else:
            self.lm = None

    def save_cache(self):
        if self.lm:
            self.lm.save_cache()
        if "npm" in self.model_name:
            for k, v in self.npm.items():
                v.save_cache()
        for k, v in self.retrieval.items():
            v.save_cache()

    def register_knowledge_source(
            self, name="enwiki-20230401", db_path=None, data_path=None
    ):
        assert name not in self.retrieval, f"{name} already registered"
        if db_path is None:
            db_path = os.path.join(self.data_dir, f"{name}.db")

        if data_path is None:
            data_path = os.path.join(self.data_dir, f"{name}.jsonl")

        cache_path = os.path.join(self.cache_dir, f"retrieval-{name}.json")
        embed_cache_path = os.path.join(self.cache_dir, f"retrieval-{name}.pkl")

        self.db[name] = DocDB(db_path=db_path, data_path=data_path)
        self.retrieval[name] = Retrieval(
            self.db[name], cache_path, embed_cache_path, batch_size=self.batch_size
        )
        if "npm" in self.model_name:
            cache_path = os.path.join(self.cache_dir, f"bm25-{name}.json")
            embed_cache_path = os.path.join(self.cache_dir, f"bm25-{name}.pkl")
            self.npm[name] = NPM(
                Retrieval(self.db[name], cache_path, embed_cache_path, "bm25"),
                "npm-single",
                cache_file=os.path.join(self.cache_dir, f"npm-{name}.pkl"),
            )

    def print_cost_estimates(self, total_words, task, model):
        # https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
        # Number of tokens are roughly 4/3 of the number of words
        total_tokens = total_words * 4.0 / 3

        # https://openai.com/pricing
        # if we use davinci-003, the cost is $0.02 per 1000 tokens
        # if we use gpt-3.5-turbo, the cost is $0.002 per 1000 tokens
        # @todo: Anum update this
        if model == "davinci-003":
            rate = 0.02
        elif model == "gpt-3.5-turbo":
            rate = 0.002

        total_cost = total_tokens * rate / 1000

        # print the total words, tokens, and cost along with rate
        logging.critical(
            "Estimated OpenAI API cost for %s ($%.3f per 1000 tokens): $%.2f for %d words and %d tokens"
            % (task, rate, total_cost, total_words, total_tokens)
        )

    def get_score(
            self,
            topics,
            generations,
            groundings,
            gamma=10,
            atomic_facts=None,
            knowledge_source=None,
            verbose=False,
            grounding_provided=False,
    ):
        if knowledge_source is None:
            # use the default knowledge source
            knowledge_source = "enwiki-20230401"

        # if knowledge_source not in self.retrieval:
        #     self.register_knowledge_source(knowledge_source)

        if type(topics) == type(generations) == str:
            topics = [topics]
            generations = [generations]
        else:
            assert (
                    type(topics) == type(generations) == list
            ), "`topics` and `generations` should be lists."
            assert len(topics) == len(
                generations
            ), "`topics` and `generations` should have the same length"

        if atomic_facts is not None:
            assert len(topics) == len(
                atomic_facts
            ), "`topics` and `atomic_facts` should have the same length"
        else:
            if self.af_generator is None:
                self.af_generator = AtomicFactGenerator(
                    openai_key=self.openai_key,
                    demon_dir=os.path.join(self.data_dir, "demos"),
                    gpt3_cache_file=os.path.join(self.cache_dir, "GPT4o-mini.pkl"),
                )

            # estimate the total cost of atomic fact generation
            total_words = 0
            for gen in generations:
                total_words += self.af_generator.run(
                    gen, cost_estimate=self.cost_estimate
                )

            # self.print_cost_estimates(total_words, task="atomic fact generation", model="GPT-4o mini")

            if verbose:
                topics = tqdm(topics)

            atomic_facts = []
            print(f"Generating Atomic Facts for {len(generations)} generations")
            for topic, gen in tqdm(zip(topics, generations), total=len(generations)):
                # optionally, first detect if the response is abstained
                response_abstained = is_response_abstained(
                    gen, self.abstain_detection_type
                )
                if response_abstained:
                    atomic_facts.append(None)
                    continue
                # continue only when the response is not abstained
                curr_afs, _ = self.af_generator.run(gen)
                curr_afs = [fact for _, facts in curr_afs for fact in facts]
                if len(curr_afs) == 0:
                    atomic_facts.append(None)
                else:
                    atomic_facts.append(curr_afs)
                if len(atomic_facts) % 10 == 0:
                    self.af_generator.save_cache()

            assert len(atomic_facts) == len(topics)
            self.af_generator.save_cache()

        respond_ratio = np.mean([facts is not None for facts in atomic_facts])

        if "GPT" in self.model_name.upper():
            # estimate the total cost of response generation
            total_words = 0
            for topic, generation, facts, grounding in tqdm(
                zip(topics, generations, atomic_facts, groundings),
                total=len(generations),
            ):
                if facts is not None:
                    total_words += self._get_score(
                        topic,
                        generation,
                        facts,
                        knowledge_source,
                        cost_estimate=self.cost_estimate,
                        grounding=grounding,
                        grounding_provided=grounding_provided,
                    )

            # self.print_cost_estimates(total_words, task="factscore evaluation", model="gpt-3.5-turbo")

        if verbose:
            topics = tqdm(topics)

        scores = []
        init_scores = []
        decisions = []
        wrong_facts = []

        print("Getting score from FS.")
        for topic, generation, facts, grounding in tqdm(
                zip(topics, generations, atomic_facts, groundings), total=len(generations)
        ):
            # print (f"Running for the follow facts. {facts}")
            if facts is None:
                decisions.append(None)
            else:
                decision = self._get_score(
                    topic,
                    generation,
                    facts,
                    knowledge_source,
                    grounding=grounding,
                    grounding_provided=grounding_provided,
                )
                score = np.mean([d["is_supported"] for d in decision])
                wrong_fact = [
                    {"atom": d["atom"], "idx": idx}
                    for idx, d in enumerate(decision)
                    if not d["is_supported"]
                ]

                if gamma:
                    init_scores.append(score)
                    penalty = (
                        1.0 if len(facts) > gamma else np.exp(1 - gamma / len(facts))
                    )
                    score = penalty * score

                decisions.append(decision)
                scores.append(score)
                wrong_facts.append(wrong_fact)
                if len(scores) % 10 == 0:
                    self.save_cache()

        self.save_cache()

        out = {
            "score": np.mean(scores),
            "respond_ratio": respond_ratio,
            "decisions": decisions,
            "wrong_facts": wrong_facts,
            "num_facts_per_response": np.mean(
                [len(d) for d in decisions if d is not None]
            ),
        }

        if gamma:
            out["init_score"] = np.mean(init_scores)

        return out

    def get_extrinsic_af(
            self,
            topics,
            wrong_facts,
            groundings,
            generations=None,
            verbose=False,
            grounding_provided=False,
    ):
        if verbose:
            topics = tqdm(topics)

        scores = []
        decisions = []
        extrinsic_facts = []

        for topic, generation, facts, grounding in tqdm(
                zip(topics, generations, atomic_facts, groundings), total=len(generations)
        ):
            print(
                f"Running for the follow wrongly classified facts to check if they are intrinsic or extrinsic. {facts}"
            )
            if facts is None:
                decisions.append(None)
            else:
                decision = self._get_score(
                    topic,
                    generation,
                    facts,
                    knowledge_source=None,
                    grounding=grounding,
                    grounding_provided=grounding_provided,
                    check_extrinsic=True,
                )
                score = np.mean([d["is_supported"] for d in decision])
                extrinsic_fact = [
                    {"atom": d["atom"], "idx": d["idx"]}
                    for idx, d in enumerate(decision)
                    if not d["is_supported"]
                ]

                decisions.append(decision)
                scores.append(score)
                extrinsic_facts.append(extrinsic_fact)
                if len(scores) % 10 == 0:
                    self.save_cache()

        self.save_cache()

        extrinsic_af = {
            "score": np.mean(scores),
            "decisions": decisions,
            "extrinsic_facts": extrinsic_facts,
        }
        print(
            "The following wrongly classified facts are Extrinsic: \n {}".format(
                extrinsic_facts
            )
        )

        return extrinsic_af

    def get_extrinsic_score(
            self,
            topics,
            extrinsic_facts,
            generations=None,
            verbose=False,
            grounding_provided=False,
    ):
        if verbose:
            topics = tqdm(topics)

        knowledge_source = "enwiki-20230401"

        if knowledge_source not in self.retrieval:
            self.register_knowledge_source(knowledge_source)
        scores = []
        decisions = []
        extrinsic_hallucinated_facts = []

        for topic, generation, facts in zip(topics, generations, extrinsic_facts):
            print(
                f"Checking the wrongly classified text through extrinsic fact checking using knowledge source {knowledge_source} for the following facts. \n {facts}"
            )
            if facts is None:
                decisions.append(None)
            else:
                decision = self._get_score(
                    topic,
                    generation,
                    facts,
                    knowledge_source=knowledge_source,
                    grounding_provided=grounding_provided,
                    check_extrinsic=False,
                    get_topic_per_af=True,
                )
                score = np.mean([d["is_supported"] for d in decision])
                extrinsic_hallucinated_fact = [
                    {"atom": d["atom"], "idx": d["idx"]}
                    for idx, d in enumerate(decision)
                    if not d["is_supported"]
                ]

                decisions.append(decision)
                scores.append(score)
                extrinsic_hallucinated_facts.append(extrinsic_hallucinated_fact)
                if len(scores) % 10 == 0:
                    self.save_cache()

        self.save_cache()

        self.extrinsic_out = {
            "score": np.mean(scores),
            # "respond_ratio": respond_ratio,
            "decisions": decisions,
            "wrong_facts": extrinsic_hallucinated_facts,
            "num_facts_per_response": np.mean(
                [len(d) for d in decisions if d is not None]
            ),
        }

        print(
            "The following facts are still classified as hallucinations after Extrinsic Fact Checking: \n {}".format(
                extrinsic_facts
            )
        )
        return self.extrinsic_out

    def search_passage_till_success(
            self, topic, atom, generation, knowledge_source
    ) -> List:
        try:
            passages = self.retrieval[knowledge_source].get_passages(topic, atom, k=5)
            # print ("got passage using  provided topic")
        except:
            # try all suggested topics until a match is found
            # print("didn't get passage using  provided topic")
            topics = search_wiki(generation)
            if not topic:
                # if we are in the get topic per AF mode. The LLM generated topic would be tested first.
                llm_generate_topic = get_wiki_topic([atom])[0]
                topics.insert(0, llm_generate_topic)

            success = False
            idx = 0
            # print ( f"trying out {len(topics)} topics from search_Wiki function.")
            # if len(topics) == 1:
            #    print ("Problem found")
            #    print ("Generation: ", generation)
            #    print ("Topics:", topics)
            while not success:
                if idx >= len(topics):
                    print(
                        f"Exhausted all options for this generation, no DB topic match found! Generation: {generation} \n\n Assigning dummpy empty passage"
                    )
                    return []
                try:
                    topic = topics[idx]
                    passages = self.retrieval[knowledge_source].get_passages(
                        topic, atom, k=3
                    )
                    idx += 1
                    success = True
                except:
                    idx += 1
        return passages

    def _get_score(
            self,
            topic,
            generation,
            atomic_facts,
            knowledge_source,
            grounding=None,
            grounding_provided=False,
            cost_estimate=None,
            check_extrinsic=False,
            get_topic_per_af=False,
    ):
        decisions = []
        total_words = 0
        passages = None
        for atomic_fact in atomic_facts:
            if not isinstance(atomic_fact, str):
                atom = atomic_fact["atom"]
                idx = atomic_fact["idx"]
            else:
                atom = atomic_fact
                idx = None
            atom = atom.strip()
            if self.lm:
                if grounding_provided:
                    if isinstance(grounding, str):
                        grounding = [grounding]
                    passages = [
                        {"title": "Article", "text": ground} for ground in grounding
                    ]
                elif get_topic_per_af:
                    # passing empty topic would force the retriever the get a llm generated topic
                    passages = self.search_passage_till_success(
                        topic="",
                        atom=atom,
                        generation=atom,
                        knowledge_source=knowledge_source,
                    )
                else:
                    if passages is None:
                        passages = self.search_passage_till_success(
                            topic, atom, generation, knowledge_source
                        )

                if check_extrinsic:
                    definition = "Does the provided text contain any information related to the Input statement?.\n\n"
                else:
                    definition = "Answer the question about {} based on the given context.\n\n".format(
                        topic
                    )

                context = ""
                for psg_idx, psg in enumerate(reversed(passages)):
                    context += "Title: {}\nText: {}\n\n".format(
                        psg["title"], psg["text"].replace("<s>", "").replace("</s>", "")
                    )
                definition += context.strip()
                if definition[-1] not in string.punctuation:
                    definition += "."

                if check_extrinsic:
                    definition.replace("Title: Article", "")
                    prompt = "{}\n\nInput: {} \n This statement is discussed in the above provided text. True or False?\nOutput:".format(
                        definition.strip(), atom.strip()
                    )
                else:
                    prompt = "{}\n\nInput: {} True or False?\nOutput:".format(
                        definition.strip(), atom.strip()
                    )

                if cost_estimate:
                    if (
                            cost_estimate == "consider_cache"
                            and (prompt.strip() + "_0") not in self.lm.cache_dict
                    ):
                        total_words += len(prompt.split())
                    elif cost_estimate == "ignore_cache":
                        total_words += len(prompt.split())
                    continue

                output = self.lm.generate(prompt)

                if type(output[1]) == np.ndarray:
                    # when logits are available
                    logits = np.array(output[1])
                    assert logits.shape[0] in [32000, 32001]
                    true_score = logits[5852]
                    false_score = logits[7700]
                    is_supported = true_score > false_score
                else:
                    # when logits are unavailable
                    generated_answer = output[0].lower()
                    if "true" in generated_answer or "false" in generated_answer:
                        if (
                                "true" in generated_answer
                                and "false" not in generated_answer
                        ):
                            is_supported = True
                        elif (
                                "false" in generated_answer
                                and "true" not in generated_answer
                        ):
                            is_supported = False
                        else:
                            is_supported = generated_answer.index(
                                "true"
                            ) > generated_answer.index("false")
                    else:
                        is_supported = all(
                            [
                                keyword
                                not in generated_answer.lower()
                                .translate(str.maketrans("", "", string.punctuation))
                                .split()
                                for keyword in [
                                "not",
                                "cannot",
                                "unknown",
                                "information",
                            ]
                            ]
                        )

            else:
                is_supported = True

            if is_supported and "npm" in self.model_name:
                npprob = self.npm[knowledge_source].get_probabilty(topic, atom)
                is_supported = npprob > 0.3

            decisions.append(
                {
                    "atom": atom,
                    "is_supported": is_supported,
                    "idx": idx,
                    "wiki_context": context,
                }
            )

        if cost_estimate:
            return total_words
        else:
            return decisions


def get_factscore_for_summaries(input_articles: list, predicted_summaries: list) -> dict:
    """
    Calculates the factscore for the corresponding input_articles and their predicted_summaries

    @param input_articles: full-text articles
    @param predicted_summaries: summaries predicted by llm
    @return:
    """
    fs_result = _get_factscore_for_summary(input_articles, predicted_summaries)

    return fs_result


def _get_factscore_for_summary(input_articles: list[str], summaries: list[str]) -> dict:
    fs_temp_view = {}

    # construct input parameters for FactScore
    working_dir = os.path.dirname(os.path.realpath(__file__))
    factscore_cache_dir = os.path.join(working_dir, ".cache/factscore")
    data_dir = os.path.join(working_dir, "data")

    # get openai key from relative path
    base_dir = os.path.abspath(os.path.join(working_dir, "../../../.."))  # Go 4 levels up
    env_path = os.path.join(base_dir, "summeval/.env")

    load_dotenv(dotenv_path=env_path)
    dotenv_values(dotenv_path=env_path)

    api_key = os.getenv("OPENAI_API_KEY")

    # In order to not break api, have an empty topic for each summary, since they are not used in our project
    topics = ['' for _ in range(len(summaries))]
    fs_temp_view['topics'] = topics

    # generations == summary
    generations = summaries
    fs_temp_view['generations'] = generations

    # groundings == input_articles
    groundings = input_articles
    fs_temp_view['groundings'] = groundings

    grounding_provided = True
    fs_temp_view['grounding_provided'] = grounding_provided

    # gamma: hyperparameter for length penalty
    gamma = 10
    fs_temp_view['gamma'] = gamma

    # set atomic facts to None to auto-generate them
    initial_atomic_facts = None
    fs_temp_view['initial_atomic_facts'] = initial_atomic_facts

    args = {
        'model_name': 'gpt-4o-mini',
        'data_dir': data_dir,
        'factscore_cache_dir': factscore_cache_dir,
        'api_key': api_key,
        'grounding_provided': grounding_provided,
        'abstain_detection_type': None,
    }
    fs_temp_view['args'] = args

    fs = FactScorer(
        model_name=args["model_name"],
        data_dir=args["factscore_cache_dir"],
        model_dir=args["factscore_cache_dir"],
        cache_dir=args["factscore_cache_dir"],
        openai_key=args['api_key'],
        grounding_provided=args['grounding_provided'],
        abstain_detection_type=args['abstain_detection_type'],
    )

    output = fs.get_score(
        topics=topics,
        generations=generations,
        groundings=groundings,
        atomic_facts=initial_atomic_facts,
        gamma=gamma,
        verbose=True,
        grounding_provided=grounding_provided,
    )

    return output


if __name__ == "__main__":
    # [Sample] Get fact score results
    articles = ["""(CNN)Justin Timberlake and Jessica Biel, welcome to parenthood. The celebrity couple announced the arrival of their son, Silas Randall Timberlake, in statements to People. "Silas was the middle name of Timberlake's maternal grandfather Bill Bomar, who died in 2012, while Randall is the musician's own middle name, as well as his father's first," People reports. The couple announced the pregnancy in January, with an Instagram post. It is the first baby for both.""",
                """Blackpool are in talks to sign Austria defender Thomas Piermayr. The 25-year-old has been training with the Championship club this week and they are keen to get him on board for what is expected to be confirmed as a campaign in League One next season. Piermayr is a free agent and had been playing for Colorado Rapids. The former Austria U21 international had a spell with Inverness Caledonian Thistle in 2011. Thomas Piermayr (left, in action for the Colorado Rapids) tries to tackle Obafemi Martins last year ."""]
    summaries = ["""Justin Timberlake and Jessica Biel have welcomed their first child, a son named Silas Randall Timberlake. They announced his arrival in a statement to People, noting that "Silas" honors Timberlake's late grandfather, while "Randall" is Timberlake’s middle name and his father's first name. The couple revealed Biel's pregnancy back in January through an Instagram post.""",
                 """Thomas Piermayr has been training with Blackpool this week . Austrian defender is a free agent after leaving MLS side Colorado Rapids . Blackpool are bottom of the Championship and look set to be relegated ."""]

    results = get_factscore_for_summaries(input_articles=articles, predicted_summaries=summaries)

    # import pprint
    # pprint.pprint(results)

    print(json.dumps(results, indent=4))
