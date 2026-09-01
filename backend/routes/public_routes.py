from flask import Blueprint, request, jsonify
from db import query_all, query_one
from db import query_all
from services.prediksi_service import hitung_composite_index

public_bp = Blueprint('public', __name__, url_prefix='/api')

# ============================================================
# CATATAN MIGRASI SKEMA
# ============================================================
# File ini sebelumnya ditulis untuk skema fully-normalized (operasi_sar,
# korban, ref_kategori, ref_klasifikasi, ref_pos_unit, lokasi, dst).
# Skema itu TIDAK dipakai -- database aktual memakai satu tabel flat
# `kejadian_sar` (lihat keputusan hybrid di awal proyek). Semua query
# di bawah sudah disesuaikan ke struktur kejadian_sar:
#
#   - kategori            : TEXT langsung (dulu id_kategori -> ref_kategori)
#   - kategori_kejadian    : TEXT, isinya KLASIFIKASI detail (dulu nama_klasifikasi)
#   - klasifikasi          : TEXT, kolom lama yang tidak lagi dipakai untuk filter
#   - wilayah_mapped       : TEXT, bisa berisi multi-wilayah dipisah koma
#                            (mis. "Surabaya, Sumenep") -- dipakai menggantikan
#                            konsep id_pos/nama_pos yang tidak ada di kejadian_sar
#   - s_org/md_org/h_org   : INT agregat (dulu dihitung dari tabel korban per-individu)
#   - latitude_lkk/longitude_lkk       : dulu lokasi.latitude/longitude (lokasi kejadian)
#   - latitude_ditemukan/longitude_ditemukan : dulu lokasi.latitude/longitude (lokasi ditemukan)
#   - waktu_kejadian, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai,
#     waktu_tempuh_menit, pob, status_operasi, durasi_operasi_hari : sudah sama namanya
#
# Endpoint yang DI-DROP karena butuh data relasional yang tidak ada di kejadian_sar:
#   - /api/instansi-terlibat (butuh tabel operasi_instansi + ref_instansi)
#   - /api/korban-agregat versi per-individu (butuh tabel korban: nama/usia/gender)
#     -> diganti versi agregat sederhana dari kolom s_org/md_org/h_org
#   - /api/ref/<tabel> untuk instansi & peralatan (tidak ada tabel referensinya lagi;
#     kategori/klasifikasi/sumber_berita diganti endpoint /api/ref-nilai yang
#     mengambil nilai DISTINCT langsung dari kejadian_sar)
#   - /api/beban-pos -> diganti /api/beban-wilayah (pakai wilayah_mapped, bisa
#     berisi multi-wilayah dipisah koma sehingga dihitung di Python, bukan SQL murni)


def parse_multi(param_name):
    vals = request.args.getlist(param_name)
    out = []
    for v in vals:
        out.extend([x.strip() for x in v.split(',') if x.strip() != ''])
    return out


