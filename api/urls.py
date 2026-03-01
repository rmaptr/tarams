from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DeliveryOrderViewSet, 
    StagingItemViewSet, 
    MasterAssetViewSet,
    MonitoringLogViewSet,  # Baru untuk Proyek Akhir
    RFIDTrackingView      # Baru untuk Proyek Akhir (Raspberry Pi)
)
from rest_framework.authtoken.views import obtain_auth_token

# =================================================================
# DAFTAR ROUTER OTOMATIS (VIEWSETS)
# =================================================================
router = DefaultRouter()

# Jalur Magang (JANGAN DIUBAH)
router.register(r'warehousing', DeliveryOrderViewSet)
router.register(r'staging-items', StagingItemViewSet)
router.register(r'assets', MasterAssetViewSet)

# Jalur Proyek Akhir (BARU)
# Dipakai Frontend untuk nampilin riwayat IN/OUT
router.register(r'monitoring-logs', MonitoringLogViewSet, basename='monitoring-logs')

# =================================================================
# DAFTAR URL PATTERNS
# =================================================================
urlpatterns = [
    # Semua jalur tabel otomatis (warehousing, staging, assets, monitoring-logs)
    path('', include(router.urls)),
    
    # PINTU LOGIN (Token Auth)
    path('api_token_auth/', obtain_auth_token),

    # -------------------------------------------------------------
    # PINTU MASUK DATA RASPBERRY PI (PROYEK AKHIR)
    # -------------------------------------------------------------
    # Raspberry Pi bakal nembak data ke: http://[IP-Laptop]:8000/api/track/
    path('track/', RFIDTrackingView.as_view(), name='rfid-track'),
]