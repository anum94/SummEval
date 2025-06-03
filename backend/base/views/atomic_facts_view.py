import json

from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from ..evaluation.metrics.factscore.atomic_facts import get_atomic_facts_for_paragraph


@permission_classes([AllowAny])
@method_decorator(csrf_exempt, name='dispatch')
class AtomicFactsView(APIView):

    def post(self, request):
        paragraph_data = json.loads(request.body)
        paragraph = paragraph_data.get("paragraph", "")

        if paragraph is None or len(paragraph) == 0:
            return JsonResponse({})

        response = get_atomic_facts_for_paragraph(paragraph)

        return JsonResponse(response)
