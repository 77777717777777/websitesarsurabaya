"""
Migrasi data historis Basarnas (Excel, 2023-2025, 35 kolom) ke skema sar_dashboard.

STATUS: disiapkan, BELUM DIJALANKAN terhadap data asli. File Excel resminya belum
tersedia saat script ini ditulis -- struktur & aturan mapping di bawah mengikuti
spesifikasi yang sudah disepakati (lihat bagian 8 dokumen requirement).

Cara pakai (nanti):
    pip install pandas openpyxl pymysql python-dotenv
    python migrate_excel.py path/ke/data_basarnas_2023_2025.xlsx

Aman dijalankan berkali-kali (idempotent): baris yang sudah ada (dicek dari
kombinasi waktu_kejadian + nama_objek_terdampak) tidak akan di-insert ulang.

Kolom Excel yang diasumsikan (35 kolom, header bisa case-insensitive / spasi
bebas -- lihat COLUMN_ALIASES di bawah untuk normalisasi nama kolom):
    TANGGAL/WAKTU KEJADIAN, KATEGORI, KLASIFIKASI, NAMA OBJEK TERDAMPAK,
    JENIS KECELAKAAN (narasi panjang), LOKASI KEJADIAN, KOORDINAT LKK,
    RADIAL, AKSI, STATUS OPERASI, SUMBER BERITA, WAKTU LAPOR, WAKTU BERANGKAT,
    WAKTU TIBA, WAKTU SELESAI, WAKTU SIAP (menit), WAKTU TEMPUH (menit),
    JARAK LAUT (NM), JARAK DARAT (KM), POB, SELAMAT, MENINGGAL, HILANG,
    KENDALA PELAKSANAAN, LOKASI DITEMUKAN, KOORDINAT DITEMUKAN,
    JARAK DARI LKK (KM), LAIN-LAIN, BIAYA (RP), INSTANSI & JML PERSONEL,
    PERALATAN, dst.
"""
import re
import sys
import unicodedata
from datetime import datetime

try:
    import pandas as pd
except ImportError:
    print("pandas belum terinstall. Jalankan: pip install pandas openpyxl")
    sys.exit(1)

import pymysql
from pymysql.cursors import DictCursor

sys.path.insert(0, '../backend')
try:
    from config import DB_CONFIG
except ImportError:
    import os
    DB_CONFIG = {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'port': int(os.environ.get('DB_PORT', 3306)),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', ''),
        'database': os.environ.get('DB_NAME', 'sar_dashboard'),
        'charset': 'utf8mb4',
    }

DEFAULT_POS = "KN SAR Surabaya (Pusat)"

# 8 kategori baku peralatan (harus persis sama dengan isi ref_peralatan)
PERALATAN_BAKU = [
    "Peralatan Water Rescue",
    "Peralatan Komunikasi",
    "Peralatan Medis",
    "Peralatan APD dan Baju Hazmat",
    "Peralatan Perahu Rafting",
    "Peralatan Perahu Karet dan Motor Tempel",
    "Peralatan Handle Sonar (Aqua Eye)",
    "Peralatan SAR Pendukung Lainnya",
]

# Kata kunci fuzzy untuk memetakan teks bebas (dengan typo) -> kategori baku.
PERALATAN_KEYWORDS = {
    "Peralatan Water Rescue": ["water rescue", "rescue air", "pelampung"],
    "Peralatan Komunikasi": ["komunikasi", "ht", "handy talky", "radio"],
    "Peralatan Medis": ["medis", "p3k", "obat", "medical"],
    "Peralatan APD dan Baju Hazmat": ["apd", "hazmat", "baju pelindung"],
    "Peralatan Perahu Rafting": ["rafting"],
    "Peralatan Perahu Karet dan Motor Tempel": ["perahu karet", "motor tempel", "rib"],
    "Peralatan Handle Sonar (Aqua Eye)": ["sonar", "aqua eye", "aquaeye"],
    "Peralatan SAR Pendukung Lainnya": [],  # fallback
}

