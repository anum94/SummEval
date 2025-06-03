from base.evaluation.metrics.factscore.factscorer import get_factscore_for_summaries
from .metric import Metric


class FactScoreMetric(Metric):
    metric_name = "factscore"

    def compute(self, predictions: list, references: list) -> dict:
        """
        Computes the fact-score metric.

        @param predictions: A list of predicted summaries
        @param references: A list of full-text articles. Not to be confused with reference summaries
        """
        results = get_factscore_for_summaries(input_articles=references, predicted_summaries=predictions)

        return results
