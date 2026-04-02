from rest_framework import serializers
from .models import DeliveryOrder, StagingItem, MasterAsset, MonitoringLog, BorrowRecord
from rest_framework.validators import UniqueValidator
import datetime
import random

# =================================================================
# I. MONITORING SERIALIZER (UPDATE UNTUK STOCK OPNAME)
# =================================================================

class MonitoringLogSerializer(serializers.ModelSerializer):
    # Mapping data dari tabel MasterAsset agar muncul di tabel Monitoring
    asset_id = serializers.ReadOnlyField(source='asset.asset_id')
    model_name = serializers.ReadOnlyField(source='asset.model_name')
    
    # --- FIELD BARU: Mengambil Kategori dari Asset Type ---
    category = serializers.ReadOnlyField(source='asset.asset_type')
    
    # Mengubah angka Port (1/2) jadi teks (Luar/Dalam)
    antenna_display = serializers.CharField(source='get_antenna_port_display', read_only=True)

    class Meta:
        model = MonitoringLog
        fields = [
            'id', 'asset', 'asset_id', 'model_name', 'category',
            'antenna_port', 'antenna_display', 
            'movement_type', 'rssi', 'timestamp'
        ]


# =================================================================
# I-B. BORROW RECORD SERIALIZER (Hour Glass Feature)
# =================================================================

class BorrowRecordSerializer(serializers.ModelSerializer):
    # Relasi explicitly lookup via asset_id (karena frontend mengirim string AST-xxxx)
    asset = serializers.SlugRelatedField(
        slug_field='asset_id',
        queryset=MasterAsset.objects.all()
    )
    
    # Read-only fields dari relasi MasterAsset
    asset_id_display = serializers.ReadOnlyField(source='asset.asset_id')
    model_name = serializers.ReadOnlyField(source='asset.model_name')
    asset_type = serializers.ReadOnlyField(source='asset.asset_type')
    serial_number = serializers.ReadOnlyField(source='asset.serial_number')

    # Computed: sisa waktu dalam detik (negatif = overdue)
    time_remaining = serializers.SerializerMethodField()

    class Meta:
        model = BorrowRecord
        fields = [
            'id', 'asset', 'asset_id_display', 'model_name', 'asset_type',
            'serial_number', 'borrower_name', 'borrower_department',
            'purpose', 'borrowed_at', 'due_date', 'returned_at',
            'status', 'created_by', 'time_remaining'
        ]
        read_only_fields = ['status', 'returned_at', 'created_by', 'borrowed_at']

    def get_time_remaining(self, obj):
        if obj.returned_at:
            return 0
        from django.utils import timezone
        delta = obj.due_date - timezone.now()
        return int(delta.total_seconds())

    def validate_asset(self, value):
        # Hanya aset Available yang bisa dipinjam
        if value.status != 'Available':
            raise serializers.ValidationError(
                f"Aset {value.asset_id} statusnya '{value.status}', hanya aset 'Available' yang bisa dipinjam."
            )
        # Cek tidak ada peminjaman aktif
        if BorrowRecord.objects.filter(asset=value, status='Active').exists():
            raise serializers.ValidationError(
                f"Aset {value.asset_id} sedang dipinjam oleh orang lain."
            )
        return value

    def create(self, validated_data):
        record = super().create(validated_data)
        # Update status aset ke Assigned
        asset = record.asset
        asset.status = 'Assigned'
        asset.asset_owner_name = record.borrower_name
        asset.owner_department = record.borrower_department
        asset.save()
        return record

# =================================================================
# II. ASSET SERIALIZER (Kodingan Magang + Monitoring Fields)
# =================================================================

