from django import forms

from models import Song


class SongInformationForm(forms.ModelForm):

    class Meta:
        model = Song
        fields = ("public", "title", "description")
        
        
class CreateSongForm(forms.Form):
    date = forms.DateField()
    