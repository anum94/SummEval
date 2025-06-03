import json
import traceback
import math
from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.http import HttpResponseServerError, JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView

from ..evaluation.celery_progress_manager import CeleryProgressManager
from ..models.auto_evaluation_model import AutoEvaluation
from ..models.experiment_model import Experiment
from ..models.fulltext_model import FullText
from ..models.summary_model import Summary

logger = get_task_logger(__name__)


def clean_json(data):
    if isinstance(data, dict):
        return {k: clean_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_json(v) for v in data]
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return 0.0
        return data
    else:
        return data
@shared_task(bind=True)
def calculate_and_save_metric(self, experimentId, metric, api_key):
    pm = None
    cache_key = f'{experimentId}'

    try:
        phases = {
            'fetch_summaries': {
                'name': 'Fetch Summaries',
                'message': 'Fetching summaries',
                'weight': 0.1,
                'steps': None,
            },
            'calculate_metrics': {
                'name': 'Calculate Metrics',
                'message': 'Calculating calculating metrics',
                'weight': 0.2,
                'steps': None,
            },
            'calculate_metrics_factscore': {
                'name': 'Calculate Factscore',
                'message': 'Calculating Factscore metric',
                'weight': 0.6,
                'steps': None,
            },
            'update_database': {
                'name': 'Update Database',
                'message': 'Saving results',
                'weight': 0.1,
                'steps': None,
            }
        }

        pm = CeleryProgressManager(self, phases)

        pm.enter_phase('fetch_summaries')
        pm.update_phase('fetch_summaries', 1)

        experiment = Experiment.objects.get(pk=experimentId)
        summaries = Summary.objects.filter(experiment=experimentId)
        summary_texts = summaries.values_list("summary", flat=True)
        ref_summaries = [FullText.objects.get(pk=summary.full_text.pk).reference_summary for summary in summaries]

        pm.exit_phase('fetch_summaries')

        pm.enter_phase('calculate_metrics')
        pm.update_phase('calculate_metrics', 1)

        if metric == "unieval":
            full_texts = [FullText.objects.get(pk=summary.full_text.pk).full_text for summary in summaries]
            evaluation_results = settings.EVALUATION_HANDLER.function_map[metric](summary_texts, ref_summaries,
                                                                                  full_texts)
        elif metric == "factscore":
            pm.enter_phase('calculate_metrics_factscore')
            full_texts = [FullText.objects.get(pk=summary.full_text.pk).full_text for summary in summaries]
            evaluation_results = settings.EVALUATION_HANDLER.function_map[metric](full_texts, list(summary_texts), pm)
            pm.exit_phase('calculate_metrics_factscore')

        elif metric == "llm_evaluation":
            full_texts = [FullText.objects.get(pk=summary.full_text.pk).full_text for summary in summaries]
            evaluation_results = settings.EVALUATION_HANDLER.function_map[metric](api_key, full_texts, summary_texts)
        else:
            evaluation_results = settings.EVALUATION_HANDLER.function_map[metric](summary_texts, ref_summaries)

        pm.exit_phase('calculate_metrics')

        pm.enter_phase('update_database')
        pm.update_phase('update_database', 1)
        # Save total evaluation results to experiment
        auto_eval_total = AutoEvaluation.objects.filter(content_type=ContentType.objects.get_for_model(Experiment),
                                                        object_id=experiment.pk).first()
        if not auto_eval_total:
            auto_eval_total = AutoEvaluation.objects.create(
                content_type=ContentType.objects.get_for_model(Experiment),
                object_id=experimentId,
            )
        evaluation_results = clean_json(evaluation_results)
        setattr(auto_eval_total, metric, evaluation_results[0])
        auto_eval_total.save()

        # Save individual evaluation results to summaries
        for i, summary in enumerate(summaries):
            pm.update_phase('update_database', 1, total_steps=len(summaries))
            # Save total evaluation results to experiment
            auto_eval = AutoEvaluation.objects.filter(content_type=ContentType.objects.get_for_model(Summary),
                                                      object_id=summary.pk).first()
            if not auto_eval:
                auto_eval = AutoEvaluation.objects.create(
                    content_type=ContentType.objects.get_for_model(Summary),
                    object_id=summary.pk,
                )
            setattr(auto_eval, metric, evaluation_results[i + 1])
            auto_eval.save()

        pm.exit_phase('update_database')
        cache.delete(cache_key)

    except Exception as e:
        logger.error(f"Error in calculate_and_save_metric for experiment {experimentId} and metric {metric}: {str(e)}")

        if pm is not None:
            pm.handle_failure(e)
        else:
            self.update_state(
                state='FAILURE',
                meta={
                    'error': str(e),
                    'message': 'Failed during evaluation',
                    'exc_type': type(e).__name__,
                    'exc_message': e.__str__(),
                }
            )
        cache.delete(cache_key)
        raise


# TODO: Secure with authentication @Tim???
# TODO: Ask David if we need to handle GET PATCH, DELETE requests for AutoEvaluation
@method_decorator(csrf_exempt, name='dispatch')
class AutoEvaluationView(APIView):

    def post(self, request):
        try:
            data = json.loads(request.body)
            metric = data["metric"]
            api_key = data["api_key"]
            experimentId = data["experiment"]

            task = calculate_and_save_metric.delay(experimentId, metric, api_key)
            # cache the task_id with the experiment_id as the key
            cache.set(f'{experimentId}', task.id, 60 * 60 * 24)

            return JsonResponse({'task_id': task.id,
                                 'status_endpoint': f'/api/tasks/{task.id}/status/',
                                 'monitoring_interval': 5000
                                 }, status=201)
        except AutoEvaluation.DoesNotExist:
            return HttpResponseServerError("No auto evaluation with such id.")
        except Exception as e:
            traceback_details = traceback.format_exc()
            print(f"Exception Type: {type(e).__name__}")
            print(f"Exception Message: {e}")
            print(f"Traceback Details: {traceback_details}")
            return HttpResponseServerError("An unexpected error occurred.")
