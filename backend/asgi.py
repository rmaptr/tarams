"""
ASGI config for backend project.
Supports both HTTP and WebSocket connections.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Django ASGI app untuk HTTP biasa
django_asgi_app = get_asgi_application()

# Import routing SETELAH django.setup() dipanggil oleh get_asgi_application()
from api.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    # HTTP request biasa tetap ditangani Django
    "http": django_asgi_app,
    
    # WebSocket request diarahkan ke consumer monitoring
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
