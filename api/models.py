from django.db import models

# =================================================================
# I. MODEL LOGISTIK (Kodingan Magang - JANGAN DIUBAH)
# =================================================================
# Menjaga kompatibilitas dengan fitur registrasi aset di SeaBank Lt. 35

class DeliveryOrder(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Completed', 'Completed'),
    ]

    do_number = models.CharField(max_length=100, unique=True)
    po_number = models.CharField(blank=True, max_length=100, null=True)
    delivery_date = models.DateField()
    entity = models.CharField(default='PT Bank SeaBank Indonesia', max_length=255)
    
    # Menampung nama staf yang menginput pendaftaran
    operator_name = models.CharField(max_length=100, blank=True, null=True)
    
    remark = models.TextField(blank=True, null=True)
    file = models.FileField(blank=True, null=True, upload_to='delivery_orders/')
    status = models.CharField(choices=STATUS_CHOICES, default='Draft', max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.do_number


# =================================================================
# II. MODEL INVENTORY (Update untuk Monitoring Proyek Akhir)
# =================================================================
# Menambahkan field monitoring tanpa menghapus field spesifikasi hardware lama

class MasterAsset(models.Model):
    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Assigned', 'Assigned'),
        ('Faulty', 'Faulty'),
        ('Lost', 'Lost'),
        ('Retire', 'Retire'),
    ]

    asset_id = models.CharField(max_length=50, unique=True)
    status = models.CharField(choices=STATUS_CHOICES, default='Available', max_length=20)
    asset_type = models.CharField(max_length=100)
    model_name = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255, unique=True)
    
    # Identitas fisik aset (Barcode & RFID)
    asset_tag = models.CharField(blank=True, max_length=100, null=True, unique=True)
    finance_tag = models.CharField(blank=True, max_length=100, null=True)
    
    # Field rfid_uid menampung data EPC/TID dari UHF Reader DM01/DM02/DS01
    rfid_uid = models.CharField(blank=True, max_length=100, null=True, unique=True) 
    
    # -------------------------------------------------------------
    # FIELD BARU UNTUK PROYEK AKHIR (MONITORING LOGIC)
    # -------------------------------------------------------------
    # Mengetahui kapan terakhir kali aset melewati gerbang pelacak
    last_seen = models.DateTimeField(null=True, blank=True)
    # Status keberadaan (True = Terdeteksi di Dalam / IN, False = Di Luar / OUT)
    is_present = models.BooleanField(default=False)
    # Mencatat lokasi terakhir berdasarkan antena: "Luar" atau "Dalam"
    last_antenna = models.CharField(max_length=10, blank=True, null=True)
    # -------------------------------------------------------------
    
    # Spesifikasi teknis perangkat (Penting untuk audit IT SeaBank)
    processor = models.CharField(blank=True, max_length=100, null=True)
    ram = models.CharField(blank=True, max_length=100, null=True)
    storage = models.CharField(blank=True, max_length=100, null=True)
    
    # Lokasi penyimpanan dan data department
    storeroom = models.CharField(default='IT Storage Lt 35', max_length=100)
    asset_owner_name = models.CharField(default='-', max_length=255)
    owner_department = models.CharField(default='-', max_length=255)
    asset_location = models.CharField(default='-', max_length=255)
    
    # Masa berlaku garansi
    warranty_start = models.DateField(blank=True, null=True)
    warranty_end = models.DateField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.asset_id} - {self.model_name}"


# =================================================================
# III. MODEL MONITORING (Baru untuk Proyek Akhir)
# =================================================================
# Untuk mencatat sejarah pergerakan aset masuk dan keluar

class MonitoringLog(models.Model):
    """
    Tabel ini mencatat setiap deteksi dari gerbang otomatis Fonkan FM-704.
    """
    ANTENNA_CHOICES = [
        (1, 'Luar'),
        (2, 'Dalam'),
    ]
    
    MOVEMENT_CHOICES = [
        ('IN', 'Masuk Area'),
        ('OUT', 'Keluar Area'),
    ]

    asset = models.ForeignKey(
        MasterAsset, 
        on_delete=models.CASCADE, 
        related_name='monitoring_logs'
    )
    
    # Port 1 untuk Luar, Port 2 untuk Dalam
    antenna_port = models.IntegerField(choices=ANTENNA_CHOICES)
    # Status pergerakan berdasarkan logika antena terakhir
    movement_type = models.CharField(max_length=10, choices=MOVEMENT_CHOICES)
    # RSSI untuk melihat kekuatan sinyal saat lewat
    rssi = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.asset.asset_id} - {self.movement_type} ({self.timestamp})"


# =================================================================
# IV. MODEL WAREHOUSING STAGING (Kodingan Magang - JANGAN DIUBAH)
# =================================================================

class StagingItem(models.Model):
    delivery_order = models.ForeignKey(
        DeliveryOrder, 
        on_delete=models.CASCADE, 
        related_name='items'
    )
    category = models.CharField(max_length=100)
    model_name = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255)
    finance_tag = models.CharField(blank=True, max_length=255, null=True)
    
    # Menyimpan data pembacaan RFID saat proses registrasi awal (DM02)
    rfid_uid = models.CharField(blank=True, max_length=255, null=True) 
    
    quantity = models.IntegerField(default=1)
    processor = models.CharField(blank=True, max_length=100, null=True)
    ram = models.CharField(blank=True, max_length=100, null=True)
    storage = models.CharField(blank=True, max_length=100, null=True)
    store_room = models.CharField(default='IT Storage Lt 35', max_length=100)
    
    warranty_start = models.DateField(blank=True, null=True)
    warranty_end = models.DateField(blank=True, null=True)
    asset_owner_name = models.CharField(blank=True, max_length=255, null=True)
    owner_department = models.CharField(blank=True, max_length=255, null=True)

    def __str__(self):
        return f"Item: {self.model_name} (DO: {self.delivery_order.do_number})"