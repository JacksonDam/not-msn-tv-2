from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.urls import reverse

# Create your views here.
def index(request):
    return redirect(reverse('tv'))

def tv(request):
    return render(request, 'tv/signin.html', context={})