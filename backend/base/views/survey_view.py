from django.http import HttpResponse, HttpResponseServerError, JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
import json
from django.utils.decorators import method_decorator
from django.views import View
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from django.utils import timezone
from dateutil import parser
from datetime import timedelta
from dotenv import load_dotenv
import os
from sendgrid.helpers.mail import *
from django.core.serializers import serialize
from django.db import transaction
from django.db.models import Prefetch
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes, api_view
from base.models.project_invite_model import ProjectInvite

from ..serializers import EvaluationSerializer, ExperimentSerializer, InvitationSerializer, SurveySerializer

from ..models.evaluation_model import Evaluation

from ..models.experiment_model import Experiment
from ..models.summary_model import Summary
from ..models.survey_model import Survey



from ..models.project_model import Project
from ..models.invitation_model import Invitation

@csrf_exempt
@permission_classes([AllowAny])
def get_all_summaries(request):

    # Retrieve the corresponding survey
    # survey = Survey.objects.get(pk=request.GET.get("survey_id"))

    # Retrieve the corresponding survey and invitation
    invitation = Invitation.objects.get(uuid=request.GET.get("invitation"))
    survey = invitation.survey


    # Check if survey has expired
    if timezone.now() > survey.active_until:
        return HttpResponseServerError(json.dumps({"error": "Invitation has expired."}))


    # Retrieve the existing evaluations that the user has made in this invitation
    evaluations = Evaluation.objects.filter(invitation=invitation.pk)

    # Retrieve the survey's corresponding summaries and joing them with the evaluation for each survey
    summaries = survey.summaries.prefetch_related(
        Prefetch('evaluations', queryset=evaluations, to_attr='evaluation')
    ).all()
    
    fulltext_summaries_pairs = {}
    for summary in summaries:
        fulltext_summaries_pairs.setdefault(summary.full_text, []).append({"pk": summary.pk, "summary": summary.summary, "evaluation": None if len(summary.evaluation) == 0 else EvaluationSerializer(summary.evaluation[0]).data})
    fulltext_summaries_list = []
    for full_text in fulltext_summaries_pairs:
        fulltext_summaries_list.append({"pk": full_text.pk, "full_text": full_text.full_text, "summaries": fulltext_summaries_pairs[full_text]})
    
    return JsonResponse({"survey": SurveySerializer(survey).data, "invitation": InvitationSerializer(invitation).data, "texts": fulltext_summaries_list}, safe=False)



