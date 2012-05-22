import requests
import json
import logging
import datetime

from django.http import HttpResponseRedirect, HttpResponse, HttpResponseForbidden
from django.core.urlresolvers import reverse
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.conf import settings
from django.contrib import messages

from models import Song
from forms import SongInformationForm


if settings.DEBUG:
    logger = logging.getLogger("development")
else:
    logger = logging.getLogger("production")


def home(request):
    context = {
        "authorize_url" : ("https://api.beddit.com/api/oauth/authorize?" +
                           "client_id=" + settings.BEDDIT_CLIENT_ID + "&" +
                           "redirect_uri=" + settings.BEDDIT_REDIRECT_URL + "&" +
                           "response_type=code"),
        "latest_songs" : Song.objects.get_latest_public_songs()[:10],
        "total_songs" : Song.objects.get_number_of_public_songs(),
    }

    return render_to_response("dreamsapp/home.html", context, context_instance=RequestContext(request))


def auth_redirect(request):
    code = request.GET.get("code", None)

    if code is not None:
        token_url = ("https://api.beddit.com/api/oauth/access_token?" +
                     "client_id=%s&" + 
                     "redirect_uri=%s&" +
                     "client_secret=%s&" + 
                     "grant_type=code&" +
                     "code=%s") % (settings.BEDDIT_CLIENT_ID,
                                   settings.BEDDIT_REDIRECT_URL,
                                   settings.BEDDIT_CLIENT_SECRET,
                                   code)

        response = requests.get(token_url)
        if response.status_code == 200:
            response_data = json.loads(response.text) 
            if response_data.has_key("error"):
                messages.error(request, response_data["error_description"])
                return HttpResponseRedirect(reverse(home))
            else:
                logger.debug(repr(response_data))
                access_token = response_data["access_token"]
                request.session["beddit_access_token"] = access_token
                return HttpResponseRedirect(reverse(night_index))
        else:
            messages.error(request, "Could not get access token from Beddit server")
            return HttpResponseRedirect(reverse(home))
    else:
        messages.error(request, "No code was supplied")
        return HttpResponseRedirect(reverse(home))
    
    context = {
        "code" : request.GET.get("code", None),
        }


def night_index(request):
    access_token = request.session.get("beddit_access_token", None)
    
    context = {}

    if access_token is None:
        messages.error(request, "You need to authorize this application first")
    else:
        user_url = "https://api.beddit.com/api2/user?access_token=" + access_token
        response = requests.get(user_url)
        if response.status_code == 200:
            response_data = json.loads(response.text)
            
            if len(response_data) > 1:
                messages.info(request, "Hm, you seem to have access to several users, using first!")

            context["available_users"] = response_data
            context["selected_user"] = response_data[0]
            request.session["beddit_user"] = context["selected_user"]

            username = context["selected_user"]["username"]
            end_date = datetime.date.today()
            start_date = end_date - datetime.timedelta(days=30)
            nights_url = ("https://api.beddit.com/api2/user/" + username + "/timeline" +
                          "?start=" + start_date.strftime("%Y-%m-%d") +
                          "&end=" + end_date.strftime("%Y-%m-%d") +
                          "&access_token=" + access_token)

            response = requests.get(nights_url)

            if response.status_code == 200:
                timeline = json.loads(response.text)
                for night in timeline:
                    night["date"] = datetime.datetime.strptime(night["date"], "%Y-%m-%d").date()
                timeline.sort(key=lambda k: k["date"], reverse=True)
                context["timeline"] = timeline
            else:
                messages.error(request, "Could not get list of measured nights from Beddit server")
        else:
            messages.error(request, "Could not get user information from Beddit server")
 
    return render_to_response("dreamsapp/choose_sleep.html", context,
                              context_instance=RequestContext(request))


def night(request, year, month, day):
    pass


def make_song(request, year, month, day):
    pass


def song_index(request):
    context = {"latest_songs" : Song.objects.get_latest_public_songs()[:10],
               }
    
    if request.session.has_key("beddit_user"):
        context["my_songs"] = Song.objects.get_my_songs(request.session["beddit_user"]["username"]) 
    
    return render_to_response("dreamsapp/song.html", context,
                              context_instance=RequestContext(request))
    
    
def song(request, key=None):
    song = get_object_or_404(Song, key=key)
    
    context = {"song" : song,
               "latest_songs" : Song.objects.get_latest_public_songs()[:50],
               }
    
    if request.session.has_key("beddit_user"):
        context["my_songs"] = Song.objects.get_my_songs(request.session["beddit_user"]["username"]) 
    
        if request.session["beddit_user"]["username"] == song.beddit_username:
            context["edit_link"] = reverse(song_edit, kwargs={"key" : song.key})
    
    return render_to_response("dreamsapp/song.html", context,
                              context_instance=RequestContext(request))


def song_edit(request, key=None):
    song = get_object_or_404(Song, key=key)

    if not (request.session.has_key("beddit_user") and
            request.session["beddit_user"]["username"] == song.beddit_username):
        messages.error(request, "You don't have permission to edit this songs information")
        return HttpResponseRedirect(reverse("song", kwargs={"key" : song.key}))
    
    if request.method == "POST":
        form = SongInformationForm(request.POST, instance=song)
        if form.is_valid():
            form.save()
            messages.info(request, "Song information saved")
            return HttpResponseRedirect(reverse("song", kwargs={"key" : song.key}))
        else:
            messages.error(request, "Please check errors in your input")
    else:
        form = SongInformationForm(instance=song)
        
    context = {"song" : song,
               "form" : form,
               }

    return render_to_response("dreamsapp/song_edit.html", context,
                              context_instance=RequestContext(request))
    

def song_mp3(request, key=None):
    song = get_object_or_404(Song, key=key)
    return HttpResponse(song.song_file.read(), mimetype="audio/mpeg")
    

def sign_out(request):
    request.session.flush()
    
    messages.info(request, "Your personal information was forgotten")

    return HttpResponseRedirect(reverse(home))
