"""
WebSocket URL Routing.
Semua koneksi WebSocket ke ws://<host>/ws/monitoring/ diarahkan ke MonitoringConsumer.
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/monitoring/$', consumers.MonitoringConsumer.as_asgi()),
]
