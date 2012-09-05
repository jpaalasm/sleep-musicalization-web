import os
import datetime

from django.test import TestCase

from models import Song
from tasks import GenerateSongTask


with open(os.path.expanduser("~/sleep_musicalization_test_settings")) as f:
    USERNAME = f.readline().strip()
    DATE = datetime.datetime.strptime(f.readline().strip(), "%Y-%m-%d").date()
    ACCESS_TOKEN = f.readline().strip()


class SongTaskTest(TestCase):
    def test_creating_song(self):
        
        song = Song.objects.create(beddit_username=USERNAME)
        
        task = GenerateSongTask()
        task.run(song.id, DATE, ACCESS_TOKEN)
        
        song = Song.objects.get(id=song.id)
        
        self.assertTrue(song.song_file is not None)        
