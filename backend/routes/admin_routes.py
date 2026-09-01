
import time
from collections import defaultdict, deque
from datetime import datetime

from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash
from auth import verify_admin_login, login_required
from db import get_connection, query_all, query_one
from services.excel_import_service import parse_workbook
from routes.public_routes import build_filters

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ============================================================
# CATATAN
# ============================================================
# Backend admin ini ditulis untuk skema flat `kejadian_sar` yang benar-benar
# dipakai di database (lihat routes/public_routes.py untuk catatan migrasi
# skema yang sama). Versi sebelumnya dari file ini masih menulis ke tabel
# normalized (operasi_sar, korban, ref_kategori, dst) yang TIDAK ADA di
# database -- setiap create/update/delete akan selalu gagal. Semua endpoint
# di bawah sudah disesuaikan supaya konsisten dengan struktur kejadian_sar
# dan dengan payload yang dikirim frontend (lihat static/js/dashboard.js).

BULAN_NAMA = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]


def ok(data, message='OK'):
    return jsonify({'success': True, 'data': data, 'message': message})


def fail(message, status=400):
    return jsonify({'success': False, 'data': None, 'message': message}), status


# ============================================================
# AUTH
# ============================================================
# Rate limiting percobaan login (anti brute-force). Disimpan in-memory (dict
# per-proses), BUKAN di database/Redis -- cukup untuk deployment 1 proses
# seperti `python app.py` / 1 worker gunicorn yang dipakai project ini
# sekarang. Kalau nanti dijalankan dengan >1 worker/proses, counter ini tidak
# akan sinkron antar proses (masing-masing punya limit sendiri-sendiri) --
# butuh Redis/DB kalau mau scale ke situasi itu.
LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_SECONDS = 15 * 60  # 15 menit
_login_attempts = defaultdict(deque)  # key -> deque[timestamp percobaan gagal]


def _login_rate_limit_key(username):
    # Kombinasi IP + username: brute-force ke SATU akun (username tetap,
    # password diacak) tetap kena limit walau dari banyak IP berbeda tidak
    # tercakup di sini -- tapi kombinasi ini sudah cukup untuk kasus umum
    # (satu penyerang dari satu sumber mencoba banyak password).
    ip = request.headers.get('X-Forwarded-For', request.remote_addr) or 'unknown'
    return f"{ip.split(',')[0].strip()}:{username.lower()}"


def _login_is_locked(key):
    now = time.time()
    attempts = _login_attempts[key]
    while attempts and now - attempts[0] > LOGIN_LOCKOUT_SECONDS:
        attempts.popleft()
    return len(attempts) >= LOGIN_MAX_ATTEMPTS


def _login_record_failure(key):
    _login_attempts[key].append(time.time())


@admin_bp.route('/login', methods=['POST'])
def login():
    body = request.get_json(silent=True) or {}
    username = (body.get('username') or '').strip()
    password = body.get('password') or ''
    if not username or not password:
        return fail('Username dan password wajib diisi.', 400)

    rl_key = _login_rate_limit_key(username)
    if _login_is_locked(rl_key):
        return fail(
            f'Terlalu banyak percobaan login gagal untuk akun ini. '
            f'Coba lagi dalam {LOGIN_LOCKOUT_SECONDS // 60} menit.',
            429,
        )

    admin = verify_admin_login(username, password)
    if not admin:
        _login_record_failure(rl_key)
        return fail('Username atau password salah.', 401)

    _login_attempts.pop(rl_key, None)  # login berhasil -> reset hitungan gagal
    session['id_admin'] = admin['id_admin']
    session['username'] = admin['username']
    return ok({
        'id_admin': admin['id_admin'],
        'username': admin['username'],
        'nama_lengkap': admin['nama_lengkap'],
    }, 'Login berhasil.')


@admin_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return ok(None, 'Logout berhasil.')


@admin_bp.route('/me')
@login_required
def me():
    admin = query_one(
        "SELECT id_admin, username, nama_lengkap, status FROM admin WHERE id_admin = %s",
        (session['id_admin'],),
    )
    if not admin:
        session.clear()
        return fail('Sesi tidak valid.', 401)
    return ok(admin)


# ============================================================
# KELOLA AKUN ADMIN
# ============================================================
# Sengaja tidak ada endpoint hapus akun -- nonaktifkan (status='nonaktif') supaya
# histori tetap konsisten, konsisten dengan pola "no delete" yang sama dipakai di
# admin table (kolom status sudah ada dari schema.sql awal, cuma belum ada UI-nya).

