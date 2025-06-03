from django.db import models
import uuid
from .fulltext_model import FullText
from .experiment_model import Experiment
from users.models import CustomUser


class Summary(models.Model):
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE)
    full_text = models.ForeignKey(FullText, on_delete=models.CASCADE, null=True)
    prompt = models.TextField()
    summary = models.TextField(null=True, blank=True)
    summarization_model = models.TextField(null=True, blank=True) 
    generated_summary = models.TextField(null=True, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    index = models.PositiveIntegerField(null=True, blank=True)
    class Meta:
        unique_together = ('experiment', 'index')

