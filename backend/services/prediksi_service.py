import json
import os
from datetime import date
from dateutil.relativedelta import relativedelta
from functools import lru_cache
from shapely.geometry import shape, Point
import pyproj
from shapely.ops import transform as shapely_transform

GEOJSON_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'static', 'data', 'kabkota-jatim.geojson'
)

# 7 kabupaten Tapal Kuda -- resmi lepas dari koordinasi Kansar Surabaya per 2026
KABUPATEN_DIKECUALIKAN_2026 = [
    'Banyuwangi', 'Bondowoso', 'Jember',
    'Kota Probolinggo', 'Lumajang', 'Probolinggo', 'Situbondo'
]
BOBOT_HOTSPOT = 0.7
BOBOT_MUSIMAN = 0.3

_to_utm = pyproj.Transformer.from_crs('EPSG:4326', 'EPSG:32749', always_xy=True).transform

@lru_cache(maxsize=1)
def _load_kabkota_geoms():
    """Load GeoJSON sekali, simpan versi asli (4326, untuk contains) dan versi UTM (32749, untuk jarak)."""
    with open(GEOJSON_PATH, encoding='utf-8') as f:
        gj = json.load(f)
    geoms = []
    for feat in gj['features']:
        nama = feat['properties'].get('NAME_2')
        if not nama:
            continue
        geom_4326 = shape(feat['geometry'])
        geom_utm = shapely_transform(_to_utm, geom_4326)
        geoms.append((nama, geom_4326, geom_utm))
    return geoms


def point_to_kabupaten(lat, lon):
    """
    Titik di darat -> kabupaten yang memuatnya (contains, aman pakai lat/lon mentah
    karena topologi contains tidak berubah oleh proyeksi).
    Titik di laut -> kabupaten terdekat DALAM METER (UTM 49S), persis sjoin_nearest Colab.
    """
    if lat is None or lon is None:
        return None
    pt_4326 = Point(float(lon), float(lat))
    geoms = _load_kabkota_geoms()

    for nama, geom_4326, _ in geoms:
        if geom_4326.contains(pt_4326):
            return nama

    pt_utm = Point(*_to_utm(float(lon), float(lat)))
    best_nama, best_dist = None, float('inf')
    for nama, _, geom_utm in geoms:
        d = geom_utm.distance(pt_utm)
        if d < best_dist:
            best_dist, best_nama = d, nama
    return best_nama

def _bulan_terakhir_dari_rows(kejadian_rows):
    """Bulan kalender terakhir yang punya data waktu_kejadian di seluruh dataset
    yang di-load (bukan cuma yang lolos filter scope) -- ini yang menentukan
    titik awal proyeksi 3 bulan ke depan, bukan tanggal hari ini."""
    tanggal_valid = [row.get('waktu_kejadian') for row in kejadian_rows if row.get('waktu_kejadian')]
    if not tanggal_valid:
        return date.today().replace(day=1)
    terakhir = max(tanggal_valid)
    return date(terakhir.year, terakhir.month, 1)


def _target_months(bulan_terakhir_data, n=3):
    """n bulan kalender berikutnya SETELAH bulan_terakhir_data -- list of (tahun, bulan)."""
    result = []
    y, m = bulan_terakhir_data.year, bulan_terakhir_data.month
    for _ in range(n):
        m += 1
        if m > 12:
            m = 1
            y += 1
        result.append((y, m))
    return result