@admin_bp.route('/admins', methods=['GET'])
@login_required
def admin_list():
    rows = query_all(
        """SELECT id_admin, username, nama_lengkap, status, created_at
           FROM admin ORDER BY created_at ASC"""
    )
    return ok(rows)


@admin_bp.route('/admins', methods=['POST'])
@login_required
def admin_create():
    body = request.get_json(silent=True) or {}
    username = (body.get('username') or '').strip()
    password = body.get('password') or ''
    nama_lengkap = (body.get('nama_lengkap') or '').strip()

    errors = []
    if not username:
        errors.append('Username wajib diisi.')
    elif len(username) < 3:
        errors.append('Username minimal 3 karakter.')
    if not nama_lengkap:
        errors.append('Nama lengkap wajib diisi.')
    if not password:
        errors.append('Password wajib diisi.')
    elif len(password) < 8:
        errors.append('Password minimal 8 karakter.')
    if errors:
        return fail(' '.join(errors), 400)

    existing = query_one("SELECT id_admin FROM admin WHERE username = %s", (username,))
    if existing:
        return fail('Username sudah dipakai, pilih username lain.', 400)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO admin (username, password, nama_lengkap, status) VALUES (%s, %s, %s, 'aktif')",
                (username, generate_password_hash(password), nama_lengkap),
            )
            new_id = cur.lastrowid
        conn.commit()
    except Exception as e:
        conn.rollback()
        return fail(f'Gagal membuat akun admin: {e}', 500)
    finally:
        conn.close()

    return ok({'id_admin': new_id, 'username': username, 'nama_lengkap': nama_lengkap}, 'Akun admin baru berhasil dibuat.')


@admin_bp.route('/admins/<int:id_admin>/status', methods=['PUT'])
@login_required
def admin_set_status(id_admin):
    body = request.get_json(silent=True) or {}
    status = body.get('status')
    if status not in ('aktif', 'nonaktif'):
        return fail('Status tidak valid.', 400)
    if id_admin == session.get('id_admin') and status == 'nonaktif':
        return fail('Tidak bisa menonaktifkan akun yang sedang dipakai untuk login saat ini.', 400)

    existing = query_one("SELECT id_admin FROM admin WHERE id_admin = %s", (id_admin,))
    if not existing:
        return fail('Akun admin tidak ditemukan.', 404)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE admin SET status = %s WHERE id_admin = %s", (status, id_admin))
        conn.commit()
    except Exception as e:
        conn.rollback()
        return fail(f'Gagal memperbarui status: {e}', 500)
    finally:
        conn.close()
    return ok(None, 'Status akun admin berhasil diperbarui.')


