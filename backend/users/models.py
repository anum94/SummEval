#user
from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    #refresh_token = models.CharField(max_length=1000, null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'password'] # Required fields are the fields that are required when creating a user. If we don't specify some fields here, we will get an error when creating a user.
    

    def __str__(self):
        return self.email

    class Meta:
        db_table = 'auth_user'