def build_filters():
    """Bangun klausa WHERE dari query string ?tahun=&bulan=&kategori=&wilayah=."""
    tahun = parse_multi('tahun')
    bulan = parse_multi('bulan')
    kategori = parse_multi('kategori')
    wilayah = parse_multi('wilayah')
    conditions = []
    params = []

    if tahun:
        conditions.append(f"tahun IN ({','.join(['%s'] * len(tahun))})")
        params.extend(tahun)
    if bulan:
        conditions.append(f"bulan_angka IN ({','.join(['%s'] * len(bulan))})")
        params.extend(bulan)
    if kategori:
        conditions.append(f"kategori IN ({','.join(['%s'] * len(kategori))})")
        params.extend(kategori)
    if wilayah:
        # wilayah_mapped bisa berisi multi-nilai dipisah koma (mis. "Surabaya, Sumenep"),
        # jadi dicocokkan per-nilai pakai LIKE, bukan '=' murni.
        wilayah_conds = []
        for w in wilayah:
            wilayah_conds.append("wilayah_mapped LIKE %s")
            params.append(f"%{w}%")
        conditions.append('(' + ' OR '.join(wilayah_conds) + ')')

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
                   SUM(COALESCE(s_org,0)) AS total_selamat,
                   SUM(COALESCE(md_org,0)) AS total_meninggal,
                   SUM(COALESCE(h_org,0)) AS total_hilang
            FROM kejadian_sar
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
    # PENTING (PII): kolom `jenis_kecelakaan` dan `lokasi_ditemukan` dari data historis
    # SERING berisi nama lengkap, usia, dan alamat sekelurahan korban/penyintas yang
    # diketik bebas oleh petugas lapangan (mis. "Nama Muhammad Adi Kurniawan Usia 31 Thn
    # Alamat Jl...") -- BUKAN narasi bersih. Dua kolom itu SENGAJA TIDAK disertakan di
    # endpoint publik ini (dan memang tidak dipakai di frontend manapun -- cek
    # static/js/dashboard.js, tidak ada referensi ke narasi_kejadian /
    # lokasi_ditemukan_deskripsi). Detail lengkap termasuk dua kolom ini tetap tersedia
    # lewat endpoint admin (GET /api/admin/operasi/:id) yang wajib login.
    # `posisi_koordinat_area` aman disertakan -- sudah dicek tidak mengandung pola
    # "Nama" di seluruh data historis (isinya deskripsi lokasi/radial/jarak saja).
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT no_urut AS id_operasi, waktu_kejadian, tahun, bulan_angka AS bulan,
                   kategori AS nama_kategori,
                   kategori_kejadian AS nama_klasifikasi,
                   posisi_koordinat_area AS lokasi_kejadian_deskripsi,
                   latitude_lkk AS lokasi_kejadian_lat, longitude_lkk AS lokasi_kejadian_lon,
                   latitude_ditemukan AS lokasi_ditemukan_lat, longitude_ditemukan AS lokasi_ditemukan_lon,
                   status_operasi,
                   wilayah_mapped,
                   waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai,
                   waktu_siap, waktu_tempuh_menit,
                   pob,
                   s_org AS jumlah_selamat,
                   md_org AS jumlah_meninggal,
                   h_org AS jumlah_hilang,
                   durasi_operasi_hari
            FROM kejadian_sar
            WHERE 1=1 {where_sql}
            ORDER BY waktu_kejadian DESC""",
        params,
    )
    return ok(rows)


@public_bp.route('/komposisi-kejadian')
def komposisi_kejadian():
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT kategori AS nama_kategori, COUNT(*) AS jumlah
            FROM kejadian_sar
            WHERE kategori IS NOT NULL {where_sql}
            GROUP BY kategori
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
        f"""SELECT kategori_kejadian AS nama_klasifikasi, kategori AS nama_kategori,
                   COUNT(*) AS jumlah
            FROM kejadian_sar
            WHERE kategori_kejadian IS NOT NULL {where_sql}
            GROUP BY kategori_kejadian, kategori
            ORDER BY jumlah DESC
            LIMIT %s""",
        params + [limit],
    )
    return ok(rows)


@public_bp.route('/status-dilaksanakan')
def status_dilaksanakan():
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT status_operasi, COUNT(*) AS jumlah
            FROM kejadian_sar
            WHERE 1=1 {where_sql}
            GROUP BY status_operasi""",
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
        f"""SELECT SUM(COALESCE(s_org,0)) AS selamat,
                   SUM(COALESCE(md_org,0)) AS meninggal,
                   SUM(COALESCE(h_org,0)) AS hilang
            FROM kejadian_sar
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
        f"""SELECT bulan_angka AS bulan, kategori AS nama_kategori, COUNT(*) AS jumlah
            FROM kejadian_sar
            WHERE kategori IS NOT NULL AND bulan_angka IS NOT NULL {where_sql}
            GROUP BY bulan_angka, kategori
            ORDER BY bulan_angka""",
        params,
    )
    return ok(rows)

@public_bp.route('/prediksi-zona-rawan')
def prediksi_zona_rawan():
    rows = query_all("""
        SELECT latitude_lkk, longitude_lkk, waktu_kejadian
        FROM kejadian_sar
        WHERE latitude_lkk IS NOT NULL
          AND longitude_lkk IS NOT NULL
          AND waktu_kejadian IS NOT NULL
    """)
    hasil = hitung_composite_index(rows)
    return jsonify({'success': True, 'data': hasil, 'message': 'Prediksi zona rawan berhasil dihitung.'})


@public_bp.route('/beban-wilayah')
def beban_wilayah():
    """Pengganti /api/beban-pos lama. wilayah_mapped bisa berisi multi-wilayah
    dipisah koma, jadi dipecah dulu di Python sebelum dihitung -- SQL biasa
    tidak bisa mengelompokkan nilai gabungan seperti itu dengan bersih."""
    where_sql, params = build_filters()
    rows = query_all(
        f"""SELECT wilayah_mapped
            FROM kejadian_sar
            WHERE wilayah_mapped IS NOT NULL AND wilayah_mapped != '' {where_sql}""",
        params,
    )
    counter = {}
    for r in rows:
        for w in (r['wilayah_mapped'] or '').split(','):
            w = w.strip()
            if w:
                counter[w] = counter.get(w, 0) + 1
    hasil = [{'nama_wilayah': k, 'jumlah': v} for k, v in counter.items()]
    hasil.sort(key=lambda x: x['jumlah'], reverse=True)
    return ok(hasil)


# PENTING (PII): endpoint /sumber-berita DIPINDAH ke admin_routes.py (wajib login).
# Kolom `sumber_berita` di data historis berisi nama & nomor HP pribadi pelapor yang
# diketik bebas oleh petugas (mis. "Bpk Anang BPBD Pasuruan (0898xxxxxxx)") -- BUKAN
# kategori bersih seperti "Masyarakat"/"Instansi". Endpoint ini sebelumnya publik &
# tanpa login, padahal tidak pernah dipakai frontend manapun -- lihat catatan yang
# sama di endpoint /operasi di atas.

@public_bp.route('/waktu-kejadian')
def waktu_kejadian():
    where_sql, params = build_filters()
    row = query_one(
        f"""SELECT
                SUM(CASE WHEN HOUR(waktu_kejadian) < 6 THEN 1 ELSE 0 END) AS dini,
                SUM(CASE WHEN HOUR(waktu_kejadian) >= 6 AND HOUR(waktu_kejadian) < 12 THEN 1 ELSE 0 END) AS pagi,
                SUM(CASE WHEN HOUR(waktu_kejadian) >= 12 AND HOUR(waktu_kejadian) < 18 THEN 1 ELSE 0 END) AS siang,
                SUM(CASE WHEN HOUR(waktu_kejadian) >= 18 THEN 1 ELSE 0 END) AS malam
            FROM kejadian_sar
            WHERE waktu_kejadian IS NOT NULL {where_sql}""",
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
                SUM(CASE WHEN durasi_operasi_hari < 1 THEN 1 ELSE 0 END) AS b1,
                SUM(CASE WHEN durasi_operasi_hari >= 1 AND durasi_operasi_hari < 3 THEN 1 ELSE 0 END) AS b2,
                SUM(CASE WHEN durasi_operasi_hari >= 3 AND durasi_operasi_hari < 7 THEN 1 ELSE 0 END) AS b3,
                SUM(CASE WHEN durasi_operasi_hari >= 7 THEN 1 ELSE 0 END) AS b4
            FROM kejadian_sar
            WHERE durasi_operasi_hari IS NOT NULL {where_sql}""",
        params,
    )
    return ok({
        '<1 hari': row['b1'] or 0,
        '1-3 hari': row['b2'] or 0,
        '3-7 hari': row['b3'] or 0,
        '>7 hari': row['b4'] or 0,
    })


