from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views import View

pages = {
    'home': 'tv/home.html',
}

def index(request):
    return redirect(reverse('tv'))

def tv(request):
    return render(request, 'tv/main.html', context={})


class RequestPage(View):
    def get(self, request):
        requested_page = request.GET['query']
        if requested_page in pages:
            return render(request, pages[requested_page], context={})
        else:
            return HttpResponseNotFound("<h1>Page not found</h1>")