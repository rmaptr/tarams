from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import DeliveryOrder, StagingItem, MasterAsset, MonitoringLog, BorrowRecord
from .serializers import (
    DeliveryOrderSerializer, 
    StagingItemSerializer, 
    MasterAssetSerializer,
    MonitoringLogSerializer,
    BorrowRecordSerializer
)

# --- IMPORT UNTUK WEBSOCKET BROADCAST ---
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# =================================================================
# I. VIEWSET LOGISTIK & ASSETS (Kodingan Magang - JANGAN DIHAPUS)
# =================================================================

class DeliveryOrderViewSet(viewsets.ModelViewSet):
    queryset = DeliveryOrder.objects.all().order_by('-created_at')
    serializer_class = DeliveryOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(
            operator_name=self.request.user.username
        )

    def perform_destroy(self, instance):
        serial_numbers = instance.items.values_list('serial_number', flat=True)
        if serial_numbers:
            MasterAsset.objects.filter(serial_number__in=serial_numbers).delete()
        instance.delete()

class StagingItemViewSet(viewsets.ModelViewSet):
    queryset = StagingItem.objects.all()
    serializer_class = StagingItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class MasterAssetViewSet(viewsets.ModelViewSet):
    queryset = MasterAsset.objects.all().order_by('-created_at')
    serializer_class = MasterAssetSerializer
    permission_classes = [permissions.IsAuthenticated]


# =================================================================
# II. VIEWSET MONITORING (Baru untuk Proyek Akhir)
# =================================================================

class MonitoringLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet khusus untuk nampilin riwayat pergerakan aset di Laman Monitoring.
    ReadOnly karena data ini cuma diinput oleh Raspberry Pi, bukan user web.
    """
    queryset = MonitoringLog.objects.all().order_by('-timestamp')
    serializer_class = MonitoringLogSerializer
    permission_classes = [permissions.IsAuthenticated]


# =================================================================
# III. VIEWSET HOUR GLASS (Peminjaman Aset)
# =================================================================

class BorrowRecordViewSet(viewsets.ModelViewSet):
    """
    CRUD untuk BorrowRecord.
    POST   /api/borrows/          → Pinjam aset (status jadi Assigned)
    GET    /api/borrows/          → List semua peminjaman
    POST   /api/borrows/{id}/return_asset/ → Kembalikan aset
    DELETE /api/borrows/{id}/      → Batalkan peminjaman
    """
    queryset = BorrowRecord.objects.all()
    serializer_class = BorrowRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = BorrowRecord.objects.select_related('asset').all()
        # Auto-update status Overdue untuk yang lewat jatuh tempo
        now = timezone.now()
        qs.filter(status='Active', due_date__lt=now).update(status='Overdue')
        
        # Filter optional: ?status=Active / ?status=Returned
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user.username)

    def perform_destroy(self, instance):
        # Kalau dihapus/dibatalkan, kembalikan status aset
        if instance.status in ('Active', 'Overdue'):
            asset = instance.asset
            asset.status = 'Available'
            asset.asset_owner_name = '-'
            asset.owner_department = '-'
            asset.save()
        instance.delete()

    @action(detail=True, methods=['post'])
    def return_asset(self, request, pk=None):
        """
        POST /api/borrows/{id}/return_asset/
        Tandai aset sudah dikembalikan.
        """
        record = self.get_object()
        if record.returned_at:
            return Response(
                {"error": "Aset ini sudah dikembalikan sebelumnya."},
                status=status.HTTP_400_BAD_REQUEST
            )

        record.returned_at = timezone.now()
        record.status = 'Returned'
        record.save()

        # Reset status aset
        asset = record.asset
        asset.status = 'Available'
        asset.asset_owner_name = '-'
        asset.owner_department = '-'
        asset.save()

        return Response(BorrowRecordSerializer(record).data)


class RFIDTrackingView(APIView):
    """
    ENDPOINT UTAMA UNTUK RASPBERRY PI
    Jalur: /api/track/
    Tugas: Menerima ID Tag, tentukan IN/OUT, update status aset,
           lalu BROADCAST ke semua frontend via WebSocket.
    """
    permission_classes = [permissions.AllowAny] 

    def post(self, request):
        rfid_uid = request.data.get('rfid_uid')
        antenna_port = request.data.get('antenna_port')

        if not rfid_uid or not antenna_port:
            return Response(
                {"error": "Data rfid_uid dan antenna_port wajib dikirim!"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 1. Cari Aset berdasarkan UID
            asset = MasterAsset.objects.get(rfid_uid=rfid_uid)
            
            # 2. Logika Antena (1=Luar, 2=Dalam)
            antenna_name = "Dalam" if int(antenna_port) == 2 else "Luar"
            movement = "IN" if int(antenna_port) == 2 else "OUT"
            
            # 3. Simpan Riwayat Pergerakan
            log = MonitoringLog.objects.create(
                asset=asset,
                antenna_port=antenna_port,
                movement_type=movement
            )
            
            # 4. Update Status di MasterAsset
            asset.last_seen = timezone.now()
            asset.is_present = (movement == "IN")
            asset.last_antenna = antenna_name
            
            if movement == "IN":
                asset.asset_location = "Gama Tower - IT Area"
            else:
                asset.asset_location = "Keluar / Di Luar Jangkauan"
                
            asset.save()

            # =========================================================
            # 5. AUTO-RETURN: Cek apakah aset punya peminjaman aktif
            # =========================================================
            if movement == 'IN':
                active_borrow = BorrowRecord.objects.filter(
                    asset=asset, status__in=['Active', 'Overdue']
                ).first()
                if active_borrow:
                    active_borrow.returned_at = timezone.now()
                    active_borrow.status = 'Returned'
                    active_borrow.save()
                    # Reset status aset ke Available
                    asset.status = 'Available'
                    asset.asset_owner_name = '-'
                    asset.owner_department = '-'
                    asset.save()

            # =========================================================
            # 5. BROADCAST KE SEMUA FRONTEND VIA WEBSOCKET (BARU!)
            # =========================================================
            channel_layer = get_channel_layer()
            ws_data = {
                'id': log.id,
                'asset_id': asset.asset_id,
                'model_name': asset.model_name,
                'category': asset.asset_type,
                'antenna_port': int(antenna_port),
                'antenna_display': antenna_name,
                'movement_type': movement,
                'rssi': None,
                'timestamp': log.timestamp.isoformat(),
            }
            async_to_sync(channel_layer.group_send)(
                'monitoring_live',
                {
                    'type': 'rfid_scan',   # Akan dipanggil jadi method rfid_scan() di consumer
                    'data': ws_data,
                }
            )

            return Response({
                "status": "Success",
                "asset_id": asset.asset_id,
                "movement": movement,
                "location": asset.asset_location
            }, status=status.HTTP_201_CREATED)

        except MasterAsset.DoesNotExist:
            return Response({
                "status": "Unknown Tag",
                "message": f"RFID {rfid_uid} belum terdaftar di sistem Master Asset."
            }, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)