class MasterAssetSerializer(serializers.ModelSerializer):
    rfid_tag = serializers.CharField(source='rfid_uid', required=False, allow_null=True, allow_blank=True)
    
    # Indikator deteksi terakhir untuk di Laman Assets
    last_detection = serializers.DateTimeField(source='last_seen', read_only=True)

    class Meta:
        model = MasterAsset
        fields = [
            'id', 'asset_id', 'status', 'asset_type', 'model_name', 
            'serial_number', 'rfid_uid', 'rfid_tag', 'finance_tag', 
            'processor', 'ram', 'storage', 'storeroom', 
            'asset_owner_name', 'owner_department', 'asset_location', 
            'warranty_start', 'warranty_end', 'created_at',
            # Field Monitoring:
            'last_seen', 'is_present', 'last_antenna', 'last_detection'
        ]
        extra_kwargs = {
            'rfid_uid': {
                'required': False,
                'validators': [UniqueValidator(queryset=MasterAsset.objects.all(), message="RFID Tag ini sudah terdaftar di aset lain!")]
            }
        }

    def update(self, instance, validated_data):
        # Logika status otomatis SeaBank (TETAP DIJAGA)
        new_owner = validated_data.get('asset_owner_name', instance.asset_owner_name)
        if new_owner and new_owner.strip() != '-' and new_owner.strip() != '':
            validated_data['status'] = 'Assigned'
        else:
            validated_data['status'] = 'Available'
            validated_data['asset_owner_name'] = '-'
            validated_data['owner_department'] = '-'
        return super().update(instance, validated_data)


# =================================================================
# III. WAREHOUSING SERIALIZERS (Kodingan Magang - JANGAN DIUBAH)
# =================================================================

class StagingItemSerializer(serializers.ModelSerializer):
    rfid_tag = serializers.CharField(source='rfid_uid', required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = StagingItem
        fields = [
            'id', 'category', 'model_name', 'serial_number', 'finance_tag', 
            'rfid_uid', 'rfid_tag', 'quantity', 'processor', 'ram', 
            'storage', 'store_room', 'warranty_start', 'warranty_end', 
            'asset_owner_name', 'owner_department'
        ]
        extra_kwargs = {'delivery_order': {'read_only': True}}


class DeliveryOrderSerializer(serializers.ModelSerializer):
    items = StagingItemSerializer(many=True)
    total_assets = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = DeliveryOrder
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        delivery_order = DeliveryOrder.objects.create(**validated_data)
        
        for item_data in items_data:
            StagingItem.objects.create(delivery_order=delivery_order, **item_data)
            if validated_data.get('status') == 'Completed':
                self.create_master_asset(item_data)
        return delivery_order

    def update(self, instance, validated_data):
        new_status = validated_data.get('status', instance.status)
        instance.do_number = validated_data.get('do_number', instance.do_number)
        instance.status = new_status
        instance.operator_name = validated_data.get('operator_name', instance.operator_name)
        instance.save()

        if 'items' in validated_data:
            items_data = validated_data.pop('items')
            instance.items.all().delete()
            for item_data in items_data:
                StagingItem.objects.create(delivery_order=instance, **item_data)
                if new_status == 'Completed':
                    asset = MasterAsset.objects.filter(serial_number=item_data.get('serial_number')).first()
                    if asset:
                        self.update_master_asset(asset, item_data)
                    else:
                        self.create_master_asset(item_data)
        return instance

    def create_master_asset(self, item_data):
        unique_suffix = str(random.randint(1000, 9999))
        asset_id = f"AST-{datetime.date.today().strftime('%Y%m')}-{unique_suffix}"
        owner = item_data.get('asset_owner_name', '-')
        
        MasterAsset.objects.create(
            asset_id=asset_id,
            asset_tag=f"TAG-{unique_suffix}",
            rfid_uid=item_data.get('rfid_uid'), 
            serial_number=item_data.get('serial_number'),
            model_name=item_data.get('model_name'),
            asset_type=item_data.get('category', 'Hardware'),
            status='Assigned' if owner and owner != '-' else 'Available',
            asset_owner_name=owner,
            owner_department=item_data.get('owner_department', '-'),
            storeroom=item_data.get('store_room', 'IT Storage Lt 35')
        )

    def update_master_asset(self, asset, item_data):
        asset.rfid_uid = item_data.get('rfid_uid')
        asset.model_name = item_data.get('model_name')
        owner = item_data.get('asset_owner_name', '-')
        asset.asset_owner_name = owner
        asset.owner_department = item_data.get('owner_department', '-')
        asset.status = 'Assigned' if owner and owner != '-' else 'Available'
        asset.save()