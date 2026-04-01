"""
WebSocket Consumer untuk Live Monitoring RFID.
Frontend konek ke ws://<host>/ws/monitoring/ dan akan terima push data
setiap kali Raspberry Pi mengirim scan baru via POST /api/track/.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class MonitoringConsumer(AsyncWebsocketConsumer):
    """
    Consumer ini join ke group 'monitoring_live'.
    Setiap kali ada data baru dari RFIDTrackingView, 
    data dikirim ke semua client yang terkoneksi.
    """

    async def connect(self):
        self.group_name = 'monitoring_live'

        # Gabung ke group monitoring
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Keluar dari group saat browser ditutup
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def rfid_scan(self, event):
        """
        Handler untuk event type 'rfid_scan'.
        Dipanggil saat RFIDTrackingView broadcast data baru.
        """
        await self.send(text_data=json.dumps(event['data']))
