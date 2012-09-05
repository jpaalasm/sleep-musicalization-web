# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Song'
        db.create_table('webapp_song', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=20, db_index=True)),
            ('state', self.gf('django.db.models.fields.CharField')(default='new', max_length=20)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('beddit_username', self.gf('django.db.models.fields.CharField')(max_length=40)),
            ('times_listened', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('length_seconds', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('user_nickname', self.gf('django.db.models.fields.CharField')(max_length=40)),
            ('public', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('song_file', self.gf('django.db.models.fields.files.FileField')(max_length=100, blank=True)),
        ))
        db.send_create_signal('webapp', ['Song'])


    def backwards(self, orm):
        # Deleting model 'Song'
        db.delete_table('webapp_song')


    models = {
        'webapp.song': {
            'Meta': {'object_name': 'Song'},
            'beddit_username': ('django.db.models.fields.CharField', [], {'max_length': '40'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '20', 'db_index': 'True'}),
            'length_seconds': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'public': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'song_file': ('django.db.models.fields.files.FileField', [], {'max_length': '100', 'blank': 'True'}),
            'state': ('django.db.models.fields.CharField', [], {'default': "'new'", 'max_length': '20'}),
            'times_listened': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'user_nickname': ('django.db.models.fields.CharField', [], {'max_length': '40'})
        }
    }

    complete_apps = ['webapp']