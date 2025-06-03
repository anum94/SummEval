import numpy as np
import pandas as pd
import simplejson as json  # Import simplejson instead of json
from django.http import HttpResponse, HttpResponseServerError
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

fake_data = {
    "bertscore": [0.85, None, 0.88, 0.92],
    "bartscore": [0.75, 0.78, 0.80, 0.85],
    "rouge": [0.70, 0.72, 0.68, None],
    "meteor": [3.0, None, 3.1, 3.4],
    "llm_evaluation": [4.5, 4.7, 4.6, 4.8],
    "human_evaluation": [3.5, 1.4, 3.7, 2.1],
}

metrics_map = {
    "bartscore": "f_score",
    "bertscore": "f1",
    "bleu": "bleu",
    "meteor": "meteor",
    "rouge": "mean",
    "unieval": "overall",
    "llm_evaluation": "mean",
    "human_evaluation": "mean",
    "factscore": "score"
}

llm_metrics = ["Fluency", "Domain_Adaptation", "Coherence"]


# Helper function to calculate the geometric mean of a list of numbers
def geo_mean(iterable):
    a = np.array(iterable)
    return a.prod() ** (1.0 / len(a))


@method_decorator(csrf_exempt, name='dispatch')
class CorrelationView(View):

    def post(self, request):
        try:
            correlation_data = {
            }
            data = json.loads(request.body)
            print(data)
            metrics_match = set(data["human_evaluation_metrics"]) == set(
                llm_metrics)  # Check if the llm metrics and human eval metrics match
            for experiment, results in data["data"].items():
                for metric, result in results.items():
                    if result and isinstance(result, dict):
                        if metrics_match and (metric == "human_evaluation" or metric == "llm_evaluation"):
                            for llm_metric, llm_result in result.items():
                                if metric == "human_evaluation" and llm_result == 0:
                                    llm_result = None
                                if f'{metric}_{llm_metric}' in correlation_data:
                                    correlation_data[f'{metric}_{llm_metric}'].append(llm_result)
                                else:
                                    correlation_data[f'{metric}_{llm_metric}'] = [llm_result]
                        else:
                            if metrics_map[metric] == "mean":
                                data = geo_mean(list(result.values()))
                            else:
                                data = result[metrics_map[metric]]
                            if metric in correlation_data:
                                correlation_data[metric].append(data)
                            else:
                                correlation_data[metric] = [data]
                    else:
                        if metric in correlation_data:
                            correlation_data[metric].append(None)
                        else:
                            correlation_data[metric] = [None]

            df = pd.DataFrame(correlation_data)

            # Drop columns that contain any NaN values
            df = df.dropna(axis=1, how='any', inplace=False)

            # Normalize the data (min-max normalization)
            df = (df - df.min()) / (df.max() - df.min())

            pearson_corr = df.corr(method='pearson').to_dict()
            spearman_corr = df.corr(method='spearman').to_dict()

            output = json.dumps({'pearson': pearson_corr, 'spearman': spearman_corr}, ignore_nan=True)
            print(output)

            return HttpResponse(output, content_type='application/json')
        except Exception as e:
            print(e)
            return HttpResponseServerError("An unexpected error occurred.")
