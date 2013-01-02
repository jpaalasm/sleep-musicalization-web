'''
Created on May 23, 2012

@author: mikko
'''
import os
import tempfile
import logging

from django.core.files.base import File
from celery.task import Task
from celery.registry import tasks

from models import Song
import musicalization


class GenerateSongTask(Task):
    
    def run(self, song_id, date, access_token, **kwargs):
        
        song = Song.objects.get(id=song_id)
        logging.debug("Fetched song " + song.key)
        
        try:
            song.set_state("processing")
            logging.debug("Processing song")
            
            sleep_data_json_string = musicalization.make_beddit_api_request("sleep", song.beddit_username, date, access_token)
            
            output_file_name = tempfile.mktemp(suffix=".mp3")
            musicalization.kunquat_musicalization(song.beddit_username, date, access_token, output_file_name)
            
            song.sleep_data = sleep_data_json_string
            
            with open(output_file_name) as outfile:
                logging.debug("Saving song file")
                song.song_file.save(song.key + ".mp3", File(outfile))
            
            os.unlink(output_file_name)
            
            song.set_state("finished")
            logging.debug("Finished processing song")
        
        except:
            logging.exception("Exception while processing song")
            song.set_state("error")


tasks.register(GenerateSongTask)
