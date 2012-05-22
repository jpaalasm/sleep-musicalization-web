from django.conf.urls import patterns, include, url

from django.conf import settings


# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()


urlpatterns = patterns('',

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
  
)

if 'webapp' in settings.INSTALLED_APPS:
    urlpatterns += patterns('',
        (r'^', include('webapp.urls')),
)

urlpatterns = patterns('',
                       url(r'', include('django.contrib.staticfiles.urls')),
                       ) + urlpatterns
