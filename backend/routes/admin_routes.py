from flask import Blueprint, request, jsonify, session
from auth import verify_admin_login, login_required
from db import get_connection, query_all, query_one

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def ok(data, message='OK'):
    return jsonify({'success': True, 'data': data, 'message': message})


def fail(message, status=400):
    return jsonify({'success': False, 'data': None, 'message': message}), status


@admin_bp.route('/login', methods=['POST'])
def login():
    body = request.get_json(silent=True) or {}
    username = (body.get('username') or '').strip()
    password = body.get('password') or ''
    if not username or not password:
        return fail('Username dan password wajib diisi.', 400)
    admin = verify_admin_login(username, password)
    if not admin:
        return fail('Username atau password salah.', 401)
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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _upsert_lokasi(cur, id_lokasi, payload):
    """payload: {deskripsi, koordinat_teks, latitude, longitude} or None.
    Returns id_lokasi (creates/updates/deletes as needed)."""
    if not payload or (payload.get('latitude') is None and payload.get('longitude') is None
                        and not payload.get('deskripsi')):
        return None
    deskripsi = payload.get('deskripsi')
    koordinat_teks = payload.get('koordinat_teks')
    latitude = payload.get('latitude')
    longitude = payload.get('longitude')
    if id_lokasi:
        cur.execute(
            "UPDATE lokasi SET deskripsi=%s, koordinat_teks=%s, latitude=%s, longitude=%s WHERE id_lokasi=%s",
            (deskripsi, koordinat_teks, latitude, longitude, id_lokasi),
        )
        return id_lokasi
    cur.execute(
        "INSERT INTO lokasi (deskripsi, koordinat_teks, latitude, longitude) VALUES (%s,%s,%s,%s)",
        (deskripsi, koordinat_teks, latitude, longitude),
    )
    return cur.lastrowid


def _validate_operasi_body(body):
    errors = []
    required = ['waktu_kejadian', 'id_kategori']
    for f in required:
        if body.get(f) in (None, ''):
            errors.append(f'Field "{f}" wajib diisi.')

    def as_int(v):
        try:
            return int(v)
        except (TypeError, ValueError):
            return None

    pob = as_int(body.get('pob'))
    selamat = as_int(body.get('jumlah_selamat')) or 0
    meninggal = as_int(body.get('jumlah_meninggal')) or 0
    hilang = as_int(body.get('jumlah_hilang')) or 0
    if pob is not None and (selamat + meninggal + hilang) > pob:
        errors.append('Jumlah Selamat + Meninggal Dunia + Hilang tidak boleh melebihi POB.')

    waktu_berangkat = body.get('waktu_berangkat')
    waktu_selesai = body.get('waktu_selesai')
    if waktu_selesai and not waktu_berangkat:
        errors.append('Waktu Berangkat wajib diisi jika Waktu Selesai sudah diisi.')
    if waktu_berangkat and waktu_selesai and waktu_selesai < waktu_berangkat:
        errors.append('Waktu Selesai tidak boleh lebih awal dari Waktu Berangkat.')
    return errors


OPERASI_COLUMNS = [
    'waktu_kejadian', 'id_kategori', 'id_klasifikasi', 'nama_objek_terdampak', 'narasi_kejadian',
    'id_lokasi_kejadian', 'radial_derajat', 'id_pos', 'id_sumber',
    'nama_pelapor', 'instansi_pelapor', 'no_hp_pelapor',
    'waktu_lapor', 'waktu_berangkat', 'waktu_tiba', 'waktu_selesai',
    'waktu_siap_menit', 'waktu_tempuh_menit', 'jarak_laut_nm', 'jarak_darat_km',
    'pob', 'jumlah_selamat', 'jumlah_meninggal', 'jumlah_hilang',
    'kendala_pelaksanaan', 'id_lokasi_ditemukan', 'jarak_dari_lkk_km',
    'lain_lain', 'biaya_rp', 'id_admin_input',
]


