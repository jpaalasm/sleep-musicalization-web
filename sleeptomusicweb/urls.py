from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',

    url(r'^/?$', 'webapp.views.home', name='home'),

    url(r'^auth_redirect$', 'webapp.views.auth_redirect', name='auth_redirect'),

    url(r'^nights$', 'webapp.views.night_index', name='night_index'),
    
    url(r'^sign_out$', 'webapp.views.sign_out', name='sign_out'),


    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
  
)

urlpatterns = patterns('',
                       url(r'', include('django.contrib.staticfiles.urls')),
                       ) + urlpatterns