@public_bp.route('/korban-agregat')
def korban_agregat():
    """Versi sederhana pengganti endpoint lama yang butuh tabel korban
    per-individu (nama/usia/gender). kejadian_sar cuma simpan angka
    agregat, jadi cukup jumlahkan tiga kolom itu -- tanpa breakdown
    usia/gender karena datanya memang tidak ada di skema ini."""
    where_sql, params = build_filters()
    row = query_one(
        f"""SELECT SUM(COALESCE(s_org,0)) AS selamat,
                   SUM(COALESCE(md_org,0)) AS meninggal,
                   SUM(COALESCE(h_org,0)) AS hilang
            FROM kejadian_sar
            WHERE 1=1 {where_sql}""",
        params,
    )
    selamat = row['selamat'] or 0
    meninggal = row['meninggal'] or 0
    hilang = row['hilang'] or 0
    return ok({
        'total_korban': selamat + meninggal + hilang,
        'status': {'Selamat': selamat, 'Meninggal Dunia': meninggal, 'Hilang': hilang},
    })


@public_bp.route('/ref-nilai/<nama_kolom>')
def ref_nilai(nama_kolom):
    """Pengganti /api/ref/<tabel> lama. Karena tidak ada lagi tabel
    referensi terpisah, dropdown filter diisi dari nilai DISTINCT
    kolom terkait langsung di kejadian_sar. Whitelist ketat supaya
    tidak bisa dipakai untuk baca kolom sembarang."""
    allowed = {
        'kategori': 'kategori',
        'klasifikasi': 'kategori_kejadian',
        'sumber_berita': 'sumber_berita',
        'wilayah': 'wilayah_mapped',
    }
    if nama_kolom not in allowed:
        return fail('Kolom referensi tidak dikenal.', 404)
    kolom = allowed[nama_kolom]
    rows = query_all(
        f"""SELECT DISTINCT {kolom} AS nilai
            FROM kejadian_sar
            WHERE {kolom} IS NOT NULL AND {kolom} != ''
            ORDER BY {kolom}"""
    )
    return ok(rows)