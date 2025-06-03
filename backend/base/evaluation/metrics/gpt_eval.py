from openai import OpenAI

# Evaluation prompt template based on G-Eval
EVALUATION_PROMPT_TEMPLATE = """
You will be given one summary written for an article. Your task is to rate the summary on one metric.
Please make sure you read and understand these instructions very carefully. 
Please keep this document open while reviewing, and refer to it as needed.
 
Evaluation Criteria:
 
{criteria}
 
Evaluation Steps:
 
{steps}
 
Example:
 
Source Text:
 
{document}
 
Summary:
 
{summary}
 
Evaluation Form:
 
Please provide your response in two parts. First the score as a numeric value followed by an explanation for the score. Please limit your response to 30 words in the in the format Score: integer score, Reason: Provide the reasong here
 
 
- {metric_name}
"""

# Metric 1: Coherence

COHERENCE_SCORE_CRITERIA = """
Coherence(1-5) - the collective quality of all sentences. \
We align this dimension with the DUC quality question of structure and coherence \
whereby "the summary should be well-structured and well-organized. \
The summary should not just be a heap of related information, but should build from sentence to a\
coherent body of information about a topic."
"""

COHERENCE_SCORE_STEPS = """
1. Read the article carefully and identify the main topic and key points.
2. Read the summary and compare it to the article. Check if the summary covers the main topic and key points of the article,
and if it presents them in a clear and logical order.
3. Assign a score for coherence on a scale of 1 to 5, where 1 is the lowest and 5 is the highest based on the Evaluation Criteria.
"""

# Metric 2: Fluency

FLUENCY_SCORE_CRITERIA = """
Fluency(1-3): the quality of the summary in terms of grammar, spelling, punctuation, word choice, and sentence structure.
1: Poor. The summary has many errors that make it hard to understand or sound unnatural.
2: Fair. The summary has some errors that affect the clarity or smoothness of the text, but the main points are still comprehensible.
3: Good. The summary has few or no errors and is easy to read and follow.
"""

FLUENCY_SCORE_STEPS = """
Read the summary and evaluate its fluency based on the given criteria. Assign a fluency score from 1 to 3.
"""

# Metric 3: Domain-Adaptation

DOMAIN_ADAPTATION_SCORE_CRITERIA = """
Domain Adaptation(1-5) - the degree to which the summary adheres to the doamin specific language. \
A good summary employs domain-specific terminology and conveys the sense that model comprehends and encapsulates domain-specific knowledge.\
It resembles the content that would authored by a domain expert. \
Annotators were also asked to penalize summaries that didn't adhere to domain-specific knowledge, and rather used simple words.
"""

DOMAIN_ADAPTATION_SCORE_STEPS = """
1. Read the article carefully and understand the domain it belongs to.
2. Read the summary and check if it contains domain-specific terminologies and concepts, and if it is able to concisely summaries the domain specific concept in the article. 
3. Assign a score for domain adaptation based on the Evaluation Criteria.
"""

# Metric 4: Relevance

RELEVANCY_SCORE_CRITERIA = """
Relevance(1-5) - degree to which the answer covers the content related to the question. \
The answer should include only the information relevant to the question. \
Annotators were instructed to penalize content which contained redundancies and excess information.
"""
 
RELEVANCY_SCORE_STEPS = """
1. Read the answer and the question carefully.
2. Compare the information in the answer and check if all points in it, are relevant to the question.
3. Assess how well the answer covers the main query of the question, and how much irrelevant or redundant information it contains.
4. Assign a relevance score from 1 to 5.
"""

# Metric 5: Consistency

CONSISTENCY_SCORE_CRITERIA = """
Consistency(1-5) - the factual alignment between the summary and the summarized source. \
A factually consistent summary contains only statements that are entailed by the source document. \
Annotators were also asked to penalize summaries that contained hallucinated facts.
"""
 
CONSISTENCY_SCORE_STEPS = """
1. Read the article carefully and identify the main facts and details it presents.
2. Read the summary and compare it to the article. Check if the summary contains any factual errors that are not supported by the article.
3. Assign a score for consistency based on the Evaluation Criteria.
"""


class GPTEval:

  def __init__(self, api_key: str) -> None:
    self.model = OpenAI(api_key=api_key)

  def get_geval_score(self, criteria: str, steps: str, document: str, summary: str, metric_name: str):
    prompt = EVALUATION_PROMPT_TEMPLATE.format(
        criteria=criteria,
        steps=steps,
        metric_name=metric_name,
        document=document,
        summary=summary,
    )
    response = self.model.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=5,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
    )
    return response.choices[0].message.content

  def evaluate(self, input_articles: list, predicted_summary: list) -> str:
    evaluation_metrics = {
        "Domain_Adaptation": (DOMAIN_ADAPTATION_SCORE_CRITERIA, DOMAIN_ADAPTATION_SCORE_STEPS,),
        "Coherence": (COHERENCE_SCORE_CRITERIA, COHERENCE_SCORE_STEPS),
        "Fluency": (FLUENCY_SCORE_CRITERIA, FLUENCY_SCORE_STEPS),
        "Relevance": (RELEVANCY_SCORE_CRITERIA, RELEVANCY_SCORE_STEPS),
        "Consistency": (CONSISTENCY_SCORE_CRITERIA, CONSISTENCY_SCORE_STEPS),
    }

    final_result = []
    
    for article, summary in zip(input_articles, predicted_summary):
        summary_result = {}
        for eval_type, (criteria, steps) in evaluation_metrics.items():
            result = self.get_geval_score(criteria, steps, article, summary, eval_type)

            print("Result:", result)
            print("Score:", result.split()[1])
            score_num = float(result.split()[1].replace(",", ""))
            print("Score num:", score_num)
            summary_result[eval_type] = score_num
        final_result.append(summary_result)

    return final_result

