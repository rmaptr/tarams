"""
=================================================================
RFID DUAL-ANTENNA GATE SYSTEM - RASPBERRY PI
=================================================================
Satu module RFID reader dengan 2 antenna port, 1 koneksi serial.

LAYOUT PINTU:
                    ┌─────────────┐
    [LUAR]          │   PINTU     │          [DALAM]
    Antenna 1       │  (Gerbang)  │     Antenna 2
                    └─────────────┘

LOGIKA ARAH:
  • Masuk (IN):  Antenna 1 deteksi → lewat pintu → Antenna 2 (terakhir)
  • Keluar (OUT): Antenna 2 deteksi → lewat pintu → Antenna 1 (terakhir)
  → Port TERAKHIR yang mendeteksi = arah final.

CARA PAKAI:
  1. sudo apt install python3-requests python3-serial python3-rpi.gpio
  2. Edit BACKEND_URL
  3. sudo python3 raspi_int.py
"""

import serial
import time
import requests
import RPi.GPIO as GPIO

# =================================================================
# KONFIGURASI
# =================================================================
PORT = '/dev/ttyACM0'
BAUD = 38400

BACKEND_URL = "http://192.168.246.123:8000/api/track/"

# RF Power: 00~1B hex (-2 to 25 dBm)
RF_POWER_HEX = "19"  # 23 dBm

# Waktu tunggu (detik) setelah deteksi pertama.
# Sistem menunggu selama ini untuk melihat apakah antena lain 
# juga mendeteksi tag yang sama → menentukan arah.
GATE_WINDOW = 3

# Cooldown setelah arah ditentukan
COOLDOWN = 8

# --- GPIO PIN ---
LED_HIJAU = 17
LED_MERAH = 27
BUZZER    = 22

# =================================================================
# SETUP GPIO
# =================================================================
GPIO.setmode(GPIO.BCM)
GPIO.setup([LED_HIJAU, LED_MERAH, BUZZER], GPIO.OUT)
GPIO.output([LED_HIJAU, LED_MERAH, BUZZER], False)

# =================================================================
# STATE TRACKING
# =================================================================
# { tag_id: { 'first_ant': 1|2, 'last_ant': 1|2, 'first_time': float } }
pending_tags = {}
sent_cooldown = {}  # { tag_id: last_sent_time }

# =================================================================
# FUNGSI INDIKATOR
# =================================================================

def feedback_masuk():
    GPIO.output(LED_HIJAU, True)
    GPIO.output(BUZZER, True)
    time.sleep(0.15)
    GPIO.output(BUZZER, False)
    time.sleep(0.1)
    GPIO.output(LED_HIJAU, False)

def feedback_keluar():
    GPIO.output(LED_MERAH, True)
    GPIO.output(BUZZER, True)
    time.sleep(0.15)
    GPIO.output(BUZZER, False)
    time.sleep(0.1)
    GPIO.output(LED_MERAH, False)

def feedback_unknown():
    for _ in range(3):
        GPIO.output(LED_MERAH, True)
        time.sleep(0.1)
        GPIO.output(LED_MERAH, False)
        time.sleep(0.1)

def feedback_error():
    for _ in range(5):
        GPIO.output(LED_MERAH, True)
        time.sleep(0.05)
        GPIO.output(LED_MERAH, False)
        time.sleep(0.05)


# =================================================================
# FUNGSI KIRIM DATA
# =================================================================

def kirim_ke_server(tag_id, antenna_port):
    payload = {"rfid_uid": tag_id, "antenna_port": antenna_port}
    direction = "IN (Masuk)" if antenna_port == 2 else "OUT (Keluar)"
    
    try:
        response = requests.post(BACKEND_URL, json=payload, timeout=5)
        
        if response.status_code == 201:
            data = response.json()
            print(f"  ✅ {data['asset_id']} → {direction}")
            feedback_masuk() if antenna_port == 2 else feedback_keluar()
        elif response.status_code == 404:
            print(f"  ⚠️  Tag tidak terdaftar")
            feedback_unknown()
        else:
            print(f"  ❌ Server Error: HTTP {response.status_code}")
            feedback_error()
    except requests.exceptions.ConnectionError:
        print(f"  ❌ GAGAL KONEKSI ke {BACKEND_URL}")
        feedback_error()
    except requests.exceptions.Timeout:
        print(f"  ❌ TIMEOUT")
        feedback_error()


def init_antenna_switching(ser):
    """
    Aktifkan antenna switching via GPIO mux.
    Dari datasheet: Switch Antenna OPEN = N7,22 + N7,11
    """
    ser.write(b'\x0aN7,22\x0d')
    time.sleep(0.05)
    ser.read(100)
    ser.write(b'\x0aN7,11\x0d')
    time.sleep(0.05)
    ser.read(100)


def select_antenna(ser, antenna_num):
    """
    Pilih antena aktif via GPIO pins (N9 command).
    Dari datasheet:
      ANT1: N9,20 + N9,10
      ANT2: N9,20 + N9,11
      ANT3: N9,22 + N9,11
      ANT4: N9,22 + N9,10
    """
    ant_label = "LUAR" if antenna_num == 1 else "DALAM"
    
    if antenna_num == 1:
        ser.write(b'\x0aN9,20\x0d')
        time.sleep(0.02)
        ser.read(100)
        ser.write(b'\x0aN9,10\x0d')
    elif antenna_num == 2:
        ser.write(b'\x0aN9,20\x0d')
        time.sleep(0.02)
        ser.read(100)
        ser.write(b'\x0aN9,11\x0d')
    
    time.sleep(0.02)
    ser.read(100)
    print(f"  🔄 ANT{antenna_num} ({ant_label}) aktif", end=" → ")


