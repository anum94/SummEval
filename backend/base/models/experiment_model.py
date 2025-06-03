from django.db import models
from .project_model import Project
from users.models import CustomUser


class Experiment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    llm_name = models.CharField(max_length=200, blank=True)
    context_window = models.IntegerField(null=True,blank=True)
    max_new_tokens = models.IntegerField(null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