# TODO: Do we need a DELETE method for Survey?
@method_decorator(csrf_exempt, name='dispatch')
class SurveyView(APIView):

    def sendInvitation(self, invitation, active_until, survey_name):
        recipient = invitation.email_address

        #load_dotenv()
        #baseurl = os.getenv('BASE_URL')
        environment = os.getenv('DJANGO_ENV', 'development')
        env_file = '.env.production' if environment == 'production' else '.env.development'
        print(f"Loading .env file: {env_file}")
        load_dotenv(env_file)
        
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        print(f"Loaded FRONTEND_URL: {os.getenv('FRONTEND_URL')}")
        # Parse the time string into a datetime object
        # parsed_time = parser.parse(active_until)
        # Format the datetime object into a human-readable format
        parsed_time = parser.parse(active_until)
        formatted_time = parsed_time.strftime("%B %d %Y")

        url = f"{frontend_url}/summaryeval/{invitation.uuid}/"

        message = Mail(
            from_email=os.environ.get("FROM_EMAIL_ADDRESS"),
            to_emails=recipient,
            subject=f"You got invited to {survey_name} on SummEval!",
            html_content=f"""
            <html>
                <body>
                    <p>Hi there,</p>
                    <p>You were invited to the survey {survey_name} on SummEval. Click the button below to start evaluating LLM-generated text summaries:</p>
                    <p><a href="{url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #1a73e8; text-decoration: none; border-radius: 5px;">Start Evaluating</a></p>                    
                    <p>You have time until {formatted_time} to complete the survey. Until then, it is possible to pause the evaluation and return later at any time.
                    <p>Kind regards,<br>Your SummEval Team</p>
                </body>
            </html>
            """)
        try:
            sg = SendGridAPIClient(os.environ.get("SENDGRID_API_KEY"))
            response = sg.send(message)
        except Exception as e:
            print(e)

    def sendDeadlineUpdateEmail(self, invitation, active_until, created_at, survey_name):
        recipient = invitation.email_address

        # Parse the time string into a datetime object
        new_deadline = parser.parse(active_until)

        # Contrary to the deadline (= string), creation_date already is a datetime object. No need to parse it
        # creation_date = parser.parse(created_at)

        # Format the datetime object into a human-readable format
        formatted_deadline = new_deadline.strftime("%B %d %Y")
        formatted_created_at = created_at.strftime("%B %d %Y")
        environment = os.getenv('DJANGO_ENV', 'development')
        env_file = '.env.production' if environment == 'production' else '.env.development'
        load_dotenv(env_file)
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000") 
        print(f"Loaded FRONTEND_URL: {os.getenv('FRONTEND_URL', 'NOT SET')}")
        # Dynamically construct the URL
        url = f"{frontend_url}/summaryeval/{invitation.uuid}/"
        message = Mail(
            from_email=os.environ.get("FROM_EMAIL_ADDRESS"),
            to_emails=recipient,
            subject=f"Your Invitation to {survey_name} on SummEval has been updated.",
            html_content=f"""
            <html>
                <body>
                    <p>Hi there,</p>
                    <p>On {formatted_created_at}, you were invited to the survey {survey_name} on SummEval. The project administrator has just set a new expiration date. You now have time until {formatted_deadline} to complete the survey. Until then, it is possible to pause the evaluation and return later at any time.</p>
                    <p>Click the button below to start evaluating LLM-generated text summaries:</p>
                    <p><a href="{url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #1a73e8; text-decoration: none; border-radius: 5px;">Start Evaluating</a></p>                    
                    <p>Kind regards,<br>Your SummEval Team</p>
                </body>
            </html>
            """)
        try:
            sg = SendGridAPIClient(os.environ.get("SENDGRID_API_KEY"))
            response = sg.send(message)
        except Exception as e:
            print(e)

    def post(self, request):
        user = request.user
        try:
            data = json.loads(request.body)
            project = Project.objects.get(pk=data.get("project", None))
            
            # Check if the requesting user is the project author or an accepted invitee
            is_author = project.author == user
            is_invitee = ProjectInvite.objects.filter(project=project, user=user, status=ProjectInvite.InviteStatus.ACCEPTED).exists()

            if not is_author and not is_invitee:
                return Response({"error": "Unauthorized access"}, status=403)
            invitees = data.get("invitees", None)
            
            if not invitees or len(invitees) == 0:
                return HttpResponseServerError(json.dumps({"error": "Missing invitees."}))

            # Retrieve all experiments of the corresponding project
            all_experiments_of_project = Experiment.objects.filter(project=project.pk)

            # Retrieve selected experiment IDs to create a survey on. Can also be all IDs of a project
            selected_experiment_ids = data.get("experiment_ids", None)
            if not selected_experiment_ids:
                return HttpResponseServerError(json.dumps({"error": "Missing experiment IDs."}))
            
            metrics = data.get("metrics", None)
            if not metrics or len(metrics) == 0:
                return HttpResponseServerError(json.dumps({"error": "Missing metrics."}))
            
            name = data.get("survey_name", None)
            if not name:
                return HttpResponseServerError(json.dumps({"error": "Missing survey name."}))

            # Filter project's experiments by the desired ones. Simultaneously, we make sure that no experiments that are not part of the project can be part of the survey
            experiments = [exp for exp in all_experiments_of_project if exp.pk in selected_experiment_ids]
            
            # Retrieve all summaries of the desired experiments
            summaries = []
            for exp in experiments:
                summaries.extend(Summary.objects.filter(experiment=exp.pk))

            with transaction.atomic():
                # Create a new survey
                new_survey = Survey.objects.create(
                    name=name,
                    project=project,
                    highlight_question=data.get("highlight_question", None),
                    metrics=metrics,
                    active_until=data.get("survey_end_date", timezone.now() + timedelta(days=7))
                )

                # Assign the summaries to the many-to-many field
                new_survey.summaries.set(summaries)
                # Save the survey object
                new_survey.save()

                # Create an invitation for all invitees
                for invitee in invitees:
                    new_invitation = Invitation(
                        survey=new_survey,                        
                        email_address=invitee,
                        ask_for_personal_data=data.get("ask_for_personal_data", None),
                    )
                    new_invitation.full_clean()  # This will perform validation checks
                    new_invitation.save()

                    # Send out invitation emails
                    self.sendInvitation(new_invitation, new_survey.active_until, survey_name=new_survey.name)
                response = Survey.objects.get(pk=new_survey.pk)
                return HttpResponse(serialize("json", [response]), status=201)
        except Project.DoesNotExist:
            return HttpResponseServerError(json.dumps({"error": "No project found for the given project id."}))
        except ValidationError:
            return HttpResponseServerError(json.dumps({"error": "Invalid email address."}))
        except Exception as e:
            print(e)
            return HttpResponseServerError(json.dumps({"error": "An unexpected error occurred."}))       

    # Get either all survey of corresponding project or single survey for given survey id
    def get(self, request):
        user = request.user
        try:
            project_id = request.GET.get("project")
            survey_id = request.GET.get("survey")
            if (project_id and survey_id) or (not survey_id and not project_id):
                return HttpResponseServerError(json.dumps({"error": "Either survey id or project id must be given as a search parameter."}))  
            elif project_id:
                project = Project.objects.get(pk=project_id)
                # Check if the user is the author or an invited user
                if project.author != user and not ProjectInvite.objects.filter(project=project, user=user).exists():
                    return Response({"error": "Unauthorized access"}, status=403)
                surveys = Survey.objects.filter(project=project_id)
                return HttpResponse(serialize("json", surveys))
            # Case: Retrieve a specific survey
            elif survey_id:
                survey = Survey.objects.get(pk=survey_id)
                # Check if the user is the author or an invited user
                if survey.project.author != user and not ProjectInvite.objects.filter(project=survey.project, user=user).exists():
                    return Response({"error": "Unauthorized access"}, status=403)
                return HttpResponse(serialize("json", [survey]))

        except Exception as e:
            print(e)
            return HttpResponseServerError(json.dumps({"error": "An unexpected error occurred."}))

    ## currently it is only allowed to update the survey deadline
    def patch(self, request):
        user = request.user
        try:
            data = json.loads(request.body)
            survey = Survey.objects.get(pk=data.get("pk"))
            if survey.project.author != user:
                return Response({"error": "Unauthorized access"}, status=403)
            new_active_until = data.get("active_until")
            survey.active_until = new_active_until
            survey.save()
            invitations = Invitation.objects.filter(survey = survey.pk)
            for invitation in invitations:
                self.sendDeadlineUpdateEmail(invitation=invitation, active_until=survey.active_until, created_at=survey.created_at, survey_name=survey.name)
            return HttpResponse()
        except Survey.DoesNotExist:
            return Response({"error": "No survey with such id."}, status=404)
            
    
    # TODO: Better documentation of this method
    # it is possible to retrieve either overall project performance or performance per survey
    @api_view(["GET"])
    def retrieve_performance_overview(request):
        user = request.user
        try:
            project_id = request.GET.get("project")
            survey_id = request.GET.get("survey")

            invitations = []
            metrics = []
            summaries = []

            # case: either project id and survey id are provided or none is provided. It mus be either project or survey id         
            if (not survey_id and not project_id) or (survey_id and project_id):
                return HttpResponseServerError({"error": "Either a survey id or a project id must be provided"})
            
            # case: user wants to retrieve overall project performance
            elif project_id:
                project = Project.objects.get(pk=project_id)

                # Check if the user is the author or an invited user
                if project.author != user and not ProjectInvite.objects.filter(project=project, user=user).exists():
                    return HttpResponse({"error": "Unauthorized access"}, status=403)

                surveys = Survey.objects.filter(project=project_id)
                for survey in surveys:
                    metrics = metrics + list(map(lambda item: item["name"], survey.metrics))
                    invs = Invitation.objects.filter(survey=survey.pk)
                    invitations.extend(invs)
                    summaries.extend(survey.summaries.all())

                metrics = list(set(metrics))

            # case: user wants to retrieve single survey performance
            else:
                survey = Survey.objects.get(pk=survey_id)

                # Check if the user is the author or an invited user
                if survey.project.author != user and not ProjectInvite.objects.filter(project=survey.project, user=user).exists():
                    return HttpResponse({"error": "Unauthorized access"}, status=403)

                metrics = list(map(lambda item: item["name"], survey.metrics))
                invitations = Invitation.objects.filter(survey=survey.pk)
                summaries.extend(survey.summaries.all())


            evaluations = []
            for invitation in invitations:
                evals = Evaluation.objects.filter(invitation=invitation.pk)
                evaluations.extend(evals)

            experiment_evaluations = {}
            # distinct_experiments = Experiment.objects.filter(id__in=summaries.values_list('experiment', flat=True).distinct())

            # retrieve a distinct list of all experiments that have been evaluated
            distinct_experiment_ids = list(set(summary.experiment.pk for summary in summaries))
            distinct_experiments = Experiment.objects.filter(id__in=distinct_experiment_ids)

            # build a list of dicts. Each dict coresponds to one experiment. The dict contains the experiment (meta) data and a list of all evaluations that have been given for the experiment
            for exp in distinct_experiments:
                experiment_evaluations[exp.pk] = {"experiment": ExperimentSerializer(exp).data, "evaluations": []}
            for evaluation in evaluations:
                experiment_evaluations[evaluation.summary.experiment.pk]["evaluations"].append(EvaluationSerializer(evaluation).data)
            
            # Now, convert the list. We want to have a list of dicts which contain the experiment (meta) data and the average scores for each metric
            experiment_avg_evaluations = []
            for exp_id in experiment_evaluations.keys(): # iterate over all experiments
                avg_ratings = {} 
                # I commented this out, because we don't want to initialize the metrics with 0. This way, experiments, which have not (yet) been evaluated according to a certain metric, will have "None" as their average score. This is semantically precise, as we don't want to set unevaluated experiments to 0, which would be thw worst score, by default.
                # for metric in metrics: # initialize metric scores with 0
                #     print(metric)
                #     avg_ratings[metric] = 0
                exp_eval = experiment_evaluations[exp_id]
                for eval in exp_eval["evaluations"]: # iterate over the experiment's evaluations and sum up the scores for each metric
                    for metric in metrics:
                        if eval["ratings"].get(metric, None) != None:
                            avg_ratings[metric] = avg_ratings.get(metric, 0) + eval["ratings"].get(metric, 0)
                # For each metric, divide by the number of evaluations to calculate the average
                for metric in metrics:
                    if len(exp_eval["evaluations"]) > 0 and avg_ratings.get(metric, None) != None:
                        avg_ratings[metric] = avg_ratings[metric] / len(exp_eval["evaluations"])
                experiment_avg_evaluations.append({"experiment": experiment_evaluations[exp_id]["experiment"], "avg_evaluations": avg_ratings, "number_of_evaluations": len(exp_eval["evaluations"])})
            return HttpResponse(json.dumps({"metrics": metrics, "data": experiment_avg_evaluations}))

        except Exception as e:
            print(e)
            return HttpResponseServerError(json.dumps({"error": "An unexpected error occurred."}))  