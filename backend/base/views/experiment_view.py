import csv
import json

from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.core.paginator import Paginator
from django.core.serializers import serialize
from django.db import transaction, IntegrityError
from django.http import HttpResponse, HttpResponseServerError, JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from base.models.project_invite_model import ProjectInvite
from ..evaluation.celery_progress_manager import CeleryProgressManager
from ..models.auto_evaluation_model import AutoEvaluation
from ..models.experiment_model import Experiment
from ..models.fulltext_model import FullText
from ..models.project_model import Project
from ..models.summary_model import Summary
from ..summarization_models.open_ai_summarization import OpenAISummarization
from ..summarization_models.together_ai_summarization import TogetherAISummarization

logger = get_task_logger(__name__)


@shared_task(bind=True)
def calculate_metrics(self, eval_metrics, summary_texts, summary_ids, ref_summaries, full_texts, experimentId, api_key):
    pm = None
    cache_key = experimentId
    try:
        phases = {
            f'calculate_metrics_{metric}': {
                'name': f'Calculate Metric: {metric}',
                'message': f'Calculating Metric: {metric}',
                'weight': 0.8 / len(eval_metrics),  # assume equal weight for each metric
                'steps': None
            } for i, metric in enumerate(eval_metrics)
        }
        phases['save_total_results'] = {
            'name': 'Save total results',
            'message': 'Saving total results',
            'weight': 0.1,
            'steps': None
        }
        phases['save_individual_results'] = {
            'name': 'Save individual results',
            'message': 'Saving individual results',
            'weight': 0.1,
            'steps': None
        }

        pm = CeleryProgressManager(self, phases)

        # Evaluate the summary and store the results
        auto_eval_results = {}
        for i, metric in enumerate(eval_metrics):
            pm.enter_phase(f'calculate_metrics_{metric}')
            pm.update_phase(f'calculate_metrics_{metric}', (i + 1))

            if metric == "unieval":
                auto_eval_results[metric] = settings.EVALUATION_HANDLER.function_map[metric](summary_texts,
                                                                                             ref_summaries, full_texts)
            elif metric == "llm_evaluation":
                auto_eval_results[metric] = settings.EVALUATION_HANDLER.function_map[metric](api_key, full_texts,
                                                                                             summary_texts)
            elif metric == "factscore":
                auto_eval_results[metric] = settings.EVALUATION_HANDLER.function_map[metric](full_texts,
                                                                                             summary_texts,
                                                                                             pm)
            else:
                auto_eval_results[metric] = settings.EVALUATION_HANDLER.function_map[metric](summary_texts,
                                                                                             ref_summaries)
            pm.exit_phase(f'calculate_metrics_{metric}')

        # Store total results in the experiment
        pm.enter_phase('save_total_results')
        pm.update_phase('save_total_results', 1)
        total_eval_results = {k: v[0] for k, v in auto_eval_results.items()}
        AutoEvaluation.objects.create(
            content_type=ContentType.objects.get_for_model(Experiment),
            object_id=experimentId,
            **total_eval_results
        )
        pm.exit_phase('save_total_results')

        # Store individual results in the summaries
        pm.enter_phase('save_individual_results')

        for i, summary_id in enumerate(summary_ids):
            pm.update_phase('save_individual_results', (i + 1), len(summary_ids))
            # Update progress state every 1% progress or 10 steps to prevent frequent writes to celery backend
            single_eval_results = {k: v[i + 1] for k, v in auto_eval_results.items()}
            AutoEvaluation.objects.create(
                content_type=ContentType.objects.get_for_model(Summary),
                object_id=summary_id,
                **single_eval_results
            )
        pm.exit_phase('save_individual_results')
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


