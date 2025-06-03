import csv
from django.http import HttpResponse, HttpResponseServerError, JsonResponse
import json
from django.utils.decorators import method_decorator
from django.db import transaction, IntegrityError
from django.views import View
from ..models.fulltext_model import FullText
from ..models.project_model import Project
from django.views.decorators.csrf import csrf_exempt
from django.core.serializers import serialize
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination


class FullTextPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 500
    page_query_param = 'page'

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'page_size': self.page.paginator.per_page,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
        })



# TODO: Ask David how to handle the creation of FullText here compared to the one in project creation
# TODO: Ask David if we need to handle GET and PATCH requests for FullText
@method_decorator(csrf_exempt, name='dispatch')
class FullTextView(APIView):
    # TODO: Authorize user
    def get(self, request):
        try:
            project_id = request.GET.get("project")
            project = Project.objects.get(pk=project_id)
            full_texts = FullText.objects.filter(project=project).select_related("project").order_by("id")
            # return HttpResponse(serialize("json", full_texts), content_type='application/json')
            # Apply pagination
            paginator = FullTextPagination()
            paginated_full_texts = paginator.paginate_queryset(full_texts, request)
            serialized_data = json.loads(serialize("json", paginated_full_texts))

            return Response({
                'count': full_texts.count(),
                'page_size': paginator.page_size,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
                'results': serialized_data,
            })

        except Project.DoesNotExist:
            return HttpResponseServerError(json.dumps({"error": "No project found for the given project id."}))
        except Exception as e:
            print(e)
            return HttpResponseServerError(json.dumps({"error": "An unexpected error occurred."}))

    # TODO: May not be needed
    def post(self, request):
        user = request.user
        try:
            csv_file = request.FILES.get("csv_file", "")
            chunk_index = int(request.POST.get("chunk_index"))
            chunk_size = int(request.POST.get("chunk_size"))

            if not csv_file or not csv_file.name.endswith(".csv"):
                return HttpResponseServerError(json.dumps({"error": "Please upload a .csv file."}))

            data = csv_file.read().decode("utf-8")
            csv_reader = csv.DictReader(data.splitlines())
            project_id = request.POST.get('project')
            project = Project.objects.get(pk=project_id)

            if not project:
                return HttpResponseServerError(json.dumps({"error": "No project found for the given project id."}))

            if project.author != user:
                return Response({"error": "Unauthorized access"}, status=403)

            full_text_column = request.POST.get('full_text_column').strip()
            reference_summary_column = request.POST.get('reference_summary_column').strip()

            if not full_text_column:
                return HttpResponseServerError(json.dumps({"error": "Missing attribute."}))

            with transaction.atomic():
                full_texts = []
            
                # Iterate over the csv
                for index, row in enumerate(csv_reader):
                    full_text = row.get(full_text_column, "").strip()
                    reference_summary = row.get(reference_summary_column, "").strip()
                    whole_file_index = (chunk_index * chunk_size) + index
                    # If full text is missing from one row skip it
                    if not full_text:
                        raise IntegrityError(
                            f"No Full text given in row {whole_file_index + 2}"
                        )

                    # For each row, store a new prompt-summary pair together with its FK to the experiment
                    full_text = FullText.objects.create(
                        project=project,
                        full_text=full_text,
                        reference_summary=reference_summary,
                        index=whole_file_index
                    )
                    #print("Full text is in FULLTEXT VIEW: " + full_text)
                    #print("Summarized field is in FULLTEXT VIEW: " + summarization_text)
                    full_texts.append(full_text)
                # Return new full texts as HTTP
                return HttpResponse(serialize("json", full_texts), status=201)

        except Project.DoesNotExist:
            return HttpResponseServerError(json.dumps({"error": "No project found for the given project id."}))
        except Exception as e:
            return HttpResponseServerError(json.dumps({"error": "An unexpected error occurred." + str(e)}))

    # TODO: May not be needed
    def delete(self, request):
        user = request.user
        try:
            full_text = FullText.objects.get(pk=request.GET.get('id'))
            if full_text.project.author != user:
                return Response({"error": "Unauthorized access"}, status=403)
            full_text.delete()
            return Response({"message": "FullText deleted successfully"}, status=200)
        except FullText.DoesNotExist:
            return Response({"error": "No FullText with such id."}, status=404)
