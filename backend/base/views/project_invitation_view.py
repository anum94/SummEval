from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models.project_model import Project
from users.models import CustomUser
from ..models.project_invite_model import ProjectInvite
from ..serializers import ProjectSerializer
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
from dotenv import load_dotenv
from django.db.models import Q

class ProjectInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    # Retrieve all invitations for a project, might be used later for author to view all the invites
    def get(self, request):
        user = request.user
        try:
            project_id = request.GET.get("project")
            project = Project.objects.get(pk=project_id)

            # Check if the requesting user is the project author
            if project.author != user:
                return Response({"error": "Unauthorized access"}, status=403)

            # Retrieve all invited users for the project
            invites = ProjectInvite.objects.filter(project=project)
            invited_users = [{"id": invite.user.id, "email": invite.user.email, "role": invite.role} for invite in invites]

            response_data = {
                "project": ProjectSerializer(project).data,
                "invited_users": invited_users
            }
            return Response(response_data, status=200)

        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)

    # Create invitations for researchers
    def post(self, request):
        user = request.user
        try:
            project_id = request.data.get("project")
            user_ids = request.data.get("user_ids", [])
            email = request.data.get("email", "").strip()
            project = Project.objects.get(pk=project_id)

            # Check if the requesting user is the project author
            if project.author != user:
                return Response({"error": "Unauthorized access"}, status=403)
            
            # Invite registered users only if user_ids are provided
            if user_ids:
                users_to_invite = CustomUser.objects.filter(pk__in=user_ids)
                if not users_to_invite.exists():
                    return Response({"error": "No valid users found for the provided IDs."}, status=400)

                for invitee in users_to_invite:
                    invite, created = ProjectInvite.objects.get_or_create(
                        user=invitee,
                        project=project,
                        defaults={'status': ProjectInvite.InviteStatus.PENDING}
                    )
                    if not created and invite.status != ProjectInvite.InviteStatus.PENDING:
                        invite.status = ProjectInvite.InviteStatus.PENDING
                        invite.save()

            # Invite unregistered user via email, if email is provided
            if email:
                invite, created = ProjectInvite.objects.get_or_create(
                    email=email,
                    project=project,
                    defaults={'status': ProjectInvite.InviteStatus.PENDING, 'user': None }
                )
                if created:
                    # Send the invitation email
                    send_project_invitation(invite, project.name)


            return Response({"message": "Users invited to the project successfully"}, status=201)

        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    # Modify the status of an invitation
    def patch(self, request):
        user = request.user
        try:
            project_id = request.data.get("project")
            status = request.data.get("status")

            if not project_id or not status:
                return Response({"error": "Project ID and status are required"}, status=400)

            # Validate the status
            if status not in [ProjectInvite.InviteStatus.ACCEPTED, ProjectInvite.InviteStatus.DECLINED]:
                return Response({"error": "Invalid status"}, status=400)

            # Retrieve the invite, either by user or matching email
            invite = ProjectInvite.objects.filter(
                project_id=project_id
            ).filter(
                Q(user=user) | Q(email=user.email)
            ).first()

            if not invite:
                return Response({"error": "No invitation found for this user and project"}, status=404)

            # Update the invite status and associate the user if not already set
            invite.status = status

            if invite.user is None and invite.email == user.email:
                invite.user = user  # Associate the current user

            invite.save()

            return Response({"message": f"Invitation status updated to {status}"}, status=200)

        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

        
def send_project_invitation(invitation, project_name):
    """
    Sends an email invitation for a project.

    Args:
        invitation (ProjectInvite): The invitation object containing email and other details.
        project_name (str): The name of the project the user is invited to.
    """
    recipient = invitation.email
    if not recipient:
        print("No email address found for the invitation.")
        return

    from_email = "noreply.summeval@gmail.com" 
    sendgrid_api_key = os.getenv("SENDGRID_API_KEY")  
    environment = os.getenv('DJANGO_ENV', 'development')
    env_file = '.env.production' if environment == 'production' else '.env.development'
    print(f"Loading .env file: {env_file}")
    load_dotenv(env_file)
    
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    print(f"Loaded FRONTEND_URL: {os.getenv('FRONTEND_URL')}")

    #TODO: add env
    url = f"{frontend_url}/auth/register"

    # Email content
    subject = f"You've been invited to collaborate on {project_name} on SummEval!"
    html_content = f"""
    <html>
        <body>
            <p style="margin-bottom: 20px;">Hi there,</p>
            <p style="margin-bottom: 20px;">
                You have been invited to collaborate on the project <b>{project_name}</b> on SummEval.
            </p>
            <p style="margin-bottom: 20px;">
                Click the button below to register and accept the invitation:
            </p>
            <p style="margin-bottom: 30px;">
                <a href="{url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #1a73e8; text-decoration: none; border-radius: 5px;">
                    Register & Accept Invitation
                </a>
            </p>
            <p style="margin-bottom: 20px;">
                If you do not wish to participate, you can safely ignore this email.
            </p>
            <p style="margin-bottom: 0;">
                Kind regards,<br>Your SummEval Team
            </p>
        </body>
    </html>
    """
    
    try:
        message = Mail(
            from_email=from_email,
            to_emails=recipient,
            subject=subject,
            html_content=html_content
        )
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        print(f"Email sent to {recipient}: Status Code {response.status_code}")
    except Exception as e:
        print(f"Failed to send email to {recipient}: {e}")
