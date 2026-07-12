
from django.contrib import admin
from django.urls import path
from config import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home_view, name='home'),
    path('admin-panel/', views.admin_panel_view, name='admin_panel'),
    path('reserva/', views.usuario_view, name='usuario'),
    path('api/tourists/create/', views.create_tourist_api, name='create_tourist_api'),
    path('api/tourists/update/', views.update_tourist_progress_api, name='update_tourist_progress_api'),
    path('api/tourists/list/', views.list_tourists_api, name='list_tourists_api'),
]
