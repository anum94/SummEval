from django.db import models
from users.models import CustomUser

# Create your models here.

class Project(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(max_length=1000, blank=True, null=True)  #blank=True is used to allow empty values in the description field, null=True is used to allow null values in the description field
    tags = models.JSONField(default=list)  # Use JSONField to store an array of strings
    created_at = models.DateTimeField(auto_now_add=True) #auto_now_add=True is used to set the created_at field to the current date and time when the project is created

    # TODO: change to non-nullable
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='projects', null=True)  #related_name='projects' is used to access the projects of a user using user.projects.all(); on_delete=models.CASCADE is used to delete the projects of a user when the user is deleted; ForeignKey is used to create a many-to-one relationship between the User and Project models

    def __str__(self):
        return self.name
    

