from django.http import HttpResponse, HttpResponseServerError, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
from rest_framework.views import APIView
from django.core.serializers import serialize
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework.decorators import permission_classes
from rest_framework.permissions import BasePermission

from ..models.survey_model import Survey


from ..models.invitation_model import Invitation
from ..serializers import EvaluatorDataSerializer, InvitationSerializer
from base.models.project_invite_model import ProjectInvite



class AllowPatchAny(BasePermission):
    """
    Custom permission to allow anyone to POST, but require
    authentication for other request methods.
    """
    def has_permission(self, request, view):
        if request.method == 'PATCH':
            return True
        return request.user and request.user.is_authenticated

@method_decorator(csrf_exempt, name='dispatch')
class InvitationView(APIView):

    permission_classes = [AllowPatchAny]

    def get(self, request):
        user = request.user
        try:
            survey = Survey.objects.get(pk = request.GET.get("survey"))
            if survey.project.author != user and not ProjectInvite.objects.filter(project=survey.project, user=user).exists():
                return Response({"error": "Unauthorized access"}, status=403)
            invitations = Invitation.objects.filter(survey = request.GET.get("survey"))
            return HttpResponse(serialize("json", invitations))
        except Invitation.DoesNotExist:
                return HttpResponseServerError("No invitation with such id.")
    
    # Currently, it is only allow to update "role", "background", "highest_degree", "nlp_experience", "ask_for_personal_data"
    def patch(self, request):
        invitation = Invitation.objects.get(uuid = request.data.get("invitation"))
        patch_body = request.data.get("patch_body")
        serializer = EvaluatorDataSerializer(invitation, data=patch_body, partial=True)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(data=serializer.data)
        return HttpResponseServerError(json.dumps({"error": "An unexpected error occurred."}))