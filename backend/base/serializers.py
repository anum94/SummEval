# base/serializers.py
from rest_framework import serializers


from .models.invitation_model import Invitation
from .models.survey_model import Survey
from .models.evaluation_model import Evaluation
from .models.project_model import Project
from .models.experiment_model import Experiment
from users.models import CustomUser
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import check_password
from rest_framework.validators import UniqueValidator


class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = "__all__"


class SurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = ["active_until", "metrics", "highlight_question"]

class ExperimentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experiment
        fields = "__all__"

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators = [validate_password]) # validate_password is used to validate the password using the default password validators in Django
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True, validators=[UniqueValidator(queryset=CustomUser.objects.all())]) # This is used to validate the email field to make sure that the email is unique
    class Meta:
        model = CustomUser
        fields = ("id","email", "first_name", "last_name", "password", "password2")
        extra_kwargs = {"password": {"write_only": True}} # password is write-only because we don't want to return the password in the response

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = CustomUser.objects.create(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )

        user.set_password(validated_data['password'])
        user.save()

        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True, write_only=True)
    user = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), required=True)
  
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        old_password = validated_data['old_password']
        new_password = validated_data['new_password']
        user = validated_data['user']
        if user is not None:
            if check_password(old_password, user.password):
                user.set_password(new_password)
                user.save()

                return user
            else:
                raise serializers.ValidationError({"old_password": "Wrong password."})
        else:
            raise serializers.ValidationError({"user": "User not found."})
        
class ChangeUserInformationSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    user = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), required=True)

    class Meta:
        model = CustomUser
        fields = ["first_name", "last_name", "user"]

    def create(self, validated_data):
        first_name = validated_data['first_name']
        last_name = validated_data['last_name']
        user = validated_data['user']
        if user is not None:
            user.first_name = first_name
            user.last_name = last_name
            user.save()

            return user
        else:
            raise serializers.ValidationError({"user": "User not found."})

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = "__all__"
        #fields = ["name", "description", "fulltext", "reference_summary", "created_at", "author"]
        #extra_kwargs = {"author": {"read_only": True}} #author is read-only because it is set automatically when the project is created

class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = "__all__"

class EvaluatorDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ["role", "background", "highest_degree", "nlp_experience", "ask_for_personal_data"]
