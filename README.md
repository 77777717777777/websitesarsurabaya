# Dashboard Operasi SAR — Kantor SAR Surabaya

Dashboard full-stack untuk memantau, menganalisis, dan menginput data operasi Search and Rescue (SAR). Backend Flask + MariaDB, frontend HTML/CSS/JS vanilla (Chart.js untuk grafik, SVG untuk peta skematik). Flask men-serving frontend-nya sendiri, jadi seluruh aplikasi jalan dari **satu perintah, satu port**.

## Struktur Proyek

```
sar-dashboard/
├── database/
│   ├── schema.sql          # struktur database (final)
│   ├── seed_dummy.sql      # 38 operasi + 147 korban dummy untuk testing
│   ├── migrate_excel.py    # script migrasi data historis Excel (belum dijalankan)
│   └── README.md
├── backend/
│   ├── app.py               # entry point -- serving API + frontend statis
│   ├── config.py
│   ├── db.py
│   ├── auth.py
│   ├── routes/
│   │   ├── public_routes.py
│   │   └── admin_routes.py
│   ├── static/               # frontend (disajikan langsung oleh Flask)
│   │   ├── index.html
│   │   └── js/
│   │       ├── api.js
│   │       └── dashboard.js
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## 1. Persiapan Database (MariaDB)

Pastikan MariaDB sudah terpasang dan berjalan (mis. via Laragon, XAMPP, atau instalasi mandiri).

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed_dummy.sql
```

Detail lebih lanjut ada di `database/README.md`.

## 2. Menjalankan Aplikasi (satu perintah)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
copy .env.example .env         # Windows: copy, macOS/Linux: cp
# edit .env sesuai kredensial MariaDB lokal (DB_USER, DB_PASSWORD, dll)

python app.py
```

Buka **`http://127.0.0.1:5000`** di browser — dashboard dan API sama-sama disajikan dari sini, tidak perlu server/terminal terpisah untuk frontend. Cek API secara terpisah kalau perlu lewat `http://127.0.0.1:5000/api/health`.

Karena frontend dan API berada di origin yang sama, tidak ada konfigurasi CORS yang perlu diatur.

## 3. Login Admin Pertama Kali

- Username: `admin`
- Password: `admin123`

Klik tombol **Login** di kanan atas dashboard, masukkan kredensial di atas. Setelah login, menu **Input Data Operasi** muncul di sidebar. **Segera ganti password ini di lingkungan produksi** (belum ada endpoint ganti password di versi ini — ubah manual lewat `UPDATE admin SET password = ... WHERE username='admin'` menggunakan hash `werkzeug.security.generate_password_hash`).

## 4. Alur Kerja Data

- Semua chart & KPI di halaman publik (Beranda, Peta Sebaran, Tren & Statistik, Zona Prioritas, Sumber Daya & Kolaborasi, Prediksi Sebaran Lokasi) mengambil data **langsung dari database** via endpoint publik — tidak ada data dummy hardcoded di JS.
- Filter global (Tahun, Bulan, Kategori, Pos/Unit Siaga) di filterbar memengaruhi semua endpoint yang dipanggil.
- Menambah/mengedit/menghapus data operasi lewat halaman **Input Data Operasi** (butuh login admin) langsung tersimpan ke database dan otomatis tercermin di dashboard publik saat halaman di-refresh atau filter diganti — tanpa perlu restart server.
- Peta memakai transformasi affine sederhana (dikalibrasi dari 8 titik koordinat referensi Pos/Unit Siaga) untuk memproyeksikan latitude/longitude asli ke kanvas SVG skematik Jawa Timur. Ini **bukan proyeksi peta presisi** — posisinya ilustratif, konsisten dengan gaya visual mockup asli.
- "Zona Prioritas" (kelompok wilayah/kabupaten) dihitung dengan mengelompokkan titik kejadian ke wilayah referensi terdekat (nearest-centroid berdasarkan koordinat), karena skema database tidak menyimpan kolom kabupaten/kota secara eksplisit — hanya lokasi bebas teks + lat/lon.

## 5. Privasi Data (PII)

Nama & alamat korban (tabel `korban`) serta nama/no. HP pelapor (`operasi_sar.nama_pelapor`, `no_hp_pelapor`) **hanya** dikembalikan oleh endpoint admin (`GET /api/admin/operasi/:id`) yang wajib login. Seluruh endpoint publik memvalidasi tidak menyertakan kolom-kolom tersebut — lihat `backend/routes/public_routes.py`.

## 6. Migrasi Data Historis Excel

`database/migrate_excel.py` sudah disiapkan (belum dijalankan — file Excel asli Basarnas belum tersedia). Jalankan nanti dengan:

```bash
cd database
python migrate_excel.py path/ke/data_basarnas_2023_2025.xlsx
```

Script bersifat idempotent (aman dijalankan berulang, cek duplikat berdasarkan `waktu_kejadian` + `nama_objek_terdampak`) dan mencetak ringkasan jumlah baris berhasil/gagal di akhir.

## 7. Yang Masih Perlu Disesuaikan Manual

- **SECRET_KEY** di `backend/.env` — wajib diganti dengan string acak panjang sebelum dipakai di produksi.
- **Password admin default** (`admin123`) — wajib diganti.
- **WSGI produksi** — `python app.py` memakai development server Flask (`debug=True`). Untuk produksi, jalankan lewat `gunicorn`/`waitress` di belakang reverse proxy (nginx/IIS), dan matikan `FLASK_DEBUG`. Static frontend juga sebaiknya disajikan lewat reverse proxy (nginx) di produksi skala besar, bukan langsung dari Flask.
- **Migrasi Excel** — jalankan `migrate_excel.py` setelah file Excel resmi tersedia, lalu tinjau ringkasan baris yang gagal (kemungkinan perlu penyesuaian pola parsing kolom "INSTANSI & JML PERSON" atau "PERALATAN" sesuai variasi data asli).
- **Endpoint ganti password admin / manajemen akun admin lain** belum dibuat — saat ini hanya ada 1 akun admin dari seed data.
- **Fitur Export (CSV/XLSX/PDF)** di topbar masih berupa tombol placeholder (belum ada endpoint export di backend).