def creating_summaries(experiment):
    summaries_dict = []

    summaries = Summary.objects.filter(experiment=experiment.pk).select_related("experiment", "full_text").all()
    print("Experiment is: ", experiment)
    print("Experiment context_window:", experiment.context_window)
    print("Experiment max_tokens:", experiment.max_new_tokens)
    for summary in summaries:
        try:
            if summary.summarization_model and not summary.generated_summary:
                print("There's a summary model but generated summary is EMPTY. Now it's time to create it.")
                print("Summary model: ", summary.summarization_model)
                if summary.summarization_model == 'gpt-4o-mini' or summary.summarization_model == 'o1-mini' or summary.summarization_model == 'o1-preview':
                    print("OpenAI part is entered")

                    try:
                        open_ai_summarization = OpenAISummarization()
                        print("OpenAI summarization instance created")
                    except Exception as e:
                        print("Error creating OpenAI summarization instance:", str(e))

                    summary.generated_summary = open_ai_summarization.generate_summary(summary.summarization_model,
                                                                                       summary.prompt,
                                                                                       summary.full_text.full_text,
                                                                                       experiment.context_window,
                                                                                       experiment.max_new_tokens)
                else:
                    print("TogetherAI part is entered")
                    together_ai_summarization = TogetherAISummarization()
                    summary.generated_summary = together_ai_summarization.generate_summary(summary.summarization_model,
                                                                                           summary.prompt,
                                                                                           summary.full_text.full_text,
                                                                                           experiment.context_window,
                                                                                           experiment.max_new_tokens)
                summary.save()

        except Exception as e:
            logger.error(f"Error generating summarization model for summary {summary.pk}: {e}")

        auto_evaluations = AutoEvaluation.objects.filter(content_type=ContentType.objects.get_for_model(Summary),
                                                         object_id=summary.pk).values().first()
        summaries_dict.append({"pk": summary.pk, "fields": {"experiment": experiment.pk,
                                                            "prompt": summary.prompt,
                                                            "summary": summary.summary,
                                                            "reference_summary": summary.full_text.reference_summary,
                                                            "full_text": summary.full_text.full_text,
                                                            "summarization_model": summary.summarization_model,
                                                            "generated_summary": summary.generated_summary,
                                                            "evaluation_results": auto_evaluations,
                                                            "index": summary.index, }})

    return summaries_dict


def build_experiment_dict(experiment):
    auto_evaluation_total = AutoEvaluation.objects.filter(content_type=ContentType.objects.get_for_model(Experiment),
                                                          object_id=experiment.pk).values().first()
    summaries = Summary.objects.filter(experiment=experiment.pk).select_related("experiment", "full_text").all()
    summaries_dict = []
    for summary in summaries:
        auto_evaluations = AutoEvaluation.objects.filter(content_type=ContentType.objects.get_for_model(Summary),
                                                         object_id=summary.pk).values().first()
        summaries_dict.append({"pk": summary.pk, "fields": {"experiment": experiment.pk, "prompt": summary.prompt,
                                                            "summary": summary.summary,
                                                            "reference_summary": summary.full_text.reference_summary,
                                                            "evaluation_results": auto_evaluations,
                                                            "index": summary.index, }})

    summaries_dict = creating_summaries(experiment=experiment)
    response = {
        "pk": experiment.pk,
        "fields": {
            "project": experiment.project.pk,
            "name": experiment.name,
            "llm_name": experiment.llm_name,
            "context_window": experiment.context_window,
            "max_new_tokens": experiment.max_new_tokens,
            "summaries": summaries_dict,
            "evaluation_results": auto_evaluation_total
        }
    }
    return response


