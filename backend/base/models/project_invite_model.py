from django.db import models
from users.models import CustomUser
from django.db.models import Q
from .project_model import Project

class ProjectInvite(models.Model):
    class InviteStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        DECLINED = 'DECLINED', 'Declined'

#allow user_id to be null in case the resaercher is not registered yet
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='project_invites', null=True, blank=True)
    email = models.EmailField(
        null=True, blank=True, help_text="Email address for users not registered yet."
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='invited_users')
    invited_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=InviteStatus.choices,
        default=InviteStatus.PENDING,
    )
    experiment_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="List of experiment IDs the invited user has rights to control."
    )

    class Meta:
        constraints = [
            # Ensure unique user and project combination
            models.UniqueConstraint(
                fields=['user', 'project'],
                name='unique_user_project',
                condition=Q(user__isnull=False)
            ),
            # Ensure unique email and project combination
            models.UniqueConstraint(
                fields=['email', 'project'],
                name='unique_email_project',
                condition=Q(email__isnull=False)
            )
        ]

    def __str__(self):
        user_email = self.user.email if self.user else self.email
        return f"{user_email} invited to {self.project.name} - Status: {self.get_status_display()}"