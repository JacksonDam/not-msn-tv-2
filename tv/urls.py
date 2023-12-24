from django.urls import path
from . import views

urlpatterns = [
    path('', views.tv, name='tv'),
    path('request-page', views.RequestPage.as_view(), name='request-page'),
]