@method_decorator(csrf_exempt, name='dispatch')
class ExperimentView(APIView):

    # get experiments by project (!) id
    def get(self, request):
        user = request.user
        try:
            project = Project.objects.get(pk=request.GET.get("project"))
            if project.author != user and not ProjectInvite.objects.filter(project=project, user=user).exists():
                return HttpResponse({"error": "Unauthorized access"}, status=403)
            experiments = Experiment.objects.filter(project=request.GET.get("project"))
            print("Experiment count: ", len(experiments))
            responses = []
            for experiment in experiments:
                print("Experiment in for loop:", experiment)
                responses.append(build_experiment_dict(experiment))
            return HttpResponse(json.dumps(responses), content_type='application/json')
        except Experiment.DoesNotExist:
            return HttpResponseServerError("No experiment with such project id.")

    @api_view(["GET"])
    def get_by_experiment_id(request):
        user = request.user

        try:
            experiment_id = request.GET.get("experiment")
            print("Experiemnt id is: " + experiment_id)
            if not experiment_id:
                return HttpResponseServerError("Missing experiment id.")

            experiment = Experiment.objects.get(pk=experiment_id)
            print("Experiment is: ", experiment)
            # TODO: repair this mechanism
            if experiment.project.author != user and not ProjectInvite.objects.filter(project=experiment.project,
                                                                                      user=user).exists():
                return HttpResponse({"error": "Unauthorized access"}, status=403)

            response = build_experiment_dict(experiment)
            return HttpResponse(json.dumps([response]), content_type='application/json')
        except Experiment.DoesNotExist:
            return HttpResponseServerError("No experiment with such id.")

    def get_paginated_summaries(request):
        user = request.user
        try:
            experiment_id = request.GET.get("experiment")
            page = int(request.GET.get("page", 1))
            page_size = int(request.GET.get("page_size", 10))

            if not experiment_id:
                return JsonResponse({"error": "Missing experiment id."}, status=400)

            experiment = Experiment.objects.get(pk=experiment_id)
            summaries = Summary.objects.filter(experiment=experiment_id).order_by("index", "created_at")

            total_count = summaries.count()
            start = (page - 1) * page_size
            end = start + page_size

            summaries_page = summaries[start:end]

            auto_evaluation_total = AutoEvaluation.objects.filter(
                content_type=ContentType.objects.get_for_model(Experiment),
                object_id=experiment.pk
            ).values().first()

            summaries_list = [
                {
                    "pk": summary.pk,
                    "fields": {
                        "experiment": experiment.pk,
                        "prompt": summary.prompt,
                        "summary": summary.summary,
                        "evaluation_results": AutoEvaluation.objects.filter(
                            content_type=ContentType.objects.get_for_model(Summary),
                            object_id=summary.pk
                        ).values().first(),
                        "reference_summary": summary.full_text.reference_summary,
                        "summarization_model": summary.summarization_model,
                        "index": summary.index,
                        "generated_summary": summary.generated_summary,
                        "full_text": summary.full_text.full_text,
                    }
                }
                for summary in summaries_page
            ]

            return JsonResponse({
                "pk": experiment.pk,
                "fields": {
                    "project": experiment.project.pk,
                    "name": experiment.name,
                    "llm_name": experiment.llm_name,
                    "context_window": experiment.context_window,
                    "max_new_tokens": experiment.max_new_tokens,
                    "summaries": summaries_list
                },
                "total_count": total_count,
                "page": page,
                "page_size": page_size
            }, status=200)


        except ValueError:
            return JsonResponse({"error": "Invalid page or page_size."}, status=400)
        except Experiment.DoesNotExist:
            return JsonResponse({"error": "No experiment found with the given ID."}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    # Distinguish different situations: 1. by uploading csv or use selected models to generate summaries 2. use fixed range or cutomized indexes.

    def post(self, request):
        user = request.user
        try:
            # Retrieve input parameters
            csv_file = request.FILES.get("csv_file", "")
            use_model = request.POST.get("use_model", "false").lower() == "true"
            summarization_model = request.POST.get("summarization_model", "").strip()
            api_link = request.POST.get("api_link", "").strip()
            llm_name = request.POST.get("llm_name", "").strip()
            name = request.POST.get("name", "").strip()
            fixed_range = request.POST.get("fixed_range", "false").lower() == "true"
            custom_ranges = request.POST.get("custom_ranges", None)
            project_id = request.POST.get("project", None)
            eval_metrics = request.POST.get("eval_metrics", "").split(",") if request.POST.get("eval_metrics",
                                                                                               "") else []
            api_key = request.POST.get("api_key", "")
            max_new_tokens = request.POST.get("max_new_tokens", None)
            context_window = request.POST.get("context_window", None)
            summary_ids = []

            # Debug input parameters
            print(f"Fixed Range: {fixed_range}")
            print(f"Start Record: {request.POST.get('start_record', 0)}")
            print(f"End Record: {request.POST.get('end_record', 0)}")
            print(f"Custom Ranges: {custom_ranges}")

            if not csv_file and not use_model and not api_link:
                return JsonResponse({
                    "error": "Either upload a CSV file, select a model or provide an api link for summary generation."},
                    status=400)
            if not project_id:
                return JsonResponse({"error": "Project ID is required."}, status=400)

            # Retrieve project
            try:
                project = Project.objects.get(pk=project_id)
            except Project.DoesNotExist:
                return JsonResponse({"error": "Project not found."}, status=404)

            # Check ownership or invitation
            is_project_owner = project.author == user
            if not is_project_owner:
                invite = ProjectInvite.objects.filter(project=project, user=user).first()
                if not invite:
                    return JsonResponse({"error": "Unauthorized access"}, status=403)

            # Parse and validate CSV if provided
            csv_data = []
            if csv_file:
                data = csv_file.read().decode("utf-8")
                csv_reader = list(csv.DictReader(data.splitlines()))
                if not csv_reader:
                    return JsonResponse({"error": "CSV file is empty or invalid."}, status=400)
                csv_data = csv_reader

            # Parse ranges
            selected_indices = []
            if fixed_range:
                start_record = int(request.POST.get("start_record", 0))
                end_record = int(request.POST.get("end_record", 0))
                print(f"Fixed Range Start: {start_record}, End: {end_record}")
                if start_record <= 0 or end_record <= 0:
                    return JsonResponse({"error": "Invalid fixed range values."}, status=400)

                selected_indices = list(range(start_record - 1, end_record))
                print(f"Selected Indices (Fixed Range): {selected_indices}")
            elif custom_ranges:
                try:
                    custom_ranges = json.loads(custom_ranges)
                    for range_item in custom_ranges:
                        start, end = range_item["start"], range_item["end"]
                        selected_indices.extend(list(range(start - 1, end)))
                except (KeyError, ValueError, TypeError):
                    return JsonResponse({"error": "Invalid custom range format."}, status=400)

            if not selected_indices:
                return JsonResponse({"error": "No valid indices found for processing."}, status=400)

            # Map selected indices to database records
            full_texts = FullText.objects.filter(
                project=project, index__in=selected_indices
            ).order_by("index")
            if not full_texts.exists():
                return JsonResponse(
                    {
                        "error": "No FullText objects found for the selected indices.",
                        "selected_indices": selected_indices,
                    },
                    status=400,
                )

            # Ensure summarization model is valid
            if summarization_model:
                try:
                    model_name = summarization_model.split(" - ")[1]
                    summarization_model = model_name.strip()
                except IndexError:
                    return JsonResponse({"error": "Invalid summarization model format."}, status=400)

            with transaction.atomic():
                # Create experiment
                new_experiment = Experiment.objects.create(
                    project=project,
                    name=name,
                    llm_name=llm_name,
                    context_window=request.POST.get("context_window",
                                                    None),
                    max_new_tokens=request.POST.get("max_new_tokens",
                                                    None),
                )

                # If the user is an invited user, update their experiment_ids
                if not is_project_owner and invite:
                    if new_experiment.pk not in invite.experiment_ids:
                        invite.experiment_ids.append(new_experiment.pk)
                        invite.save()

                # Process summaries
                bulk_summaries = []
                summaries = []
                reference_summaries = []
                print("Experiment in pagination: ", new_experiment)
                print("Experiment max new tokens in pagination: ", new_experiment.max_new_tokens)
                print("Experiment context_window in pagination: ", new_experiment.context_window)

                if csv_file:
                    # Validate CSV row count matches selected indices
                    if len(csv_data) != len(full_texts):
                        raise IntegrityError("Mismatch between CSV rows and selected indices.")

                    for idx, (row, full_text) in enumerate(zip(csv_data, full_texts), start=1):
                        prompt = row.get(request.POST.get("prompt_column", ""), "").strip() or request.POST.get(
                            "prompt", "").strip()
                        summary = row.get(request.POST.get("summary_column", ""), "").strip()

                        if not summary:
                            raise IntegrityError(f"Missing summary for FullText in row {idx}.")

                        # Assign the full text index for experiment summaries
                        bulk_summaries.append(
                            Summary(
                                experiment=new_experiment,
                                full_text=full_text,
                                prompt=prompt,
                                summary=summary,
                                index=full_text.index,
                            )
                        )
                        summaries.append(summary)
                        reference_summaries.append(full_text.reference_summary)

                    created_summaries = Summary.objects.bulk_create(bulk_summaries)
                    summary_ids = [summary.pk for summary in created_summaries]
                elif use_model:
                    # Generate summaries using the selected model
                    for idx, full_text in enumerate(full_texts, start=1):
                        prompt = request.POST.get("prompt", "").strip()
                        if summarization_model in ['gpt-4o-mini', 'o1-mini', 'o1-preview']:
                            open_ai_summarization = OpenAISummarization()
                            generated_summary = open_ai_summarization.generate_summary(
                                summarization_model, prompt, full_text.full_text, new_experiment.context_window,
                                new_experiment.max_new_tokens
                            )
                        else:
                            together_ai_summarization = TogetherAISummarization()
                            generated_summary = together_ai_summarization.generate_summary(
                                summarization_model, prompt, full_text.full_text, new_experiment.context_window,
                                new_experiment.max_new_tokens
                            )

                        new_summary = Summary.objects.create(
                            experiment=new_experiment,
                            full_text=full_text,
                            prompt=prompt,
                            summary=generated_summary,
                            generated_summary=generated_summary,
                            summarization_model=summarization_model,
                            index=full_text.index,
                        )
                        summaries.append(generated_summary)
                        reference_summaries.append(full_text.reference_summary)
                        summary_ids.append(new_summary.pk)
                elif api_link:
                    import requests

                    for idx, full_text in enumerate(full_texts, start=1):
                        prompt = request.POST.get("prompt", "").strip()
                        text_content = full_text.full_text.strip()
                        final_prompt = f"{prompt} {text_content}"

                        payload = {
                            "prompt": final_prompt,
                            "full_text": text_content,
                            "max_new_tokens": max_new_tokens,
                        }

                        try:

                            print(f"Payload for index {full_text.index}: {payload}")
                            # 192.168.0.77 needs to be replaced by actual localhost address
                            api_link = api_link.replace("localhost", "192.168.0.77")
                            print(f"Sending request to API Link: {api_link}")
                            response = requests.post(api_link, json=payload)
                            print("response:", response)
                            response.raise_for_status()
                            generated_summary = response.json().get("response", "")
                            print("generated summary:", generated_summary)

                            if not generated_summary:
                                raise Exception("API failed to generate summary for index {full_text.index}.")

                            new_summary = Summary.objects.create(
                                experiment=new_experiment,
                                full_text=full_text,
                                prompt=prompt,
                                summary=generated_summary,
                                generated_summary=generated_summary,
                                summarization_model=llm_name,
                                index=full_text.index,
                            )
                            summaries.append(generated_summary)
                            reference_summaries.append(full_text.reference_summary)

                        except requests.ConnectionError as conn_err:
                            print(f"Connection error for index {full_text.index}: {conn_err}")
                            return JsonResponse(
                                {"error": f"Failed to connect to the API: {conn_err}"}, status=500
                            )
                        except requests.Timeout:
                            print(f"Timeout error for index {full_text.index}")
                            return JsonResponse(
                                {"error": "The request to the API timed out. Please check the endpoint."},
                                status=500,
                            )
                        except requests.RequestException as req_err:
                            print(f"Request error for index {full_text.index}: {req_err}")
                            return JsonResponse(
                                {"error": f"An error occurred while calling the API: {req_err}"}, status=500
                            )

                # Handle pagination
                page = int(request.POST.get("page", 1))
                page_size = int(request.POST.get("page_size", 10))
                summaries = Summary.objects.filter(experiment=new_experiment).order_by("index")
                paginator = Paginator(summaries, page_size)

                try:
                    paginated_summaries = paginator.page(page)
                except Exception:
                    return JsonResponse({"error": "Invalid page number."}, status=400)

                # Construct the full_texts_list
            full_texts_list = [ft.full_text for ft in full_texts]
            summary_texts = [summary.summary or summary.generated_summary for summary in
                             Summary.objects.filter(experiment=new_experiment)]

            if eval_metrics:
                task = calculate_metrics.delay(eval_metrics, summary_texts, summary_ids, reference_summaries,
                                               full_texts_list, new_experiment.pk, api_key)
                # cache task_id for a day
                cache.set(f'{new_experiment.pk}', task.id, 60 * 60 * 24)


            summaries_data = [
                {
                    "index": summary.index,
                    "prompt": summary.prompt,
                    "summary": summary.summary or summary.generated_summary,
                    "created_at": summary.created_at,
                }
                for summary in paginated_summaries
            ]

            # Return paginated summaries
            return JsonResponse({
                "experiment": new_experiment.pk,
                "name": new_experiment.name,
                "summaries": summaries_data,
                "total_pages": paginator.num_pages,
                "current_page": page,
                "task": {} if not eval_metrics else {
                    'task_id': task.id,
                    'status_endpoint': f'/api/tasks/{task.id}/status/',
                    'monitoring_interval': 5000
                },
            }, status=201)

        except Project.DoesNotExist:
            return JsonResponse({"error": "No project found with the given project ID."}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    # update experiment based on a given project (!) id
    def patch(self, request):
        user = request.user
        try:
            data = json.loads(request.body)
            experiment = Experiment.objects.get(project=data.get("project"))
            if experiment.project.author != user:
                return Response({"error": "Unauthorized access"}, status=403)
            for key, value in data.items():
                setattr(experiment, key, value)
            experiment.save()

            return HttpResponse(serialize("json", [experiment]))
        except Experiment.DoesNotExist:
            return HttpResponseServerError(json.dumps({"error": "No experiment found for the given project id."}))
        except Exception:
            return HttpResponseServerError(json.dumps({"error": "An unexpected error occurred."}))

    # TODO: delete experiment by its own id
    def delete(self, request):
        user = request.user
        try:
            experiment = Experiment.objects.get(pk=request.GET.get("pk"))
            project = experiment.project
            # Check if the user is the project owner
            is_project_owner = project.author == user

            # Check if the user is an invited user who created the experiment
            is_experiment_creator = ProjectInvite.objects.filter(
                user=user, project=project, experiment_ids__contains=[experiment.pk]
            ).exists()

            # Allow deletion only if the user is the project owner or the experiment creator
            if not is_project_owner and not is_experiment_creator:
                return HttpResponse({"error": "Unauthorized access"}, status=403)

            experiment.delete()
            return JsonResponse({"message": "Experiment deleted successfully"}, status=200)
        except Experiment.DoesNotExist:
            return HttpResponse({"error": "No experiment with such id."}, status=404)


@method_decorator(csrf_exempt, name='dispatch')
class ExperimentSummaryView(APIView):
    def get(self, request):
        user = request.user
        try:
            project_id = request.GET.get("project")
            project = Project.objects.get(pk=project_id)

            # Check if the user is the author or an invited user
            if project.author != user and not ProjectInvite.objects.filter(project=project, user=user).exists():
                return JsonResponse({"error": "Unauthorized access."}, status=403)

            experiments = Experiment.objects.filter(project=project_id)
            experiment_list = []
            for experiment in experiments:
                evaluation_results = AutoEvaluation.objects.filter(
                    content_type=ContentType.objects.get_for_model(Experiment),
                    object_id=experiment.pk
                ).values().first()

                # Determine if pagination is supported
                summary_count = Summary.objects.filter(experiment=experiment.pk).count()
                supports_pagination = summary_count > 10

                # Fetch indices used in this experiment
                summary_indices = Summary.objects.filter(experiment=experiment.pk).values_list("index", flat=True)
                indexed_range = {
                    "start": min(summary_indices) if summary_indices else None,
                    "end": max(summary_indices) if summary_indices else None,
                    "indices": list(summary_indices),
                }

                # Check if the user is the owner of the experiment
                is_experiment_owner = (
                        project.author == user or  # Project owner
                        ProjectInvite.objects.filter(
                            user=user,
                            project=project,
                            experiment_ids__contains=[experiment.pk]
                        ).exists()  # Experiment creator
                )

                # Build experiment data with fields
                experiment_list.append({
                    "pk": experiment.pk,
                    "fields": {
                        "name": experiment.name,
                        "llm_name": experiment.llm_name,
                        "context_window": experiment.context_window,
                        "max_new_tokens": experiment.max_new_tokens,
                        "evaluation_results": evaluation_results or None,
                        "project": experiment.project.pk,
                        "experiment": experiment.pk,
                        "supportsPagination": supports_pagination,
                        "indexedRange": indexed_range,
                        "owner": is_experiment_owner,
                    }
                })

            return JsonResponse(experiment_list, safe=False, status=200)

        except Project.DoesNotExist:
            return JsonResponse({"error": "No project found with the given ID."}, status=404)
        except Exception as e:
            print(e)
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ExperimentOwnershipView(APIView):
    def get(self, request):
        try:
            experiment_id = request.GET.get("experiment")
            if not experiment_id:
                return JsonResponse({"error": "Experiment ID is required."}, status=400)

            user = request.user
            try:
                experiment = Experiment.objects.get(pk=experiment_id)
                project = experiment.project

                is_owner = (
                        project.author == user or
                        ProjectInvite.objects.filter(
                            user=user,
                            project=project,
                            experiment_ids__contains=[experiment_id]
                        ).exists()
                )

                return JsonResponse({"isOwner": is_owner}, status=200)

            except Experiment.DoesNotExist:
                return JsonResponse({"error": "Experiment not found."}, status=404)

        except Exception as e:
            print(f"Error: {e}")
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)
