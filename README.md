# Dashboard Operasi SAR — Kantor SAR Surabaya

Flask + MariaDB di backend, HTML/CSS/JS vanilla di frontend. Satu perintah,
satu port — Flask serving frontend-nya sendiri.

## Setup Database

```bash
mysql -u root -p < database/histori/schema.sql
mysql -u root -p < database/histori/seed_admin.sql
```

Nama database yang dipakai: **`sar_db`** (bukan `sar_dashboard`) — pastikan
`DB_NAME` di `.env` diisi `sar_db`, kalau tidak app-nya connect ke database
yang salah/tidak ada.

## Jalankan Aplikasi

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux
```

Edit `.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=isi_password_mysql_kamu
DB_NAME=sar_db
SECRET_KEY=ganti-dengan-string-acak
```

Lalu jalankan:

```bash
python app.py
```

Buka `http://127.0.0.1:5000`. Cek server hidup lewat `http://127.0.0.1:5000/api/health`.

## Login Admin

- Username: `admin`
- Password: `admin123`

Login dulu supaya menu **Input Data Operasi** muncul di sidebar. Belum ada
endpoint ganti password — kalau perlu ganti manual lewat
`UPDATE admin SET password = ...` pakai hash
`werkzeug.security.generate_password_hash`.

## Kalau gagal jalan / gagal login, cek urutan ini

1. MariaDB/MySQL servernya nyala?
2. `database/histori/schema.sql` dan `seed_admin.sql` udah berhasil di-import
   (tanpa error) ke database `sar_db`?
3. `.env` di folder `backend/` udah ada dan `DB_NAME=sar_db`?
4. `pip install -r requirements.txt` selesai tanpa error — kalau fitur
   upload Excel di admin panel dipakai, pastikan `openpyxl` dan `geopy` juga
   ke-install (ada di `requirements.txt`).
5. Terminal `python app.py` tidak menunjukkan error koneksi database saat
   start.
6. Login pakai `admin` / `admin123` persis (huruf kecil semua, tanpa spasi).