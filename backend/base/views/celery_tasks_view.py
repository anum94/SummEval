from celery.result import AsyncResult
from django.core.cache import cache
from django.http import JsonResponse
from rest_framework.decorators import api_view


@api_view(["GET"])
def task_status(request, task_id):
    try:

        task = AsyncResult(task_id)

        if task.state == 'PROGRESS':
            meta = task.info
            response = {
                'state': task.state,
                'progress': meta['total_progress'],
                'active_phases': meta.get('active_phases', []),
                'completed_phases': meta.get('completed_phases', [])
            }
        else:
            response = {
                'state': task.state,
                'result': task.result if task.successful() else None,
                'error': task.info if task.failed() else None
            }

        return JsonResponse(response)
    except Exception as e:
        return JsonResponse(
            {'error': f'Invalid task ID or backend issue: {str(e)}'},
            status=400
        )


@api_view(["GET"])
def get_task_id_from_cache(request, cache_key):
    task_id = cache.get(cache_key)

    if not task_id:
        return JsonResponse(
            {'error': f'Task ID not found in cache'},
            status=404
        )

    return JsonResponse({'task_id': task_id})
