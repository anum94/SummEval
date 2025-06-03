import csv
from django.db import transaction
from django.http import HttpResponse, HttpResponseServerError, JsonResponse
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
import json
from django.utils.decorators import method_decorator
from django.views import View
from django.core.serializers import serialize

from ..models.project_model import Project
from ..models.experiment_model import Experiment
from ..models.fulltext_model import FullText

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from ..serializers import ProjectSerializer
from base.models.project_invite_model import ProjectInvite

# TODO: Could be deleted
@csrf_exempt
def delete_all(request):
    try:
        deleted_count, _ = Project.objects.all().delete()
        print(f"Number of deletions: {deleted_count}")
        return HttpResponse()
    except Exception as e:
        print(e)
        return HttpResponseServerError("An unexpected error occurred.")


@method_decorator(csrf_exempt, name='dispatch')
class ProjectView(APIView):

    def get(self, request):
        user = request.user
        pk = request.GET.get("pk")

        if pk is not None:
            try:
                project = Project.objects.get(pk=pk)

                # Check if the user is the author or an invited user via ProjectInvite
                if project.author != user and not ProjectInvite.objects.filter(project=project, user=user).exists():
                    return Response({"error": "Unauthorized access"}, status=403)
                
                invite = ProjectInvite.objects.filter(project=project, user=user).first()
                invite_status = invite.status if invite else None

                experiments = Experiment.objects.filter(project=project.pk)
                experiments_list = [{
                    "pk": experiment.pk,
                    "name": experiment.name,
                    # Add other fields as needed
                } for experiment in experiments]
                
                response = {
                    "pk": project.pk,
                    "fields": {
                        "name": project.name,
                        "description": project.description,
                        "tags": project.tags,  
                        "experiments": experiments_list,
                        "invite_status": invite_status, 
                    }
                }
                return HttpResponse(json.dumps(response), content_type='application/json')
            except Project.DoesNotExist:
                return Response({"error": "No project with such id"}, status=404)
        else:
            matching_invites = ProjectInvite.objects.filter(email=user.email)
            
            if matching_invites.exists():
                matching_invites.update(user=user, email=None)
            # Retrieve all projects the user has access to (author or invited)
            authored_projects = Project.objects.filter(author=user)
            invited_projects = Project.objects.filter(id__in=ProjectInvite.objects.filter(user=user).values_list('project_id', flat=True))
            projects = authored_projects | invited_projects 

            responses = []
            for project in projects.distinct():  # Avoid duplicates
                experiments = Experiment.objects.filter(project=project.pk)
                experiments_list = [{
                    "pk": experiment.pk,
                    "name": experiment.name,
                    # Add other fields as needed
                } for experiment in experiments]
                
                # Check if the user is invited and get the status
                invite = ProjectInvite.objects.filter(project=project, user=user).first()
                invite_status = invite.status if invite else None 

                responses.append({
                    "pk": project.pk,
                    "fields": {
                        "name": project.name,
                        "description": project.description,
                        "tags": project.tags,
                        "experiments": experiments_list,
                        "invite_status": invite_status, 
                    }
                })
            return HttpResponse(json.dumps(responses), content_type='application/json')

    # No authentication needed for this method as it is used to create a new project and full texts. TEST THIS
    def post(self, request):
        try:
            name = request.POST.get("name", "").strip()
            description = request.POST.get("description", "").strip()
            tags = request.POST.get("tags", []).strip()
            tags_list = tags.split(",")

            # 1) Create a new project
            new_project = Project.objects.create(
                name=name,
                description=description,
                author=request.user,
                tags=tags_list
            )

            # 4) Return new project as HTTP
            return HttpResponse(serialize("json", [new_project]), status=201)
        except Project.DoesNotExist:
            return HttpResponseServerError(json.dumps({"error": "No project found for the given project id."}))
        except Exception as e:
            print(e)
            if e.args[0] in ["CSV file misses a required attribute.", "prompt", "summary"]:
                print(e)
                return HttpResponseServerError(json.dumps({"error": "The uploaded csv file contains missing data."}))
            elif e.args[0] in ["Missing attribute"]:
                return HttpResponseServerError(json.dumps({"error": e.args[0]}))
            else:
                return HttpResponseServerError(json.dumps({"error": "An unexpected error occurred."}))
     

    # TODO: Add patch method to edit projects
    
    def delete(self, request):
        user = request.user
        try:
            project = Project.objects.get(pk=request.GET.get("pk"))
            if project.author != user:
                return HttpResponse({"error": "Unauthorized access"}, status=403)
            project.delete()
            return HttpResponse({"message": "Project deleted successfully"}, status=200)
        except Project.DoesNotExist:
            return HttpResponse({"error": "No project with such id."}, status=404)

# if you have time look into csrf_exempt and see if you can include it        
# if your have time use uuid instead of pk
# If you have time use Response instead of HttpResponse
# If you have time use Serializer instead of json.dumps, that implies that other methods and call in frontend should be updated as well