from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import DeliveryOrder, StagingItem, MasterAsset, MonitoringLog
from .serializers import (
    DeliveryOrderSerializer, 
    StagingItemSerializer, 
    MasterAssetSerializer,
    MonitoringLogSerializer # Pastikan lo tambahkan ini di serializers.py nanti
)

# =================================================================
# I. VIEWSET LOGISTIK & ASSETS (Kodingan Magang - JANGAN DIHAPUS)
# =================================================================

class DeliveryOrderViewSet(viewsets.ModelViewSet):
    queryset = DeliveryOrder.objects.all().order_by('-created_at')
    serializer_class = DeliveryOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Simpan nama user yang login sebagai operator
        serializer.save(
            operator_name=self.request.user.username
        )

    def perform_destroy(self, instance):
        # 1. Sebelum DO dihapus, ambil daftar Serial Number barang didalamnya
        serial_numbers = instance.items.values_list('serial_number', flat=True)

        # 2. Hapus data di MasterAsset yang terkait agar database bersih
        if serial_numbers:
            MasterAsset.objects.filter(serial_number__in=serial_numbers).delete()

        # 3. Hapus DO (StagingItem otomatis kehapus karena Cascade)
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


class RFIDTrackingView(APIView):
    """
    ENDPOINT UTAMA UNTUK RASPBERRY PI
    Jalur: /api/track/
    Tugas: Menerima ID Tag, tentukan IN/OUT, dan update status aset.
    """
    # Sementara allow any agar Raspberry Pi mudah nembak data saat testing, 
    # nanti bisa lo kasih TokenAuth.
    permission_classes = [permissions.AllowAny] 

    def post(self, request):
        rfid_uid = request.data.get('rfid_uid')
        antenna_port = request.data.get('antenna_port') # 1 atau 2

        if not rfid_uid or not antenna_port:
            return Response(
                {"error": "Data rfid_uid dan antenna_port wajib dikirim!"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 1. Cari Aset berdasarkan UID yang didaftarkan saat magang
            asset = MasterAsset.objects.get(rfid_uid=rfid_uid)
            
            # 2. Logika Antena (Sesuai kesepakatan: 1=Luar, 2=Dalam)
            # Jika antena terakhir adalah 'Dalam' (2), berarti statusnya Masuk (IN)
            # Jika antena terakhir adalah 'Luar' (1), berarti statusnya Keluar (OUT)
            antenna_name = "Dalam" if int(antenna_port) == 2 else "Luar"
            movement = "IN" if int(antenna_port) == 2 else "OUT"
            
            # 3. Simpan Riwayat Pergerakan
            MonitoringLog.objects.create(
                asset=asset,
                antenna_port=antenna_port,
                movement_type=movement
            )
            
            # 4. Update Status di MasterAsset agar muncul di Laman Assets lo
            asset.last_seen = timezone.now()
            asset.is_present = (movement == "IN")
            asset.last_antenna = antenna_name
            
            # Update lokasi fisik aset secara deskriptif
            if movement == "IN":
                asset.asset_location = "Gama Tower - IT Area"
            else:
                asset.asset_location = "Keluar / Di Luar Jangkauan"
                
            asset.save()

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