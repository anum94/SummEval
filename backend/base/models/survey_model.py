from django.db import models

from .summary_model import Summary
from .project_model import Project
from users.models import CustomUser


class Survey(models.Model):
    name = models.TextField(max_length=200)
    project = models.ForeignKey(Project, on_delete=models.CASCADE) 
    summaries = models.ManyToManyField(Summary, related_name='surveys')
    active_until = models.DateTimeField()
    highlight_question = models.TextField(default="", null=True)
    metrics = models.JSONField(default=list)  # Storing metrics as a list of strings
    created_at = models.DateTimeField(auto_now_add=True)  # Automatically set the field to now when the object is first created