def hitung_composite_index(kejadian_rows):
    bulan_terakhir_data = _bulan_terakhir_dari_rows(kejadian_rows)

    geoms = _load_kabkota_geoms()
    semua_kabupaten = [nama for nama, _, _ in geoms]
    kabupaten_scope = [k for k in semua_kabupaten if k not in KABUPATEN_DIKECUALIKAN_2026]

    kejadian_scope = []
    for row in kejadian_rows:
        lat, lon, wk = row.get('latitude_lkk'), row.get('longitude_lkk'), row.get('waktu_kejadian')
        if lat is None or lon is None or wk is None:
            continue
        kab = point_to_kabupaten(lat, lon)
        if kab not in kabupaten_scope:
            continue
        kejadian_scope.append((kab, wk.year, wk.month))

    # --- Komponen 1: hotspot (statis, tidak berubah per bulan) ---
    total_per_kab = {k: 0 for k in kabupaten_scope}
    for kab, _, _ in kejadian_scope:
        total_per_kab[kab] += 1
    max_h = max(total_per_kab.values()) if total_per_kab else 0
    min_h = min(total_per_kab.values()) if total_per_kab else 0
    skor_hotspot = {
        k: ((total_per_kab[k] - min_h) / (max_h - min_h)) if max_h > min_h else 0.0
        for k in kabupaten_scope
    }

    # --- Komponen 2: musiman, dihitung untuk SEMUA 12 bulan kalender
    #     (bukan cuma 3 bulan target) -- supaya threshold quantile di bawah
    #     dihitung dari sebaran skor 12 bulan x 31 kabupaten, PERSIS seperti
    #     Colab Block 5, bukan dari 31 nilai satu bulan saja. ---
    per_kab_tahun_bulan = {}
    for kab, th, bln in kejadian_scope:
        key = (kab, th, bln)
        per_kab_tahun_bulan[key] = per_kab_tahun_bulan.get(key, 0) + 1

    skor_gabungan_semua_bulan = {}  # {bulan_kalender: {kab: skor}}
    for bulan_kalender in range(1, 13):
        rata2 = {}
        for kab in kabupaten_scope:
            nilai_tiap_tahun = [
                v for (k, t, b), v in per_kab_tahun_bulan.items()
                if k == kab and b == bulan_kalender
            ]
            rata2[kab] = sum(nilai_tiap_tahun) / len(nilai_tiap_tahun) if nilai_tiap_tahun else 0.0

        max_m = max(rata2.values()) if rata2 else 0
        min_m = min(rata2.values()) if rata2 else 0
        skor_musiman = {
            k: ((rata2[k] - min_m) / (max_m - min_m)) if max_m > min_m else 0.0
            for k in kabupaten_scope
        }
        skor_gabungan_semua_bulan[bulan_kalender] = {
            k: BOBOT_HOTSPOT * skor_hotspot[k] + BOBOT_MUSIMAN * skor_musiman[k]
            for k in kabupaten_scope
        }

    # Threshold GLOBAL dari seluruh 12 bulan x 31 kabupaten = 372 nilai,
    # persis seperti skor_gabungan['skor_kerawanan'].quantile([0.33, 0.66]) di Colab.
    semua_skor = [
        skor_gabungan_semua_bulan[b][k]
        for b in range(1, 13) for k in kabupaten_scope
    ]
    semua_skor_sorted = sorted(semua_skor)
    n_total = len(semua_skor_sorted)
    q33 = semua_skor_sorted[int(n_total * 0.33)] if n_total else 0
    q66 = semua_skor_sorted[int(n_total * 0.66)] if n_total else 0

    def level(s):
        if s <= q33:
            return 'Rendah'
        elif s <= q66:
            return 'Sedang'
        return 'Tinggi'

    # Terapkan threshold global itu HANYA ke 3 bulan target yang ditampilkan
    hasil_per_bulan_target = {}
    for (target_year, target_month) in _target_months(bulan_terakhir_data, 3):
        skor_bulan_ini = skor_gabungan_semua_bulan[target_month]
        nama_bulan_key = f"{target_year}-{target_month:02d}"
        hasil_per_bulan_target[nama_bulan_key] = {
            kab: {'skor': round(skor_bulan_ini[kab], 3), 'level': level(skor_bulan_ini[kab])}
            for kab in kabupaten_scope
        }

    return {
        'metadata': {
            'metode': 'Composite Index (spasial 70% + musiman 30%)',
            'kabupaten_di_luar_scope': KABUPATEN_DIKECUALIKAN_2026,
            'total_kejadian_dianalisis': len(kejadian_scope),
            'bulan_terakhir_data': bulan_terakhir_data.strftime('%Y-%m'),
            'generated_at': date.today().isoformat(),
        },
        'prediksi': hasil_per_bulan_target,
    }