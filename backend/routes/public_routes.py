from flask import Blueprint, request, jsonify
from db import query_all, query_one

public_bp = Blueprint('public', __name__, url_prefix='/api')

# Recompute korban counts from the `korban` table when it has rows for an operasi,
# falling back to the manual jumlah_selamat/meninggal/hilang columns otherwise
# (per spec: keeps counts consistent once per-person data has been entered).
KORBAN_JOIN = """
    LEFT JOIN (
        SELECT id_operasi,
            SUM(status='Selamat') AS k_selamat,
            SUM(status='Meninggal Dunia') AS k_meninggal,
            SUM(status='Hilang') AS k_hilang,
            COUNT(*) AS k_total
        FROM korban GROUP BY id_operasi
    ) ka ON ka.id_operasi = o.id_operasi
"""
SELAMAT_EXPR = "CASE WHEN ka.k_total > 0 THEN ka.k_selamat ELSE o.jumlah_selamat END"
MENINGGAL_EXPR = "CASE WHEN ka.k_total > 0 THEN ka.k_meninggal ELSE o.jumlah_meninggal END"
HILANG_EXPR = "CASE WHEN ka.k_total > 0 THEN ka.k_hilang ELSE o.jumlah_hilang END"

REF_TABLES = {
    'kategori': ('ref_kategori', 'id_kategori', 'nama_kategori'),
    'klasifikasi': ('ref_klasifikasi', 'id_klasifikasi', 'nama_klasifikasi'),
    'sumber_berita': ('ref_sumber_berita', 'id_sumber', 'nama_sumber'),
    'instansi': ('ref_instansi', 'id_instansi', 'nama_instansi'),
    'peralatan': ('ref_peralatan', 'id_peralatan', 'nama_peralatan'),
    'pos_unit': ('ref_pos_unit', 'id_pos', 'nama_pos'),
}


def parse_multi(param_name):
    vals = request.args.getlist(param_name)
    out = []
    for v in vals:
        out.extend([x.strip() for x in v.split(',') if x.strip() != ''])
    return out


def build_filters(alias='o'):
    tahun = parse_multi('tahun')
    bulan = parse_multi('bulan')
    kategori = parse_multi('kategori')
    pos = parse_multi('pos')
    conditions = []
    params = []
    if tahun:
        conditions.append(f"{alias}.tahun IN ({','.join(['%s'] * len(tahun))})")
        params.extend(tahun)
    if bulan:
        conditions.append(f"{alias}.bulan IN ({','.join(['%s'] * len(bulan))})")
        params.extend(bulan)
    if kategori:
        conditions.append(f"{alias}.id_kategori IN ({','.join(['%s'] * len(kategori))})")
        params.extend(kategori)
    if pos:
        conditions.append(f"{alias}.id_pos IN ({','.join(['%s'] * len(pos))})")
        params.extend(pos)
    where_sql = (' AND ' + ' AND '.join(conditions)) if conditions else ''
    return where_sql, params


def ok(data, message='OK'):
    return jsonify({'success': True, 'data': data, 'message': message})


def fail(message, status=400):
    return jsonify({'success': False, 'data': None, 'message': message}), status


@public_bp.route('/kpi')
def kpi():
    where_sql, params = build_filters()
    row = query_one(
        f"""SELECT COUNT(*) AS total_kejadian,
                   SUM(COALESCE({SELAMAT_EXPR},0)) AS total_selamat,
                   SUM(COALESCE({MENINGGAL_EXPR},0)) AS total_meninggal,
                   SUM(COALESCE({HILANG_EXPR},0)) AS total_hilang
            FROM operasi_sar o
            {KORBAN_JOIN}
            WHERE 1=1 {where_sql}""",
        params,
    )
    selamat = row['total_selamat'] or 0
    meninggal = row['total_meninggal'] or 0
    hilang = row['total_hilang'] or 0
    data = {
        'total_kejadian': row['total_kejadian'] or 0,
        'korban_ditangani': selamat + meninggal + hilang,
        'selamat': selamat,
        'meninggal': meninggal,
        'hilang': hilang,
    }
    return ok(data)


