from django.conf.urls.defaults import patterns, url


urlpatterns = patterns('webapp',
                       
    url(r'^/?$', 'views.home', name='home'),

    url(r'^auth_redirect$', 'views.auth_redirect', name='auth_redirect'),

    url(r'^nights$', 'views.night_index', name='night_index'),

    url(r'^song$', 'views.song_index', name='song_index'),
    url(r'^create_song$', 'views.song_create', name='song_create'),
    url(r'^song/(?P<key>[\w\d]+)$', 'views.song', name='song'),
    url(r'^song/(?P<key>[\w\d]+).mp3$', 'views.song_mp3', name='song_mp3'),
    url(r'^song/(?P<key>[\w\d]+)/edit$', 'views.song_edit', name='song_edit'),
    url(r'^song/(?P<key>[\w\d]+)/wait$', 'views.song_wait_finished', name='song_wait_finished'),
    
    url(r'^sign_out$', 'views.sign_out', name='sign_out'),

)
