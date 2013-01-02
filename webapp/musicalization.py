
import subprocess
import os
import tempfile
import wave
import urllib2
import bson
import numpy
import time

BEDDIT_SERVER = "https://api.beddit.com"
SLEEP_TO_MUSIC_PYTHON_INTERPRETER = "python"
SLEEP_TO_MUSIC_SCRIPT = os.path.expanduser("~/Sleep-musicalization/dreamstomusic.py")


def create_32bit_wav_file(file_name, framerate, data_array):
    assert data_array.dtype == numpy.int32
    assert data_array.ndim == 1
    
    wav_file = wave.open(file_name, "wb")
    wav_file.setnchannels(1)
    wav_file.setsampwidth(4)
    wav_file.setframerate(framerate)
    wav_file.setnframes(len(data_array))
    
    wav_file.writeframes(data_array.tostring())
    wav_file.close()


def make_beddit_api_request(api_selector, username, date, token):
    "Make an API request and return the resulting JSON or BSON document as a string"
    
    url = BEDDIT_SERVER + "/api2/user/%s/%d/%02d/%02d/%s?access_token=%s" % (username, date.year, date.month, date.day, api_selector, token)
    
    print "Fetching data: %s %d-%02d-%02d %s" % (username, date.year, date.month, date.day, api_selector)
    t0 = time.time()
    
    response_data = urllib2.urlopen(url).read()
    
    print "Fetched %d bytes in %.1f seconds" % (len(response_data), time.time() - t0)
    
    return response_data


def kunquat_musicalization(username, date, access_token, output_file_name):
    """Musicalizes a single night's Beddit sleep information with
    the Sleep-musicalization project's method. Returns the night's
    sleep information as a JSON string."""
    
    sleep_data_json_string = make_beddit_api_request("sleep", username, date, access_token)
    result_data_json_string = make_beddit_api_request("results", username, date, access_token)
    
    sleep_file_name = tempfile.mktemp(suffix=".json")
    result_file_name = tempfile.mktemp(suffix=".json")
    
    with open(sleep_file_name, "w") as sleep_file:
        sleep_file.write(sleep_data_json_string)
    
    with open(result_file_name, "w") as result_file:
        result_file.write(result_data_json_string)
    
    subprocess.call([SLEEP_TO_MUSIC_PYTHON_INTERPRETER,
                     SLEEP_TO_MUSIC_SCRIPT,
                     "--result", result_file_name,
                     "--sleep", sleep_file_name,
                     output_file_name
                     ])
    
    os.unlink(sleep_file_name)
    os.unlink(result_file_name)
