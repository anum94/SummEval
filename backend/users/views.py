from django.shortcuts import render
#views
#from django.shortcuts import render
#from django.contrib.auth.models import User
#from rest_framework import generics
#from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics
from base.serializers import CustomUserSerializer, ChangePasswordSerializer, ChangeUserInformationSerializer
from .models import CustomUser
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.validators import UniqueValidator
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data) # get the data from the request
        serializer.is_valid(raise_exception=True) # check if the data is valid
        self.perform_create(serializer) # create the user
        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
    

class ChangePasswordView(generics.CreateAPIView):
    serializer_class = ChangePasswordSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        user = request.user
        data['user']= user.pk
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({"message": "Password changed successfully"}, status=status.HTTP_201_CREATED)
    
class ChangeUserInformationView(generics.UpdateAPIView):
    serializer_class = ChangeUserInformationSerializer

    def update(self, request, *args, **kwargs):
        data = request.data
        user = request.user
        data['user']= user.pk
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({"message": "User updated sucessfully"}, status=status.HTTP_201_CREATED)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['email'] = user.email

        return token
    
class UserSearchView(generics.ListAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        if not query:
            return CustomUser.objects.none()  # Return an empty queryset if query is empty

        # Filter users based on username, first_name, or last_name
        return CustomUser.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).exclude(pk=self.request.user.pk)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response(
                {"message": "No users found. They might not be registered."},
                status=status.HTTP_200_OK
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({"results": serializer.data}, status=status.HTTP_200_OK)


