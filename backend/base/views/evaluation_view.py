import csv
import io
from django.utils import timezone
import json
from django.http import HttpResponse, HttpResponseServerError
from django.views.decorators.csrf import csrf_exempt
from django.core.serializers import serialize
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view
from rest_framework.permissions import BasePermission


from ..models.summary_model import Summary

from ..models.experiment_model import Experiment

from ..models.survey_model import Survey

from ..models.invitation_model import Invitation

from ..models.evaluation_model import Evaluation
from ..serializers import EvaluationSerializer, SurveySerializer
from django.utils.decorators import method_decorator
from django.db import transaction
from rest_framework.views import APIView
from django.db.models import F
from base.models.project_invite_model import ProjectInvite



class AllowPostAny(BasePermission):
    """
    Custom permission to allow anyone to POST, but require
    authentication for other request methods.
    """
    def has_permission(self, request, view):
        if request.method == 'POST':
            return True
        return request.user and request.user.is_authenticated

@method_decorator(csrf_exempt, name="dispatch")
class EvaluationView(APIView):

    permission_classes = [AllowPostAny]

    def post(self, request):
        try:
            invitation_uuid = request.data.get("invitation")
            if not invitation_uuid:
                return HttpResponseServerError("Missing invitation uuid.")
            invitation = Invitation.objects.get(uuid = invitation_uuid) 
            request.data["invitation"] = invitation.pk
            serializer = EvaluationSerializer(data=request.data)
            if serializer.is_valid():
                invitation = serializer.validated_data.get('invitation')
                if timezone.now() > invitation.survey.active_until:
                    return HttpResponseServerError(json.dumps({"error": "Invitation has expired."}))
                with transaction.atomic():
                    serializer.save()
                    invitation.number_of_evaluations = F('number_of_evaluations') + 1
                    invitation.save()
                return HttpResponse(json.dumps(serializer.data))
            return HttpResponseServerError("Invalid JSON body.")
        except Exception as e:
            print(e)
            return HttpResponseServerError("An unexpected error occurred.")
        
    # get all evaluations for a certain experiment
    def get(self, request):
        user = request.user
        experiment_id = request.GET.get("experiment")
        experiment = Experiment.objects.get(pk=experiment_id)

        # Check if the user is the author or an invited user
        if experiment.project.author != user and not ProjectInvite.objects.filter(project=experiment.project, user=user).exists():
            return HttpResponse({"error": "Unauthorized access"}, status=403)
        
        summaries = Summary.objects.filter(experiment=experiment_id)

        evaluations_per_summary = []
        for summary in summaries:
            evaluations = Evaluation.objects.filter(summary=summary.pk)
            serialized_evals =  EvaluationSerializer(evaluations, many=True).data
            for eval in serialized_evals:
                eval["highlighting_advice"] = Invitation.objects.get(pk=eval.get("invitation")).survey.highlight_question
            evaluations_per_summary.append({"summary_id": summary.pk, "evaluations": serialized_evals})
        return HttpResponse(json.dumps(evaluations_per_summary))
    

    @csrf_exempt
    @api_view(["GET"])
    def get_csv(request):
        user = request.user
        survey_id = request.GET.get("survey")
        survey = Survey.objects.get(pk=survey_id)
        if survey.project.author != user and not ProjectInvite.objects.filter(project=survey.project, user=user).exists():
            return HttpResponse({"error": "Unauthorized access"}, status=403)
                    
        invitations = Invitation.objects.filter(survey=survey_id)


        # retrieve all evaluations for a survey
        evaluations = []
        for invitation in invitations:
            evals = Evaluation.objects.filter(invitation=invitation.pk)
            evaluations.extend(evals)

        # prepare IO stream
        output = io.StringIO()

        # define csv header
        survey = Survey.objects.get(pk=survey_id)
        fields = [metric.get("name") for metric in survey.metrics]
        writer = csv.writer(output)
        writer.writerow(["invitee", "submission_timestamp", "experiment", "summary"] + fields + ["comment", "highlights"]) # additional column for identifying who has given the evaluation

        # write all evaluation objects into the stream
        for evaluation in evaluations:
            writer.writerow([evaluation.invitation.email_address, evaluation.created_at, evaluation.summary.experiment.name, evaluation.summary.summary] + [evaluation.ratings.get(metric) for metric in fields] + [evaluation.comment, evaluation.highlights])
        
        # write stream to csv
        csv_content = output.getvalue()
        output.close()
        file_name = "survey" + "_" + request.GET.get("survey") + "_" + "evaluations" + ".csv"

        # return HTTP response
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response

    
    #TODO: May not be needed
    def delete(self, request):
        user = request.user
        try:
            evaluation = Evaluation.objects.get(pk=request.GET.get("pk"))
            if evaluation.invitation.survey.project.author != user:
                return HttpResponse ({"error": "Unauthorized access"}, status=403)
            evaluation.delete()
            return HttpResponse({"message": "Evaluation deleted successfully"}, status=200)
        except Evaluation.DoesNotExist:
            return HttpResponse({"error": "No evaluation with such id."}, status=404)