COLUMN_ALIASES = {
    'tanggal_waktu_kejadian': ['tanggal kejadian', 'waktu kejadian', 'tgl kejadian'],
    'kategori': ['kategori'],
    'klasifikasi': ['klasifikasi', 'jenis kecelakaan singkat'],
    'nama_objek_terdampak': ['nama objek terdampak', 'objek terdampak'],
    'jenis_kecelakaan': ['jenis kecelakaan', 'kronologi', 'uraian kejadian'],
    'lokasi_kejadian': ['lokasi kejadian', 'lkk'],
    'koordinat_lkk': ['koordinat lkk', 'koordinat kejadian'],
    'radial': ['radial'],
    'aksi': ['aksi', 'pos', 'unit siaga'],
    'status_operasi': ['status operasi', 'status'],
    'sumber_berita': ['sumber berita'],
    'waktu_lapor': ['waktu lapor', 'tgl lapor'],
    'waktu_berangkat': ['waktu berangkat'],
    'waktu_tiba': ['waktu tiba'],
    'waktu_selesai': ['waktu selesai'],
    'waktu_siap': ['waktu siap', 'siap (menit)'],
    'waktu_tempuh': ['waktu tempuh', 'tempuh (menit)'],
    'jarak_laut': ['jarak laut', 'jarak laut (nm)'],
    'jarak_darat': ['jarak darat', 'jarak darat (km)'],
    'pob': ['pob'],
    'selamat': ['selamat', 'jumlah selamat'],
    'meninggal': ['meninggal', 'jumlah meninggal', 'md'],
    'hilang': ['hilang', 'jumlah hilang'],
    'kendala': ['kendala', 'kendala pelaksanaan'],
    'lokasi_ditemukan': ['lokasi ditemukan'],
    'koordinat_ditemukan': ['koordinat ditemukan'],
    'jarak_dari_lkk': ['jarak dari lkk', 'jarak dari lkk (km)'],
    'lain_lain': ['lain-lain', 'lain lain', 'catatan'],
    'biaya': ['biaya', 'biaya (rp)'],
    'instansi_personel': ['instansi & jml person', 'instansi dan jumlah personel', 'instansi'],
    'peralatan': ['peralatan'],
}


def normalize_header(h):
    h = unicodedata.normalize('NFKD', str(h)).strip().lower()
    h = re.sub(r'\s+', ' ', h)
    return h


def build_column_map(df_columns):
    """Petakan nama kolom Excel asli -> nama kolom logis internal."""
    normalized = {normalize_header(c): c for c in df_columns}
    colmap = {}
    for logical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized:
                colmap[logical] = normalized[alias]
                break
    return colmap


def get_or_create_ref(cur, table, id_col, name_col, name_value):
    if not name_value or not str(name_value).strip():
        return None
    name_value = str(name_value).strip()
    cur.execute(f"SELECT {id_col} FROM {table} WHERE {name_col} = %s", (name_value,))
    row = cur.fetchone()
    if row:
        return row[id_col]
    cur.execute(f"INSERT INTO {table} ({name_col}) VALUES (%s)", (name_value,))
    return cur.lastrowid


def split_sumber(raw):
    """'SUMBER BERITA' (pola bebas) -> (nama_pelapor, instansi_pelapor).
    Kalau ada pola jelas 'Nama - Instansi' atau 'Nama (Instansi)', dipisah.
    Kalau tidak jelas, semua ditaruh di nama_pelapor."""
    if not raw or not str(raw).strip():
        return None, None
    raw = str(raw).strip()
    for sep in [' - ', ' | ', '/']:
        if sep in raw:
            parts = raw.split(sep, 1)
            return parts[0].strip(), parts[1].strip()
    m = re.match(r'^(.*?)\s*\((.*?)\)\s*$', raw)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return raw, None


def fuzzy_match_peralatan(raw_text):
    """Teks bebas peralatan (bisa multi-item dipisah koma/;) -> list kategori baku unik."""
    if not raw_text or not str(raw_text).strip():
        return []
    text = str(raw_text).lower()
    items = re.split(r'[,;/\n]', text)
    matched = set()
    for item in items:
        item = item.strip()
        if not item:
            continue
        found = False
        for kategori, keywords in PERALATAN_KEYWORDS.items():
            if keywords and any(kw in item for kw in keywords):
                matched.add(kategori)
                found = True
                break
        if not found:
            matched.add("Peralatan SAR Pendukung Lainnya")
    return list(matched)


def parse_instansi_personel(raw):
    """'INSTANSI & JML PERSON' pola 'Nama(angka), Nama2(angka2)' -> [(nama, jumlah), ...]."""
    if not raw or not str(raw).strip():
        return []
    raw = str(raw).strip()
    out = []
    for chunk in re.split(r'[,;\n]', raw):
        chunk = chunk.strip()
        if not chunk:
            continue
        m = re.match(r'^(.*?)\s*\((\d+)\)\s*$', chunk)
        if m:
            out.append((m.group(1).strip(), int(m.group(2))))
        else:
            out.append((chunk, 0))
    return out