@admin_bp.route('/sumber-berita')
@login_required
def sumber_berita():
    """Dipindah dari public_routes.py -- kolom `sumber_berita` berisi PII (nama & no.
    HP pribadi pelapor), jadi hanya boleh diakses admin yang sudah login. Lihat catatan
    di public_routes.py."""
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT sumber_berita AS nama_sumber, COUNT(*) AS jumlah
            FROM kejadian_sar
            WHERE 1=1 {where_sql}
            GROUP BY sumber_berita
            ORDER BY jumlah DESC""",
        params,
    )
    return ok(rows)


# ============================================================
# Validasi & normalisasi payload kejadian_sar
# ============================================================
# Dipakai bersama oleh input manual satuan (POST/PUT /operasi) dan bulk
# import Excel (POST /operasi/bulk) -- satu sumber aturan validasi supaya
# keduanya konsisten.

# Kolom kejadian_sar yang diisi langsung dari payload (lihat schema.sql).
# Kolom lain (tahun, bulan, bulan_angka, status_operasi, durasi_operasi_hari)
# TIDAK dikirim client -- selalu dihitung di server dari field-field ini,
# supaya konsisten dan tidak bisa "dipalsukan" dari sisi frontend.
#
# Baris berlabel "kolom legacy" adalah kolom yang sudah ada di data historis
# (lihat database/data_kejadian_sar.sql) tapi TIDAK diminta lewat form manual
# -- diisi otomatis saat impor Excel (lihat services/excel_import_service.py)
# supaya data baru konsisten dengan data lama yang sudah ada di database.
# Untuk input manual, kolom-kolom ini cukup ditinggal kosong (None).
INSERT_COLUMNS = [
    'waktu_kejadian', 'tahun', 'bulan', 'bulan_angka',
    'kategori', 'klasifikasi', 'kategori_kejadian', 'jenis_kecelakaan', 'posisi_koordinat_area',
    'koordinat_lkk_teks', 'tipe_lkk',                                    # kolom legacy
    'latitude_lkk', 'longitude_lkk', 'wilayah_mapped', 'status_operasi',
    'sumber_berita',
    'waktu_lapor', 'waktu_berangkat', 'waktu_tiba', 'waktu_selesai',
    'rentang_waktu', 'jarak',                                            # kolom legacy
    'waktu_siap', 'waktu_tempuh', 'waktu_tempuh_menit',                  # 'waktu_tempuh' (teks) legacy
    'pob', 's_org', 'md_org', 'h_org',
    'lokasi_ditemukan',
    'koordinat_ditemukan_teks', 'tipe_ditemukan',                        # kolom legacy
    'latitude_ditemukan', 'longitude_ditemukan',
    'kendala_pelaksanaan_ops_sar', 'instansi_jml_person', 'peralatan',
    'biaya_rp', 'lainlain', 'aksi',                                      # 'aksi' legacy
    'durasi_operasi_hari',
]

_DT_FORMATS = ('%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M', '%Y-%m-%d %H:%M', '%Y-%m-%d')


def _parse_dt(raw):
    """Terima 'YYYY-MM-DD HH:MM:SS' (dikirim JS lewat .replace('T',' ')+':00')
    atau format datetime umum lain (dipakai saat mapping dari Excel). Return
    None kalau kosong, atau (None, False) ditandai invalid lewat return khusus."""
    if raw is None:
        return None, True
    if isinstance(raw, datetime):
        return raw, True
    s = str(raw).strip()
    if not s:
        return None, True
    for fmt in _DT_FORMATS:
        try:
            return datetime.strptime(s, fmt), True
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(s), True
    except ValueError:
        return None, False


def normalize_payload(body):
    """Ambil & validasi field dari payload mentah (dict), hitung kolom turunan.
    Return (values_dict_siap_insert, errors_list). Kalau errors_list tidak
    kosong, values_dict tidak boleh dipakai untuk insert/update."""
    body = body or {}
    errors = []
    v = {}

    def text(key, max_len=None):
        raw = body.get(key)
        s = ('' if raw is None else str(raw)).strip()
        if max_len and len(s) > max_len:
            s = s[:max_len]
        return s or None

    def as_float(key, lo=None, hi=None, label=None, required=False):
        raw = body.get(key)
        if raw in (None, ''):
            if required:
                errors.append(f'{label} wajib diisi.')
            return None
        try:
            f = float(raw)
        except (TypeError, ValueError):
            errors.append(f'{label} harus berupa angka.')
            return None
        if lo is not None and f < lo:
            errors.append(f'{label} tidak valid (minimum {lo}).')
        if hi is not None and f > hi:
            errors.append(f'{label} tidak valid (maksimum {hi}).')
        return f

    def as_int(key, label, default=0):
        raw = body.get(key)
        if raw in (None, ''):
            return default
        try:
            i = int(round(float(raw)))
        except (TypeError, ValueError):
            errors.append(f'{label} harus berupa angka bulat.')
            return default
        if i < 0:
            errors.append(f'{label} tidak boleh negatif.')
        return i

    # --- Informasi kejadian ---
    wk, wk_valid = _parse_dt(body.get('waktu_kejadian'))
    if not body.get('waktu_kejadian'):
        errors.append('Waktu Kejadian wajib diisi.')
    elif not wk_valid:
        errors.append('Format Waktu Kejadian tidak valid.')
    v['waktu_kejadian'] = wk

    kategori = text('kategori')
    if not kategori:
        errors.append('Kategori Kejadian wajib diisi.')
    v['kategori'] = kategori
    v['klasifikasi'] = text('klasifikasi')  # kolom legacy: teks klasifikasi mentah dari sumber
    v['kategori_kejadian'] = text('kategori_kejadian')  # Klasifikasi terstandarisasi
    v['jenis_kecelakaan'] = text('jenis_kecelakaan')
    v['posisi_koordinat_area'] = text('posisi_koordinat_area')

    # --- Lokasi kejadian ---
    v['latitude_lkk'] = as_float('latitude_lkk', -90, 90, 'Latitude', required=True)
    v['longitude_lkk'] = as_float('longitude_lkk', -180, 180, 'Longitude', required=True)
    v['koordinat_lkk_teks'] = text('koordinat_lkk_teks', max_len=255)  # kolom legacy
    v['tipe_lkk'] = text('tipe_lkk', max_len=32)  # kolom legacy (DMS/RADIAL/...)

    wilayah = text('wilayah_mapped')
    if not wilayah:
        errors.append('Wilayah Terdampak wajib diisi (minimal satu wilayah) -- data tanpa wilayah tidak akan muncul di filter dashboard.')
    v['wilayah_mapped'] = wilayah

    v['sumber_berita'] = text('sumber_berita')

    # --- Waktu pelaksanaan ---
    for key, label in [('waktu_lapor', 'Waktu Lapor'), ('waktu_berangkat', 'Waktu Berangkat'),
                        ('waktu_tiba', 'Waktu Tiba'), ('waktu_selesai', 'Waktu Selesai')]:
        raw = body.get(key)
        if raw:
            dtv, valid = _parse_dt(raw)
            if not valid:
                errors.append(f'Format {label} tidak valid.')
            v[key] = dtv
        else:
            v[key] = None

    if not v.get('waktu_lapor'):
        errors.append('Waktu Laporan Diterima wajib diisi.')

    # Waktu Siap & Waktu Tempuh wajib diisi HANYA kalau operasi ini akan
    # berstatus "Dilaksanakan" (Waktu Berangkat atau Waktu Tiba sudah diisi --
    # dihitung ulang di bawah sebagai `dilaksanakan`, TAPI dicek lebih awal di
    # sini juga karena dua field ini divalidasi sebelum baris itu). Kalau
    # "Tidak Dilaksanakan" boleh tetap kosong -- cocok dengan ~3 baris data
    # historis berstatus itu yang memang tidak punya nilai ini sama sekali.
    dilaksanakan_awal = bool(body.get('waktu_berangkat') or body.get('waktu_tiba'))
    v['waktu_siap'] = as_float('waktu_siap', 0, None, 'Waktu Siap', required=dilaksanakan_awal)
    v['waktu_tempuh_menit'] = as_float('waktu_tempuh_menit', 0, None, 'Waktu Tempuh', required=dilaksanakan_awal)
    v['rentang_waktu'] = as_float('rentang_waktu', 0, None, 'Rentang Waktu')  # kolom legacy (menit)
    v['jarak'] = text('jarak', max_len=64)  # kolom legacy, mis. "66.2 Km"
    v['waktu_tempuh'] = text('waktu_tempuh', max_len=64)  # kolom legacy, mis. "82 Menit"

    # --- Korban ---
    v['pob'] = as_int('pob', 'POB', default=None)
    v['s_org'] = as_int('s_org', 'Jumlah Selamat (S)')
    v['md_org'] = as_int('md_org', 'Jumlah Meninggal Dunia (MD)')
    v['h_org'] = as_int('h_org', 'Jumlah Hilang (H)')
    if v['pob'] is not None and (v['s_org'] + v['md_org'] + v['h_org']) > v['pob']:
        errors.append('Jumlah Selamat + Meninggal Dunia + Hilang tidak boleh melebihi POB.')

    # --- Lokasi ditemukan ---
    v['lokasi_ditemukan'] = text('lokasi_ditemukan')
    v['latitude_ditemukan'] = as_float('latitude_ditemukan', -90, 90, 'Latitude Ditemukan')
    v['longitude_ditemukan'] = as_float('longitude_ditemukan', -180, 180, 'Longitude Ditemukan')
    v['koordinat_ditemukan_teks'] = text('koordinat_ditemukan_teks', max_len=255)  # kolom legacy
    v['tipe_ditemukan'] = text('tipe_ditemukan', max_len=32)  # kolom legacy

    # --- Lain-lain ---
    v['kendala_pelaksanaan_ops_sar'] = text('kendala_pelaksanaan_ops_sar')
    v['instansi_jml_person'] = text('instansi_jml_person')
    v['peralatan'] = text('peralatan')
    v['biaya_rp'] = text('biaya_rp')
    v['lainlain'] = text('lainlain')
    v['aksi'] = text('aksi')  # kolom legacy -- teks sumber untuk derivasi wilayah_mapped

    # --- Validasi silang waktu ---
    if v.get('waktu_selesai') and not v.get('waktu_berangkat'):
        errors.append('Waktu Berangkat wajib diisi jika Waktu Selesai sudah diisi.')
    if v.get('waktu_berangkat') and v.get('waktu_selesai') and v['waktu_selesai'] < v['waktu_berangkat']:
        errors.append('Waktu Selesai tidak boleh lebih awal dari Waktu Berangkat.')
    if wk and v.get('waktu_selesai') and v['waktu_selesai'] < wk:
        errors.append('Waktu Selesai tidak boleh lebih awal dari Waktu Kejadian.')
    if wk and v.get('waktu_lapor') and v['waktu_lapor'] < wk:
        errors.append('Waktu Lapor tidak boleh lebih awal dari Waktu Kejadian.')

    # --- Kolom turunan (dihitung server, tidak dari client) ---
    # Default: tahun/bulan diturunkan dari Waktu Kejadian (kasus form manual,
    # tidak ada konsep "sheet laporan"). TAPI kalau ini baris hasil bulk-import
    # Excel, 'tahun_sheet'/'bulan_sheet_angka' (dari services/excel_import_service.py)
    # dipakai lebih dulu -- ini periode laporan (sheet) asalnya, yang bisa beda
    # dari tanggal kalender Waktu Kejadian untuk kejadian akhir bulan/tahun yang
    # baru diproses di laporan bulan berikutnya (lihat catatan rollover di
    # standarisasi_waktu()). Ini konsisten dengan seluruh data historis di
    # database: kejadian '31 Des 2022' yang dilaporkan di sheet JANUARI 2023
    # tetap tercatat tahun=2023/bulan=JANUARI, bukan 2022/DESEMBER.
    tahun_sheet = body.get('tahun_sheet')
    bulan_sheet_angka = body.get('bulan_sheet_angka')
    if isinstance(tahun_sheet, int) and isinstance(bulan_sheet_angka, int) and 1 <= bulan_sheet_angka <= 12:
        v['tahun'] = tahun_sheet
        v['bulan_angka'] = bulan_sheet_angka
        v['bulan'] = BULAN_NAMA[bulan_sheet_angka - 1]
    elif wk:
        v['tahun'] = wk.year
        v['bulan_angka'] = wk.month
        v['bulan'] = BULAN_NAMA[wk.month - 1]
    else:
        v['tahun'] = None
        v['bulan_angka'] = None
        v['bulan'] = None

    # Status Operasi: "Tidak Dilaksanakan" HANYA kalau Waktu Berangkat *dan*
    # Waktu Tiba dua-duanya kosong -- ini aturan yang sama dipakai untuk
    # seluruh data historis di database (hasil ETL laporan asli), BUKAN
    # berdasarkan Waktu Berangkat + Waktu Selesai seperti versi sebelumnya.
    dilaksanakan = bool(v.get('waktu_berangkat') or v.get('waktu_tiba'))
    v['status_operasi'] = 'Dilaksanakan' if dilaksanakan else 'Tidak Dilaksanakan'

    # Durasi Operasi: kalau bulk-import Excel mengirim nilai yang SUDAH ADA
    # di kolom sumber ('durasi_operasi_hari_sumber' -- lihat
    # services/excel_import_service.py), pakai itu apa adanya (biasanya
    # dihitung/diisi manual di lapangan, lebih dipercaya). Field ini TIDAK
    # tersedia dari form manual, jadi tidak bisa "dipalsukan" dari sana.
    #
    # Fallback (tidak ada nilai sumber): dihitung dari SELISIH TANGGAL
    # KALENDER Waktu Berangkat ke Waktu Selesai + 1 (inklusif), BUKAN
    # selisih jam/86400. Ini dicocokkan langsung terhadap ~485 baris data
    # historis yang sudah ada (database/data_kejadian_sar.sql): rumus
    # "selisih tanggal + 1" cocok utuh untuk sekitar 86% baris, sedangkan
    # selisih jam murni nyaris tidak pernah cocok -- jadi kemungkinan besar
    # begitulah cara nilai ini biasa diisi/dihitung secara operasional
    # (mis. berangkat malam & selesai besok paginya tetap dihitung "2 hari").
    # Sisanya (~14%) kemungkinan koreksi manual yang tidak bisa diturunkan
    # ulang dari field lain -- untuk baris seperti itu, source Excel yang
    # SUDAH mengisi kolom durasi sendiri (jalur 'durasi_operasi_hari_sumber'
    # di atas) akan selalu lebih akurat daripada hasil hitung ulang ini.
    durasi_sumber = body.get('durasi_operasi_hari_sumber')
    if isinstance(durasi_sumber, (int, float)):
        v['durasi_operasi_hari'] = round(float(durasi_sumber), 3)
    elif dilaksanakan and v.get('waktu_berangkat') and v.get('waktu_selesai'):
        selisih_tanggal = (v['waktu_selesai'].date() - v['waktu_berangkat'].date()).days + 1
        v['durasi_operasi_hari'] = float(max(selisih_tanggal, 1))
    else:
        v['durasi_operasi_hari'] = None

    return v, errors


def _next_no_urut(cur):
    """`kejadian_sar.no_urut` adalah PRIMARY KEY tapi TIDAK di-set AUTO_INCREMENT
    di schema.sql asli, jadi id berikutnya harus dihitung manual. SELECT ...
    FOR UPDATE mengunci baris no_urut tertinggi (dan gap setelahnya) sehingga
    dua request bersamaan pada koneksi berbeda tidak akan mendapat id yang
    sama (lock dilepas saat commit/rollback transaksi ini).

    Untuk penggunaan dengan trafik admin lebih dari satu orang bersamaan,
    cara yang lebih aman & standar adalah mengubah kolom ini jadi benar-benar
    AUTO_INCREMENT sekali saja -- lihat database/migration_no_urut_autoincrement.sql.
    Kalau migrasi itu sudah dijalankan, fungsi ini tidak lagi dipakai (ganti
    INSERT supaya no_urut di-generate otomatis oleh MySQL, gunakan cur.lastrowid)."""
    cur.execute("SELECT COALESCE(MAX(no_urut), 0) + 1 AS next_id FROM kejadian_sar FOR UPDATE")
    return cur.fetchone()['next_id']


# ============================================================
# CRUD kejadian_sar (dipakai oleh tab "Input Manual Per Kejadian")
# ============================================================

@admin_bp.route('/operasi', methods=['GET'])
@login_required
def admin_operasi_list():
    """Dulu selalu LIMIT 1000 tanpa filter -- makin banyak data historis makin
    susah cari satu kejadian spesifik lewat tabel "Data Tersimpan". Sekarang
    dukung pencarian bebas teks (?q=...) di kategori/klasifikasi/wilayah/lokasi/ID,
    plus pagination (?page=&limit=) supaya tabelnya tetap ringan dimuat."""
    q = (request.args.get('q') or '').strip()
    try:
        page = max(1, int(request.args.get('page', 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        limit = int(request.args.get('limit', 50))
    except (TypeError, ValueError):
        limit = 50
    limit = max(1, min(limit, 200))
    offset = (page - 1) * limit

    where_sql = ''
    params = []
    if q:
        where_sql = """WHERE (kategori LIKE %s OR kategori_kejadian LIKE %s OR wilayah_mapped LIKE %s
                              OR posisi_koordinat_area LIKE %s OR no_urut = %s)"""
        like = f"%{q}%"
        id_match = int(q) if q.isdigit() else -1
        params = [like, like, like, like, id_match]

    total_row = query_one(f"SELECT COUNT(*) AS total FROM kejadian_sar {where_sql}", params)
    total = total_row['total'] if total_row else 0

    rows = query_all(
        f"""SELECT no_urut AS id_operasi, waktu_kejadian,
                  kategori AS nama_kategori, kategori_kejadian AS nama_klasifikasi,
                  posisi_koordinat_area AS lokasi_kejadian_deskripsi,
                  wilayah_mapped, status_operasi,
                  pob, s_org AS jumlah_selamat, md_org AS jumlah_meninggal, h_org AS jumlah_hilang
           FROM kejadian_sar
           {where_sql}
           ORDER BY waktu_kejadian DESC, no_urut DESC
           LIMIT %s OFFSET %s""",
        params + [limit, offset],
    )
    return ok({'rows': rows, 'total': total, 'page': page, 'limit': limit, 'total_halaman': max(1, (total + limit - 1) // limit)})


@admin_bp.route('/operasi/<int:id_operasi>', methods=['GET'])
@login_required
def admin_operasi_detail(id_operasi):
    row = query_one(
        "SELECT *, no_urut AS id_operasi FROM kejadian_sar WHERE no_urut = %s",
        (id_operasi,),
    )
    if not row:
        return fail('Data operasi tidak ditemukan.', 404)
    return ok(row)


@admin_bp.route('/operasi', methods=['POST'])
@login_required
def admin_operasi_create():
    body = request.get_json(silent=True) or {}
    values, errors = normalize_payload(body)
    if errors:
        return fail(' '.join(errors), 400)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            no_urut = _next_no_urut(cur)
            values['no_urut'] = no_urut
            cols = ['no_urut'] + INSERT_COLUMNS
            placeholders = ', '.join(['%s'] * len(cols))
            cur.execute(
                f"INSERT INTO kejadian_sar ({', '.join(cols)}) VALUES ({placeholders})",
                [values.get(c) for c in cols],
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        return fail(f'Gagal menyimpan data: {e}', 500)
    finally:
        conn.close()

    return ok({'id_operasi': no_urut}, 'Data operasi berhasil disimpan.')


@admin_bp.route('/operasi/<int:id_operasi>', methods=['PUT'])
@login_required
def admin_operasi_update(id_operasi):
    body = request.get_json(silent=True) or {}
    values, errors = normalize_payload(body)
    if errors:
        return fail(' '.join(errors), 400)

    existing = query_one("SELECT no_urut FROM kejadian_sar WHERE no_urut = %s", (id_operasi,))
    if not existing:
        return fail('Data operasi tidak ditemukan.', 404)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            set_clause = ', '.join([f"{c}=%s" for c in INSERT_COLUMNS])
            cur.execute(
                f"UPDATE kejadian_sar SET {set_clause} WHERE no_urut=%s",
                [values.get(c) for c in INSERT_COLUMNS] + [id_operasi],
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        return fail(f'Gagal memperbarui data: {e}', 500)
    finally:
        conn.close()

    return ok({'id_operasi': id_operasi}, 'Data operasi berhasil diperbarui.')


@admin_bp.route('/operasi/<int:id_operasi>', methods=['DELETE'])
@login_required
def admin_operasi_delete(id_operasi):
    existing = query_one("SELECT no_urut FROM kejadian_sar WHERE no_urut = %s", (id_operasi,))
    if not existing:
        return fail('Data operasi tidak ditemukan.', 404)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM kejadian_sar WHERE no_urut = %s", (id_operasi,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        return fail(f'Gagal menghapus data: {e}', 500)
    finally:
        conn.close()
    return ok(None, 'Data operasi berhasil dihapus.')


# ============================================================
# Bulk import (dipakai oleh tab "Upload File Excel")
# ============================================================
# Alur: (1) admin unggah file Excel mentah (format laporan bulanan/tahunan
# asli, BUKAN template sederhana) ke /operasi/bulk/preview -- di-parse
# SEPENUHNYA DI SERVER oleh services/excel_import_service.py (porting dari
# script ETL yang sudah ditulis & diuji sendiri oleh pengguna), lalu tiap
# baris hasil parse divalidasi dengan normalize_payload() yang SAMA dipakai
# input manual, dan hasilnya (baris + status valid/tidak + pesan error)
# dikembalikan untuk pratinjau di frontend. (2) Admin menekan "Impor ke
# Database" -- frontend mengirim ulang hanya baris yang valid (payload apa
# adanya, belum dinormalisasi) ke /operasi/bulk di bawah ini, yang
# memvalidasi ULANG (jangan percaya begitu saja hasil preview kalau ada jeda
# waktu/perubahan) lalu menyimpan dalam satu transaksi per-baris (SAVEPOINT).
#
# Kenapa parsing di server, bukan di browser (SheetJS)? Format sumbernya
# bukan tabel flat dengan header kolom sederhana -- satu sheet per bulan,
# berisi baris kategori, baris kejadian bernomor, dan baris lanjutan teks
# yang harus digabung ke baris sebelumnya, plus konversi koordinat
# DMS/Radial->desimal (perlu geopy) dan standardisasi banyak variasi format
# teks waktu. Logika sekompleks ini terlalu berisiko diduplikasi ulang di
# JavaScript -- jadi dipakai langsung logika Python yang sudah teruji.

MAX_BULK_ROWS = 5000
ALLOWED_EXCEL_EXT = ('.xlsx', '.xlsm')


@admin_bp.route('/operasi/bulk/preview', methods=['POST'])
@login_required
def admin_operasi_bulk_preview():
    file = request.files.get('file')
    if not file or not file.filename:
        return fail('Tidak ada file yang diunggah.', 400)
    if not file.filename.lower().endswith(ALLOWED_EXCEL_EXT):
        return fail('Format file tidak didukung. Unggah file .xlsx (Excel).', 400)

    tahun_raw = request.form.get('tahun')
    tahun_default = None
    if tahun_raw:
        try:
            tahun_default = int(tahun_raw)
        except ValueError:
            return fail('Tahun Laporan tidak valid.', 400)

    try:
        parsed = parse_workbook(file.stream, tahun_default=tahun_default)
    except Exception as e:
        return fail(
            f'Gagal membaca file Excel: {e}. Pastikan file adalah laporan kejadian SAR format '
            'asli (satu sheet per bulan, bukan template kolom sederhana).',
            400,
        )

    if not parsed:
        return fail(
            'Tidak ada baris kejadian yang terbaca dari file ini. Pastikan nama sheet mengandung '
            'nama bulan (mis. "JANUARI 2023") dan strukturnya sesuai format laporan asli.',
            400,
        )
    if len(parsed) > MAX_BULK_ROWS:
        return fail(f'File berisi {len(parsed)} baris kejadian, melebihi batas {MAX_BULK_ROWS} per proses impor.', 400)

    rows_out = []
    valid_count = 0
    for idx, item in enumerate(parsed):
        payload = item['payload']
        meta = item['meta']
        # Dry-run validasi (hasilnya TIDAK disimpan) -- cuma untuk pratinjau.
        _values, errors = normalize_payload(payload)
        if not errors:
            valid_count += 1
        rows_out.append({
            'row': idx + 1,
            'sheet': meta.get('sheet'),
            'source_row': meta.get('source_row'),
            'payload': payload,
            'errors': errors,
        })

    return ok({
        'total': len(rows_out),
        'valid': valid_count,
        'invalid': len(rows_out) - valid_count,
        'rows': rows_out,
    }, f'{len(rows_out)} baris kejadian terbaca dari file ({valid_count} valid).')


@admin_bp.route('/operasi/bulk', methods=['POST'])
@login_required
def admin_operasi_bulk_create():
    body = request.get_json(silent=True) or {}
    rows = body.get('rows')
    if not isinstance(rows, list) or not rows:
        return fail('Tidak ada baris data untuk diimpor.', 400)
    if len(rows) > MAX_BULK_ROWS:
        return fail(f'Maksimum {MAX_BULK_ROWS} baris per proses impor. Pecah file menjadi beberapa batch.', 400)

    inserted = []
    failed = []
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            for idx, raw in enumerate(rows):
                values, errors = normalize_payload(raw if isinstance(raw, dict) else {})
                if errors:
                    failed.append({'row': idx + 1, 'errors': errors})
                    continue
                cur.execute("SAVEPOINT sp_bulk")
                try:
                    no_urut = _next_no_urut(cur)
                    values['no_urut'] = no_urut
                    cols = ['no_urut'] + INSERT_COLUMNS
                    placeholders = ', '.join(['%s'] * len(cols))
                    cur.execute(
                        f"INSERT INTO kejadian_sar ({', '.join(cols)}) VALUES ({placeholders})",
                        [values.get(c) for c in cols],
                    )
                    cur.execute("RELEASE SAVEPOINT sp_bulk")
                    inserted.append({'row': idx + 1, 'id_operasi': no_urut})
                except Exception as row_err:
                    cur.execute("ROLLBACK TO SAVEPOINT sp_bulk")
                    failed.append({'row': idx + 1, 'errors': [str(row_err)]})
        conn.commit()
    except Exception as e:
        conn.rollback()
        return fail(f'Gagal memproses impor: {e}', 500)
    finally:
        conn.close()

    return ok({
        'total': len(rows),
        'berhasil': len(inserted),
        'gagal': len(failed),
        'detail_berhasil': inserted[:200],
        'detail_gagal': failed[:200],
    }, f'Impor selesai: {len(inserted)} berhasil, {len(failed)} gagal dari {len(rows)} baris.')
