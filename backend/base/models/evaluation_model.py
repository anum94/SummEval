from django.db import models

from .invitation_model import Invitation
from .summary_model import Summary
from users.models import CustomUser


class Evaluation(models.Model):
    summary = models.ForeignKey(Summary, related_name="evaluations", on_delete=models.CASCADE)
    invitation = models.ForeignKey(Invitation, related_name="evaluations", on_delete=models.CASCADE)
    ratings = models.JSONField(default=list)
    comment = models.TextField(blank=True)
    highlights = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)  # Automatically set the field to now when the object is first created

    def __str__(self):
        return f"Evaluation {self.id}"
