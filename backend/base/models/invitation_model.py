import uuid
from django.db import models

from .survey_model import Survey
from users.models import CustomUser


class Invitation(models.Model):
    survey = models.ForeignKey(Survey, related_name='invitations', on_delete=models.CASCADE)
    email_address = models.EmailField() # email address of invitee
    number_of_evaluations = models.IntegerField(default=0)
    role = models.TextField(blank=True, default="")
    background = models.TextField(blank=True, default="")
    highest_degree = models.TextField(blank=True, default="")
    nlp_experience = models.TextField(blank=True, default="")
    ask_for_personal_data = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True , null=True, blank=True)
    uuid = models.UUIDField( 
         default = uuid.uuid4, 
         unique=True,
         editable = False) 