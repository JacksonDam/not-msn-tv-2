from django.contrib import admin
from django.urls import include, path
from tv import views

urlpatterns = [
    path('', views.index, name='index'),
    path('tv/', include('tv.urls')),
    path("__reload__/", include("django_browser_reload.urls")),
    path('admin/', admin.site.urls),
]