@public_bp.route('/operasi')
def operasi_list():
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT o.id_operasi, o.waktu_kejadian, o.tahun, o.bulan,
                   o.id_kategori, kat.nama_kategori,
                   o.id_klasifikasi, kl.nama_klasifikasi,
                   o.nama_objek_terdampak, o.narasi_kejadian,
                   lk.deskripsi AS lokasi_kejadian_deskripsi,
                   lk.latitude AS lokasi_kejadian_lat, lk.longitude AS lokasi_kejadian_lon,
                   ld.deskripsi AS lokasi_ditemukan_deskripsi,
                   ld.latitude AS lokasi_ditemukan_lat, ld.longitude AS lokasi_ditemukan_lon,
                   o.status_operasi,
                   o.id_pos, p.nama_pos,
                   o.waktu_lapor, o.waktu_berangkat, o.waktu_tiba, o.waktu_selesai,
                   o.waktu_siap_menit, o.waktu_tempuh_menit,
                   o.jarak_laut_nm, o.jarak_darat_km, o.jarak_dari_lkk_km,
                   o.pob,
                   {SELAMAT_EXPR} AS jumlah_selamat,
                   {MENINGGAL_EXPR} AS jumlah_meninggal,
                   {HILANG_EXPR} AS jumlah_hilang,
                   o.durasi_operasi_hari
            FROM operasi_sar o
            {KORBAN_JOIN}
            LEFT JOIN ref_kategori kat ON kat.id_kategori = o.id_kategori
            LEFT JOIN ref_klasifikasi kl ON kl.id_klasifikasi = o.id_klasifikasi
            LEFT JOIN ref_pos_unit p ON p.id_pos = o.id_pos
            LEFT JOIN lokasi lk ON lk.id_lokasi = o.id_lokasi_kejadian
            LEFT JOIN lokasi ld ON ld.id_lokasi = o.id_lokasi_ditemukan
            WHERE 1=1 {where_sql}
            ORDER BY o.waktu_kejadian DESC""",
        params,
    )
    return ok(rows)


@public_bp.route('/komposisi-kejadian')
def komposisi_kejadian():
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT o.id_kategori, kat.nama_kategori, COUNT(*) AS jumlah
            FROM operasi_sar o
            JOIN ref_kategori kat ON kat.id_kategori = o.id_kategori
            WHERE 1=1 {where_sql}
            GROUP BY o.id_kategori, kat.nama_kategori
            ORDER BY jumlah DESC""",
        params,
    )
    return ok(rows)


@public_bp.route('/top-klasifikasi')
def top_klasifikasi():
    where_sql, params = build_filters()
    try:
        limit = int(request.args.get('limit', 5))
    except ValueError:
        limit = 5
    rows = query_all(
        f"""SELECT o.id_klasifikasi, kl.nama_klasifikasi, o.id_kategori, kat.nama_kategori,
                   COUNT(*) AS jumlah
            FROM operasi_sar o
            JOIN ref_klasifikasi kl ON kl.id_klasifikasi = o.id_klasifikasi
            JOIN ref_kategori kat ON kat.id_kategori = o.id_kategori
            WHERE 1=1 {where_sql}
            GROUP BY o.id_klasifikasi, kl.nama_klasifikasi, o.id_kategori, kat.nama_kategori
            ORDER BY jumlah DESC
            LIMIT %s""",
        params + [limit],
    )
    return ok(rows)


@public_bp.route('/status-dilaksanakan')
def status_dilaksanakan():
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT o.status_operasi, COUNT(*) AS jumlah
            FROM operasi_sar o
            WHERE 1=1 {where_sql}
            GROUP BY o.status_operasi""",
        params,
    )
    tidak = 0
    dilaksanakan = 0
    for r in rows:
        if r['status_operasi'] == 'Tidak Dilaksanakan':
            tidak += r['jumlah']
        else:
            dilaksanakan += r['jumlah']
    return ok({'dilaksanakan': dilaksanakan, 'tidak_dilaksanakan': tidak})


@public_bp.route('/status-hasil')
def status_hasil():
    where_sql, params = build_filters()
    row = query_one(
        f"""SELECT SUM(COALESCE({SELAMAT_EXPR},0)) AS selamat,
                   SUM(COALESCE({MENINGGAL_EXPR},0)) AS meninggal,
                   SUM(COALESCE({HILANG_EXPR},0)) AS hilang
            FROM operasi_sar o
            {KORBAN_JOIN}
            WHERE 1=1 {where_sql}""",
        params,
    )
    return ok({
        'selamat': row['selamat'] or 0,
        'meninggal': row['meninggal'] or 0,
        'hilang': row['hilang'] or 0,
    })


@public_bp.route('/tren-bulanan')
def tren_bulanan():
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT o.bulan, o.id_kategori, kat.nama_kategori, COUNT(*) AS jumlah
            FROM operasi_sar o
            JOIN ref_kategori kat ON kat.id_kategori = o.id_kategori
            WHERE 1=1 {where_sql}
            GROUP BY o.bulan, o.id_kategori, kat.nama_kategori
            ORDER BY o.bulan""",
        params,
    )
    return ok(rows)