def parse_coord(raw):
    """Koordinat teks -> (lat, lon) desimal, jika bisa diparse. None kalau tidak."""
    if not raw or not str(raw).strip():
        return None, None
    raw = str(raw).strip()
    m = re.search(
        r'(-?\d+(?:\.\d+)?)\s*[°Ss]?\s*[Ss]?\D+(-?\d+(?:\.\d+)?)\s*[°Ee]?\s*[Ee]?',
        raw,
    )
    if not m:
        return None, None
    try:
        lat = abs(float(m.group(1)))
        lon = abs(float(m.group(2)))
        if 'S' in raw.upper():
            lat = -lat
        return lat, lon
    except ValueError:
        return None, None


def safe_dt(val):
    if pd.isna(val) or val in (None, ''):
        return None
    if isinstance(val, datetime):
        return val
    try:
        return pd.to_datetime(val).to_pydatetime()
    except Exception:
        return None


def safe_num(val):
    if pd.isna(val) or val in (None, ''):
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def row_already_exists(cur, waktu_kejadian, nama_objek):
    cur.execute(
        "SELECT id_operasi FROM operasi_sar WHERE waktu_kejadian = %s "
        "AND (nama_objek_terdampak <=> %s)",
        (waktu_kejadian, nama_objek),
    )
    return cur.fetchone() is not None


