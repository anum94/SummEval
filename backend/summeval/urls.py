from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from users.views import RegisterView, ChangePasswordView, ChangeUserInformationView
from users.views import UserSearchView

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='register'), # Register a new user
    path('api/token/', TokenObtainPairView.as_view(), name='get_token'), # Get a new access token
    path('api/token/refresh/', TokenRefreshView.as_view(), name='refresh_token'), # Refresh the access token
    path('api/change-password/', ChangePasswordView.as_view(), name='reset_password'), # Reset the password
    path('api/update-user/', ChangeUserInformationView.as_view(), name='update_user'), # Update the user information
    path("api/", include("base.urls")), # include the urls from the base app. This is where the api for the other component urls are defined
    path('api/users/search/', UserSearchView.as_view(), name='user-search'),
]
