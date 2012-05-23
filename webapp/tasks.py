'''
Created on May 23, 2012

@author: mikko
'''
import os
import tempfile
import logging
import subprocess

from django.core.files.base import File
from django.conf import settings

from celery.task import Task
from celery.registry import tasks
from models import Song


class GenerateSongTask(Task):

    def run(self, song_id, date, access_token, **kwargs):
        
        song = Song.objects.get(id=song_id)
        logging.debug("Fetched song " + song.key)
        
        try:
            song.set_state("processing")
            logging.debug("Processing song")
            
            output_file_name = tempfile.mktemp(suffix=".mp3")
            
            subprocess.call([settings.SLEEP_TO_MUSIC_PYTHON_INTERPRETER,
                             settings.SLEEP_TO_MUSIC_SCRIPT,
                             "--username", song.beddit_username,
                             "--date", date.strftime("%Y-%m-%d"),
                             "--token", access_token,
                             output_file_name
                             ])
            
            with open(output_file_name) as outfile:
                logging.debug("Saving song file")
                song.song_file.save(song.key + ".mp3", File(outfile))
                
            song.set_state("finished")
            logging.debug("Finished processing song")
        
        except Exception, e:
            logging.exception("Exception while processing song")
            song.set_state("error")


tasks.register(GenerateSongTask)