def migrate(excel_path):
    df = pd.read_excel(excel_path)
    colmap = build_column_map(df.columns)

    required = ['tanggal_waktu_kejadian']
    missing_required = [r for r in required if r not in colmap]
    if missing_required:
        print(f"GAGAL: kolom wajib tidak ditemukan di Excel: {missing_required}")
        print(f"Kolom yang terdeteksi: {list(df.columns)}")
        return

    conn = pymysql.connect(cursorclass=DictCursor, **DB_CONFIG)
    ok_count, fail_count, skip_count = 0, 0, 0
    fail_reasons = []

    def col(row, key):
        c = colmap.get(key)
        return row[c] if c and c in row else None

    try:
        with conn.cursor() as cur:
            for idx, row in df.iterrows():
                try:
                    waktu_kejadian = safe_dt(col(row, 'tanggal_waktu_kejadian'))
                    if waktu_kejadian is None:
                        fail_count += 1
                        fail_reasons.append(f"Baris {idx+2}: waktu_kejadian tidak valid/kosong")
                        continue

                    nama_objek = col(row, 'nama_objek_terdampak')
                    nama_objek = str(nama_objek).strip() if nama_objek and not pd.isna(nama_objek) else None

                    if row_already_exists(cur, waktu_kejadian, nama_objek):
                        skip_count += 1
                        continue

                    id_kategori = get_or_create_ref(cur, 'ref_kategori', 'id_kategori', 'nama_kategori', col(row, 'kategori'))
                    id_klasifikasi = get_or_create_ref(cur, 'ref_klasifikasi', 'id_klasifikasi', 'nama_klasifikasi', col(row, 'klasifikasi'))

                    narasi = col(row, 'jenis_kecelakaan')
                    narasi = str(narasi).strip() if narasi and not pd.isna(narasi) else None

                    lat, lon = parse_coord(col(row, 'koordinat_lkk'))
                    id_lokasi_kejadian = None
                    lokasi_desc = col(row, 'lokasi_kejadian')
                    if lokasi_desc and not pd.isna(lokasi_desc):
                        cur.execute(
                            "INSERT INTO lokasi (deskripsi, koordinat_teks, latitude, longitude) VALUES (%s,%s,%s,%s)",
                            (str(lokasi_desc).strip(), col(row, 'koordinat_lkk'), lat, lon),
                        )
                        id_lokasi_kejadian = cur.lastrowid

                    id_lokasi_ditemukan = None
                    lat_d, lon_d = parse_coord(col(row, 'koordinat_ditemukan'))
                    lokasi_ditemukan_desc = col(row, 'lokasi_ditemukan')
                    if lokasi_ditemukan_desc and not pd.isna(lokasi_ditemukan_desc):
                        cur.execute(
                            "INSERT INTO lokasi (deskripsi, koordinat_teks, latitude, longitude) VALUES (%s,%s,%s,%s)",
                            (str(lokasi_ditemukan_desc).strip(), col(row, 'koordinat_ditemukan'), lat_d, lon_d),
                        )
                        id_lokasi_ditemukan = cur.lastrowid

                    aksi_text = col(row, 'aksi')
                    pos_name = str(aksi_text).strip() if aksi_text and not pd.isna(aksi_text) else DEFAULT_POS
                    cur.execute("SELECT id_pos FROM ref_pos_unit WHERE nama_pos = %s", (pos_name,))
                    pos_row = cur.fetchone()
                    id_pos = pos_row['id_pos'] if pos_row else get_or_create_ref(
                        cur, 'ref_pos_unit', 'id_pos', 'nama_pos', DEFAULT_POS
                    )

                    waktu_berangkat = safe_dt(col(row, 'waktu_berangkat'))

                    nama_pelapor, instansi_pelapor = split_sumber(col(row, 'sumber_berita'))
                    id_sumber = None
                    sumber_raw = col(row, 'sumber_berita')
                    if sumber_raw and not pd.isna(sumber_raw):
                        sumber_text = str(sumber_raw).lower()
                        for kategori_umum in ['Masyarakat', 'Instansi', 'Nelayan', 'Polisi', 'Dishub']:
                            if kategori_umum.lower() in sumber_text:
                                cur.execute("SELECT id_sumber FROM ref_sumber_berita WHERE nama_sumber = %s", (kategori_umum,))
                                r = cur.fetchone()
                                if r:
                                    id_sumber = r['id_sumber']
                                break
                        if id_sumber is None:
                            cur.execute("SELECT id_sumber FROM ref_sumber_berita WHERE nama_sumber = 'Lainnya'")
                            r = cur.fetchone()
                            id_sumber = r['id_sumber'] if r else None

                    cur.execute(
                        """INSERT INTO operasi_sar (
                            waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak,
                            narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos,
                            id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor,
                            waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai,
                            waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km,
                            pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang,
                            kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km,
                            lain_lain, biaya_rp, id_admin_input
                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                        (
                            waktu_kejadian, id_kategori, id_klasifikasi, nama_objek,
                            narasi, id_lokasi_kejadian, safe_num(col(row, 'radial')), id_pos,
                            id_sumber, nama_pelapor, instansi_pelapor, None,
                            safe_dt(col(row, 'waktu_lapor')), waktu_berangkat,
                            safe_dt(col(row, 'waktu_tiba')), safe_dt(col(row, 'waktu_selesai')),
                            safe_num(col(row, 'waktu_siap')), safe_num(col(row, 'waktu_tempuh')),
                            safe_num(col(row, 'jarak_laut')), safe_num(col(row, 'jarak_darat')),
                            safe_num(col(row, 'pob')), safe_num(col(row, 'selamat')) or 0,
                            safe_num(col(row, 'meninggal')) or 0, safe_num(col(row, 'hilang')) or 0,
                            col(row, 'kendala'), id_lokasi_ditemukan, safe_num(col(row, 'jarak_dari_lkk')),
                            col(row, 'lain_lain'), safe_num(col(row, 'biaya')), None,
                        ),
                    )
                    id_operasi = cur.lastrowid

                    for instansi_nama, jumlah in parse_instansi_personel(col(row, 'instansi_personel')):
                        id_instansi = get_or_create_ref(cur, 'ref_instansi', 'id_instansi', 'nama_instansi', instansi_nama)
                        if id_instansi:
                            cur.execute(
                                "INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (%s,%s,%s)",
                                (id_operasi, id_instansi, jumlah),
                            )

                    for peralatan_nama in fuzzy_match_peralatan(col(row, 'peralatan')):
                        cur.execute("SELECT id_peralatan FROM ref_peralatan WHERE nama_peralatan = %s", (peralatan_nama,))
                        r = cur.fetchone()
                        if r:
                            cur.execute(
                                "INSERT IGNORE INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (%s,%s,1)",
                                (id_operasi, r['id_peralatan']),
                            )

                    # Tabel korban SENGAJA dibiarkan kosong untuk data historis --
                    # narasi_kejadian sudah menyimpan uraian lengkap termasuk info korban.

                    conn.commit()
                    ok_count += 1
                except Exception as e:
                    conn.rollback()
                    fail_count += 1
                    fail_reasons.append(f"Baris {idx+2}: {e}")
    finally:
        conn.close()

    print("=" * 60)
    print(f"Migrasi selesai: {ok_count} berhasil, {skip_count} dilewati (duplikat), {fail_count} gagal")
    if fail_reasons:
        print("Alasan gagal:")
        for reason in fail_reasons:
            print(f"  - {reason}")
    print("=" * 60)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Cara pakai: python migrate_excel.py path/ke/file.xlsx")
        sys.exit(1)
    migrate(sys.argv[1])
