from django import forms

from models import Song


class SongInformationForm(forms.ModelForm):

    class Meta:
        model = Song
        fields = ("user_nickname", "public", "title", "description")
        