@admin_bp.route('/operasi', methods=['GET'])
@login_required
def admin_operasi_list():
    rows = query_all(
        """SELECT o.id_operasi, o.waktu_kejadian, o.tahun, o.bulan,
                  o.id_kategori, kat.nama_kategori,
                  o.id_klasifikasi, kl.nama_klasifikasi,
                  o.nama_objek_terdampak,
                  lk.deskripsi AS lokasi_kejadian_deskripsi,
                  o.status_operasi,
                  o.id_pos, p.nama_pos,
                  o.pob, o.jumlah_selamat, o.jumlah_meninggal, o.jumlah_hilang,
                  o.updated_at
           FROM operasi_sar o
           LEFT JOIN ref_kategori kat ON kat.id_kategori = o.id_kategori
           LEFT JOIN ref_klasifikasi kl ON kl.id_klasifikasi = o.id_klasifikasi
           LEFT JOIN ref_pos_unit p ON p.id_pos = o.id_pos
           LEFT JOIN lokasi lk ON lk.id_lokasi = o.id_lokasi_kejadian
           ORDER BY o.waktu_kejadian DESC"""
    )
    return ok(rows)


@admin_bp.route('/operasi/<int:id_operasi>', methods=['GET'])
@login_required
def admin_operasi_detail(id_operasi):
    operasi = query_one(
        """SELECT o.*, kat.nama_kategori, kl.nama_klasifikasi,
                  p.nama_pos, s.nama_sumber,
                  lk.deskripsi AS lokasi_kejadian_deskripsi, lk.koordinat_teks AS lokasi_kejadian_koordinat_teks,
                  lk.latitude AS lokasi_kejadian_lat, lk.longitude AS lokasi_kejadian_lon,
                  ld.deskripsi AS lokasi_ditemukan_deskripsi, ld.koordinat_teks AS lokasi_ditemukan_koordinat_teks,
                  ld.latitude AS lokasi_ditemukan_lat, ld.longitude AS lokasi_ditemukan_lon
           FROM operasi_sar o
           LEFT JOIN ref_kategori kat ON kat.id_kategori = o.id_kategori
           LEFT JOIN ref_klasifikasi kl ON kl.id_klasifikasi = o.id_klasifikasi
           LEFT JOIN ref_pos_unit p ON p.id_pos = o.id_pos
           LEFT JOIN ref_sumber_berita s ON s.id_sumber = o.id_sumber
           LEFT JOIN lokasi lk ON lk.id_lokasi = o.id_lokasi_kejadian
           LEFT JOIN lokasi ld ON ld.id_lokasi = o.id_lokasi_ditemukan
           WHERE o.id_operasi = %s""",
        (id_operasi,),
    )
    if not operasi:
        return fail('Data operasi tidak ditemukan.', 404)

    korban = query_all(
        """SELECT id_korban, nama, jenis_kelamin, usia, pekerjaan,
                  alamat_desa, alamat_kecamatan, alamat_kabupaten, status
           FROM korban WHERE id_operasi = %s ORDER BY id_korban""",
        (id_operasi,),
    )
    instansi = query_all(
        """SELECT oi.id_instansi, i.nama_instansi, oi.jumlah_personel
           FROM operasi_instansi oi
           JOIN ref_instansi i ON i.id_instansi = oi.id_instansi
           WHERE oi.id_operasi = %s""",
        (id_operasi,),
    )
    peralatan = query_all(
        """SELECT op.id_peralatan, pr.nama_peralatan, op.jumlah
           FROM operasi_peralatan op
           JOIN ref_peralatan pr ON pr.id_peralatan = op.id_peralatan
           WHERE op.id_operasi = %s""",
        (id_operasi,),
    )
    operasi['korban'] = korban
    operasi['instansi'] = instansi
    operasi['peralatan'] = peralatan
    return ok(operasi)


