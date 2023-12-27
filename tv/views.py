from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views import View
import threading
import feedparser
import ssl
import time
from openai import OpenAI
client = OpenAI()

if hasattr(ssl, '_create_unverified_context'):
    ssl._create_default_https_context = ssl._create_unverified_context

num_keys = ["one", "two", "three"]

current_headlines = {
    "one": {"title": "Headline 1"},
    "two": {"title": "Headline 2"},
    "three": {"title": "Headline 3"},
}

def update_news():
    while True:
        NewsFeed = feedparser.parse("http://feeds.nbcnews.com/feeds/worldnews")
        if NewsFeed.entries:
            for i in range(0, 3):
                headline = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": "You will be provided with a news headline. Shorten it to at most 36 characters. Do not add full stops. Strictly never provide any headline over 36 characters, ever."
                        },
                        {
                            "role": "user",
                            "content": NewsFeed.entries[i]['title']
                        }
                    ],
                    temperature=0,
                    max_tokens=64,
                    top_p=1
                )
                current_headlines[num_keys[i]]['title'] = headline.choices[0].message.content
            print("UPDATE SUCCESS", current_headlines)
        time.sleep(10800)

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
            if requested_page == 'home':
                return render(request, pages[requested_page], context=current_headlines)
            else:
                return render(request, pages[requested_page], context={})
        else:
            return HttpResponseNotFound("<h1>Page not found</h1>")

threading.Thread(target=update_news, args=()).start()