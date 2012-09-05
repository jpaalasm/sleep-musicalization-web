import tempfile
import os
import random

from django.core.files.base import File
from django.db import models
from django.conf import settings


class SongManager(models.Manager):
    def make_song(self, username, date):
        """Creates a new song by fetching users data from Beddit and
        storing it to mp3 file.
        """
        key = unicode(''.join([random.choice("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") for i in range(12)]))
        
        song = self.create(user_nickname=username,
                           beddit_username=username,
                           key=key,
                           title=username + " " + date.strftime("%x"))
        return song
    
    def get_latest_public_songs(self):
        return self.filter(public=True, state="finished").order_by("-created")
    
    def get_number_of_public_songs(self):
        return self.filter(public=True, state="finished").count()
    
    def get_my_songs(self, beddit_username):
        return self.filter(public=True, state="finished", beddit_username=beddit_username)
    

class Song(models.Model):
    
    STATE_CHOICES = (("new",        "Waiting for processing"),
                     ("processing", "Processing"),
                     ("finished",   "Finished"),
                     ("error",      "Error"),   
                     )
    
    key = models.CharField(max_length=20, db_index=True)

    state = models.CharField(max_length=20, choices=STATE_CHOICES, default="new")

    # Automatically generated metadata, user may not change
    created = models.DateTimeField(auto_now_add=True)
    beddit_username = models.CharField(max_length=40)
    times_listened = models.IntegerField(default=0)
    length_seconds = models.IntegerField(default=0)
    
    # User editable fields
    user_nickname = models.CharField(max_length=40)
    public = models.BooleanField(default=False, help_text="Include this song in public list of songs?")
    title = models.CharField(max_length=100, help_text="You can make up a nice title for your song")
    description = models.TextField(blank=True, help_text="If you like, you can write something about this night and song")
    
    song_file = models.FileField(upload_to="songs", blank=True)
    
    sleep_data = models.TextField(blank=True)

    objects = SongManager()
    
    def set_state(self, new_state):
        self.state = new_state
        self.save()
    
    def __unicode__(self):
        return self.title
    