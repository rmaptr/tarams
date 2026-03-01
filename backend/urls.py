from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # KITA SAMBUNGKAN KE FILE YANG BARU DIBUAT TADI
    # Artinya: Kalau ada alamat depannya "api/", oper ke "api/urls.py"
    path('api/', include('api.urls')), 
]