def scan_antenna(ser, antenna_num):
    """
    Pilih antena, lalu scan tag.
    Return list of tag_id yang terdeteksi.
    """
    # 1. Switch ke antena yang diminta
    select_antenna(ser, antenna_num)
    
    # 2. Query tag: <LF>Q<CR>
    ser.write(b'\x0aQ\x0d')
    respon = ser.read_until(b'\x0d\x0a')
    
    tags = []
    if len(respon) > 4:
        tag_id = respon[2:-2].decode('ascii', errors='ignore')
        if tag_id and tag_id != 'Q':
            tags.append(tag_id)
            print(f"TAG: {tag_id}")
        else:
            print("kosong")
    else:
        print("kosong")
    
    return tags


# =================================================================
# PROSES PENDING TAGS (Decision)
# =================================================================

def process_pending():
    """Periksa tag yang sudah lewat GATE_WINDOW, tentukan arah."""
    now = time.time()
    tags_to_remove = []
    
    for tag_id, data in pending_tags.items():
        elapsed = now - data['first_time']
        
        if elapsed >= GATE_WINDOW:
            tags_to_remove.append(tag_id)
            
            last_ant = data['last_ant']
            first_ant = data['first_ant']
            
            # =====================================================
            # FILTER: Hanya proses jika KEDUA antena mendeteksi!
            # Jika hanya 1 antena → orang cuma lewat, bukan masuk/keluar.
            # =====================================================
            if first_ant == last_ant:
                print(f"\n⏭️  SKIP: {tag_id}")
                print(f"   Hanya terdeteksi di Ant {last_ant} saja (lewat, bukan masuk/keluar)\n")
                continue
            
            # Cek cooldown
            last_sent = sent_cooldown.get(tag_id, 0)
            if now - last_sent < COOLDOWN:
                continue
            
            # LOGIKA INTI: Antena terakhir menentukan arah
            direction = "IN" if last_ant == 2 else "OUT"
            path = f"Ant {first_ant} → Ant {last_ant}"
            
            print(f"\n📡 ARAH TERDETEKSI: {tag_id}")
            print(f"   Jalur: {path} → {direction}")
            
            kirim_ke_server(tag_id, last_ant)
            sent_cooldown[tag_id] = now
            print()
    
    for tag_id in tags_to_remove:
        del pending_tags[tag_id]


# =================================================================
# MAIN LOOP
# =================================================================

try:
    ser = serial.Serial(PORT, BAUD, timeout=0.5)
    
    # Set RF Power
    ser.write(f'\x0aN1,{RF_POWER_HEX}\x0d'.encode('ascii'))
    time.sleep(0.3)
    ser.read(100)
    
    # Baca power untuk konfirmasi
    ser.write(b'\x0aN0,00\x0d')
    time.sleep(0.3)
    resp = ser.read(100)
    
    # Aktifkan antenna switching (GPIO mux)
    init_antenna_switching(ser)
    print("  Antenna switching enabled (N7,22 + N7,11)")
    
    print()
    print("=" * 55)
    print("  RFID DUAL-ANTENNA GATE SYSTEM")
    print("=" * 55)
    print(f"  Serial  : {PORT}")
    print(f"  Server  : {BACKEND_URL}")
    print(f"  Ant 1   : LUAR (sebelum pintu)")
    print(f"  Ant 2   : DALAM (setelah pintu)")
    print(f"  Power   : 0x{RF_POWER_HEX}")
    print(f"  Window  : {GATE_WINDOW}s")
    print(f"  Cooldown: {COOLDOWN}s")
    if resp:
        print(f"  Power OK: {resp.hex()}")
    print("=" * 55)
    print()
    print("🚪 Sistem gerbang aktif! Silakan lewat...")
    print("   (Ctrl+C untuk berhenti)\n")
    
    while True:
        # Scan Antena 1 (LUAR)
        tags_ant1 = scan_antenna(ser, 1)
        
        # Scan Antena 2 (DALAM)
        tags_ant2 = scan_antenna(ser, 2)
        
        now = time.time()
        
        # Proses tag dari Antena 1
        for tag_id in tags_ant1:
            if tag_id in pending_tags:
                pending_tags[tag_id]['last_ant'] = 1
            else:
                pending_tags[tag_id] = {
                    'first_ant': 1, 'last_ant': 1,
                    'first_time': now
                }
        
        # Proses tag dari Antena 2
        for tag_id in tags_ant2:
            if tag_id in pending_tags:
                pending_tags[tag_id]['last_ant'] = 2
            else:
                pending_tags[tag_id] = {
                    'first_ant': 2, 'last_ant': 2,
                    'first_time': now
                }
        
        # Cek apakah ada tag yang siap diproses
        process_pending()
        
        time.sleep(0.1)

except serial.SerialException as e:
    print(f"\n❌ Serial Error: {e}")
    print("  Pastikan reader USB terhubung!")

except KeyboardInterrupt:
    print("\n\n🛑 Program dimatikan.")

finally:
    GPIO.cleanup()
    try:
        ser.close()
    except:
        pass
    print("GPIO dan Serial dibersihkan. Selesai.")