@admin_bp.route('/operasi', methods=['POST'])
@login_required
def admin_operasi_create():
    body = request.get_json(silent=True) or {}
    errors = _validate_operasi_body(body)
    if errors:
        return fail(' '.join(errors), 400)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            id_lokasi_kejadian = _upsert_lokasi(cur, None, body.get('lokasi_kejadian'))
            id_lokasi_ditemukan = _upsert_lokasi(cur, None, body.get('lokasi_ditemukan'))

            values = dict(body)
            values['id_lokasi_kejadian'] = id_lokasi_kejadian
            values['id_lokasi_ditemukan'] = id_lokasi_ditemukan
            values['id_admin_input'] = session['id_admin']

            cols = OPERASI_COLUMNS
            placeholders = ', '.join(['%s'] * len(cols))
            cur.execute(
                f"INSERT INTO operasi_sar ({', '.join(cols)}) VALUES ({placeholders})",
                [values.get(c) for c in cols],
            )
            id_operasi = cur.lastrowid

            for item in (body.get('instansi') or []):
                if item.get('id_instansi'):
                    cur.execute(
                        "INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (%s,%s,%s)",
                        (id_operasi, item['id_instansi'], item.get('jumlah_personel') or 0),
                    )
            for item in (body.get('peralatan') or []):
                if item.get('id_peralatan'):
                    cur.execute(
                        "INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (%s,%s,%s)",
                        (id_operasi, item['id_peralatan'], item.get('jumlah') or 1),
                    )
            for k in (body.get('korban') or []):
                if k.get('nama') and k.get('status'):
                    cur.execute(
                        """INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan,
                                                alamat_desa, alamat_kecamatan, alamat_kabupaten, status)
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                        (id_operasi, k.get('nama'), k.get('jenis_kelamin'), k.get('usia'), k.get('pekerjaan'),
                         k.get('alamat_desa'), k.get('alamat_kecamatan'), k.get('alamat_kabupaten'), k.get('status')),
                    )
        conn.commit()
    except Exception as e:
        conn.rollback()
        return fail(f'Gagal menyimpan data: {e}', 500)
    finally:
        conn.close()

    return ok({'id_operasi': id_operasi}, 'Data operasi berhasil disimpan.')


@admin_bp.route('/operasi/<int:id_operasi>', methods=['PUT'])
@login_required
def admin_operasi_update(id_operasi):
    body = request.get_json(silent=True) or {}
    errors = _validate_operasi_body(body)
    if errors:
        return fail(' '.join(errors), 400)

    existing = query_one(
        "SELECT id_lokasi_kejadian, id_lokasi_ditemukan FROM operasi_sar WHERE id_operasi = %s",
        (id_operasi,),
    )
    if not existing:
        return fail('Data operasi tidak ditemukan.', 404)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            id_lokasi_kejadian = _upsert_lokasi(cur, existing['id_lokasi_kejadian'], body.get('lokasi_kejadian'))
            id_lokasi_ditemukan = _upsert_lokasi(cur, existing['id_lokasi_ditemukan'], body.get('lokasi_ditemukan'))

            values = dict(body)
            values['id_lokasi_kejadian'] = id_lokasi_kejadian
            values['id_lokasi_ditemukan'] = id_lokasi_ditemukan

            update_cols = [c for c in OPERASI_COLUMNS if c != 'id_admin_input']
            set_clause = ', '.join([f"{c}=%s" for c in update_cols])
            cur.execute(
                f"UPDATE operasi_sar SET {set_clause} WHERE id_operasi=%s",
                [values.get(c) for c in update_cols] + [id_operasi],
            )

            if 'instansi' in body:
                cur.execute("DELETE FROM operasi_instansi WHERE id_operasi=%s", (id_operasi,))
                for item in (body.get('instansi') or []):
                    if item.get('id_instansi'):
                        cur.execute(
                            "INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (%s,%s,%s)",
                            (id_operasi, item['id_instansi'], item.get('jumlah_personel') or 0),
                        )
            if 'peralatan' in body:
                cur.execute("DELETE FROM operasi_peralatan WHERE id_operasi=%s", (id_operasi,))
                for item in (body.get('peralatan') or []):
                    if item.get('id_peralatan'):
                        cur.execute(
                            "INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (%s,%s,%s)",
                            (id_operasi, item['id_peralatan'], item.get('jumlah') or 1),
                        )
            if 'korban' in body:
                cur.execute("DELETE FROM korban WHERE id_operasi=%s", (id_operasi,))
                for k in (body.get('korban') or []):
                    if k.get('nama') and k.get('status'):
                        cur.execute(
                            """INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan,
                                                    alamat_desa, alamat_kecamatan, alamat_kabupaten, status)
                               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                            (id_operasi, k.get('nama'), k.get('jenis_kelamin'), k.get('usia'), k.get('pekerjaan'),
                             k.get('alamat_desa'), k.get('alamat_kecamatan'), k.get('alamat_kabupaten'), k.get('status')),
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
    existing = query_one("SELECT id_operasi FROM operasi_sar WHERE id_operasi = %s", (id_operasi,))
    if not existing:
        return fail('Data operasi tidak ditemukan.', 404)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM operasi_sar WHERE id_operasi = %s", (id_operasi,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        return fail(f'Gagal menghapus data: {e}', 500)
    finally:
        conn.close()
    return ok(None, 'Data operasi berhasil dihapus.')