@public_bp.route('/beban-pos')
def beban_pos():
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT o.id_pos, p.nama_pos, COUNT(*) AS jumlah
            FROM operasi_sar o
            JOIN ref_pos_unit p ON p.id_pos = o.id_pos
            WHERE 1=1 {where_sql}
            GROUP BY o.id_pos, p.nama_pos
            ORDER BY jumlah DESC""",
        params,
    )
    return ok(rows)


@public_bp.route('/instansi-terlibat')
def instansi_terlibat():
    where_sql, params = build_filters()
    try:
        limit = int(request.args.get('limit', 10))
    except ValueError:
        limit = 10
    rows = query_all(
        f"""SELECT oi.id_instansi, i.nama_instansi,
                   COUNT(DISTINCT oi.id_operasi) AS jumlah_operasi,
                   SUM(oi.jumlah_personel) AS total_personel
            FROM operasi_instansi oi
            JOIN operasi_sar o ON o.id_operasi = oi.id_operasi
            JOIN ref_instansi i ON i.id_instansi = oi.id_instansi
            WHERE 1=1 {where_sql}
            GROUP BY oi.id_instansi, i.nama_instansi
            ORDER BY jumlah_operasi DESC
            LIMIT %s""",
        params + [limit],
    )
    return ok(rows)


@public_bp.route('/sumber-berita')
def sumber_berita():
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT o.id_sumber, s.nama_sumber, COUNT(*) AS jumlah
            FROM operasi_sar o
            LEFT JOIN ref_sumber_berita s ON s.id_sumber = o.id_sumber
            WHERE 1=1 {where_sql}
            GROUP BY o.id_sumber, s.nama_sumber
            ORDER BY jumlah DESC""",
        params,
    )
    return ok(rows)


@public_bp.route('/waktu-kejadian')
def waktu_kejadian():
    where_sql, params = build_filters()
    row = query_one(
        f"""SELECT
                SUM(CASE WHEN HOUR(o.waktu_kejadian) < 6 THEN 1 ELSE 0 END) AS dini,
                SUM(CASE WHEN HOUR(o.waktu_kejadian) >= 6 AND HOUR(o.waktu_kejadian) < 12 THEN 1 ELSE 0 END) AS pagi,
                SUM(CASE WHEN HOUR(o.waktu_kejadian) >= 12 AND HOUR(o.waktu_kejadian) < 18 THEN 1 ELSE 0 END) AS siang,
                SUM(CASE WHEN HOUR(o.waktu_kejadian) >= 18 THEN 1 ELSE 0 END) AS malam
            FROM operasi_sar o
            WHERE 1=1 {where_sql}""",
        params,
    )
    return ok({
        'pagi': row['pagi'] or 0,
        'siang': row['siang'] or 0,
        'malam': row['malam'] or 0,
        'dini': row['dini'] or 0,
    })


@public_bp.route('/durasi-operasi')
def durasi_operasi():
    where_sql, params = build_filters()
    row = query_one(
        f"""SELECT
                SUM(CASE WHEN o.durasi_operasi_hari < 1 THEN 1 ELSE 0 END) AS b1,
                SUM(CASE WHEN o.durasi_operasi_hari >= 1 AND o.durasi_operasi_hari < 3 THEN 1 ELSE 0 END) AS b2,
                SUM(CASE WHEN o.durasi_operasi_hari >= 3 AND o.durasi_operasi_hari < 7 THEN 1 ELSE 0 END) AS b3,
                SUM(CASE WHEN o.durasi_operasi_hari >= 7 THEN 1 ELSE 0 END) AS b4
            FROM operasi_sar o
            WHERE o.durasi_operasi_hari IS NOT NULL {where_sql}""",
        params,
    )
    return ok({
        '<1 hari': row['b1'] or 0,
        '1-3 hari': row['b2'] or 0,
        '3-7 hari': row['b3'] or 0,
        '>7 hari': row['b4'] or 0,
    })


AGE_BUCKETS = [
    ('<18', 0, 17), ('18-30', 18, 30), ('31-45', 31, 45), ('46-60', 46, 60), ('60+', 61, 999),
]


@public_bp.route('/korban-agregat')
def korban_agregat():
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT k.jenis_kelamin, k.usia, k.status
            FROM korban k
            JOIN operasi_sar o ON o.id_operasi = k.id_operasi
            WHERE 1=1 {where_sql}""",
        params,
    )
    gender = {'L': 0, 'P': 0}
    status_count = {'Selamat': 0, 'Meninggal Dunia': 0, 'Hilang': 0}
    age_buckets = {label: 0 for label, _, _ in AGE_BUCKETS}
    for r in rows:
        if r['jenis_kelamin'] in gender:
            gender[r['jenis_kelamin']] += 1
        if r['status'] in status_count:
            status_count[r['status']] += 1
        if r['usia'] is not None:
            for label, lo, hi in AGE_BUCKETS:
                if lo <= r['usia'] <= hi:
                    age_buckets[label] += 1
                    break
    return ok({
        'total_korban': len(rows),
        'jenis_kelamin': gender,
        'status': status_count,
        'rentang_usia': age_buckets,
    })


@public_bp.route('/ref/<nama_tabel>')
def ref_table(nama_tabel):
    if nama_tabel not in REF_TABLES:
        return fail('Tabel referensi tidak dikenal.', 404)
    table, id_col, name_col = REF_TABLES[nama_tabel]
    extra = ', status' if table == 'ref_pos_unit' else ''
    rows = query_all(f"SELECT {id_col}, {name_col}{extra} FROM {table} ORDER BY {id_col}")
    return ok(rows)
