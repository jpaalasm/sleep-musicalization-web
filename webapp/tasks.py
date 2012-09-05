'''
Created on May 23, 2012

@author: mikko
'''
import os
import tempfile
import logging
import subprocess
import requests

from django.core.files.base import File
from django.conf import settings

from celery.task import Task
from celery.registry import tasks
from models import Song

BEDDIT_SERVER = "https://api.beddit.com"


def make_api_request(api_selector, username, date, token):
    "Make an API request and return the resulting JSON document as a string"
    
    sleep_url = BEDDIT_SERVER + "/api2/user/%s/%d/%02d/%02d/%s?access_token=%s" % (username, date.year, date.month, date.day, api_selector, token)
    print sleep_url
    response = requests.get(sleep_url)
    response.raise_for_status()
    
    serialized_json_document = response.text
    
    return serialized_json_document


class GenerateSongTask(Task):

    def run(self, song_id, date, access_token, **kwargs):
        
        song = Song.objects.get(id=song_id)
        logging.debug("Fetched song " + song.key)
        
        try:
            song.set_state("processing")
            logging.debug("Processing song")
            
            sleep_data_json_string = make_api_request("sleep", song.beddit_username, date, access_token)
            result_data_json_string = make_api_request("results", song.beddit_username, date, access_token)
            
            output_file_name = tempfile.mktemp(suffix=".mp3")
            sleep_file_name = tempfile.mktemp(suffix=".json")
            result_file_name = tempfile.mktemp(suffix=".json")
            
            with open(sleep_file_name, "w") as sleep_file:
                sleep_file.write(sleep_data_json_string)
            
            with open(result_file_name, "w") as result_file:
                result_file.write(result_data_json_string)
            
            subprocess.call([settings.SLEEP_TO_MUSIC_PYTHON_INTERPRETER,
                             settings.SLEEP_TO_MUSIC_SCRIPT,
                             "--result", result_file_name,
                             "--sleep", sleep_file_name,
                             output_file_name
                             ])
            
            song.sleep_data = sleep_data_json_string
            
            with open(output_file_name) as outfile:
                logging.debug("Saving song file")
                song.song_file.save(song.key + ".mp3", File(outfile))
            
            os.unlink(sleep_file_name)
            os.unlink(result_file_name)
            os.unlink(output_file_name)
            
            song.set_state("finished")
            logging.debug("Finished processing song")
        
        except Exception, e:
            logging.exception("Exception while processing song")
            song.set_state("error")


tasks.register(GenerateSongTask)
