import tempfile
import os
import random

from django.core.files.base import File
from django.db import models
from django.conf import settings


class SongManager(models.Manager):
    def make_song(self, username, date, access_token):
        """Creates a new song by fetching users data from Beddit and
        storing it to mp3 file.
        """
        output_file_name = tempfile.mktemp(suffix=".mp3")
        command_template = "/home/mikko/DreamsToMusic/dreamstomusic %s %s %s %s"
        command = command_template % (username,
                                      date.strftime("%Y-%m-%d"),
                                      access_token,
                                      output_file_name)
#        command = "source /home/mikko/.bash_profile && workon dreamstomusic && %s --username %s --date %s --token %s %s" % (settings.SLEEP_TO_MUSIC_BIN,
#                                                                username,
#                                                                date.strftime("%Y-%m-%d"),
#                                                                access_token,
#                                                                output_file_name)
        ret = os.system(command)
        
        print "RETURN CODE",ret
        
        key = unicode(''.join([random.choice("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") for i in range(12)]))
        
        song = self.create(user_nickname=username,
                           beddit_username=username,
                           key=key)
        
        with open(output_file_name) as outfile:
            song.song_file.save(key + ".mp3", File(outfile))
            
        song.save()
        
        return song
    
    def get_latest_public_songs(self):
        return self.filter(public=True).order_by("-generated")
    
    def get_number_of_public_songs(self):
        return self.filter(public=True).count()
    
    def get_my_songs(self, beddit_username):
        pass


class Song(models.Model):
    key = models.CharField(max_length=20, db_index=True)

    generated = models.DateTimeField(auto_now_add=True)
    beddit_username = models.CharField(max_length=40)
    
    user_nickname = models.CharField(max_length=40)
    public = models.BooleanField(default=False)
    times_listened = models.IntegerField(default=0)
    length_seconds = models.IntegerField(default=0)
    
    song_file = models.FileField(upload_to="songs")

    objects = SongManager()
    
    def __unicode__(self):
        return self.user_nickname
    