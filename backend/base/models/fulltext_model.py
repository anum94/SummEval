from django.db import models
from .project_model import Project

class FullText(models.Model):
    project = models.ForeignKey(Project, related_name="fulltexts", on_delete=models.CASCADE)
    full_text = models.TextField()
    reference_summary = models.TextField(blank=True)
    index = models.IntegerField(null=False)  # Ensure the column is NOT NULL

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['project', 'index'], name='unique_full_text_index')
        ]
