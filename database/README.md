# Database — SAR Dashboard

Skema MariaDB untuk Dashboard Operasi SAR Kantor SAR Surabaya. `schema.sql` dan `seed_dummy.sql` adalah salinan **persis** dari file yang sudah final — jangan diedit di sini; kalau perlu revisi struktur, revisi di sumber aslinya dulu.

## Import ke MariaDB

Urutan **wajib**: `schema.sql` dulu, baru `seed_dummy.sql` (seed mereferensikan tabel yang dibuat schema, dan mengasumsikan tabel masih kosong / auto-increment mulai dari 1).

### 1. Via CLI (`mysql` client, kompatibel dengan MariaDB)

```bash
mysql -u root -p < schema.sql
mysql -u root -p < seed_dummy.sql
```

Kalau MariaDB jalan di port/host non-default, tambahkan `-h <host> -P <port>`.

### 2. Via MariaDB shell interaktif

```sql
mysql -u root -p
SOURCE /path/to/database/schema.sql;
SOURCE /path/to/database/seed_dummy.sql;
```

### 3. Verifikasi

```sql
USE sar_dashboard;
SHOW TABLES;
SELECT COUNT(*) FROM operasi_sar;   -- harus 38
SELECT COUNT(*) FROM korban;        -- data korban per-orang
SELECT username, status FROM admin; -- harus ada 1 baris: admin / aktif
```

## Reset database (development only)

```sql
DROP DATABASE IF EXISTS sar_dashboard;
```

lalu jalankan ulang langkah import di atas. **Jangan** jalankan ini di database produksi.

## Login admin default

- Username: `admin`
- Password: `admin123` (hash sudah ada di `seed_dummy.sql`, di-generate dengan `werkzeug.security.generate_password_hash`)
- **Wajib diganti** setelah login pertama kali di lingkungan produksi.

## Catatan skema

Lihat komentar di dalam `schema.sql` untuk detail keputusan desain (kolom generated, kenapa PII dipisah, dst). Ringkasan cepat ada di `prompt_claude_code_FINAL.md` bagian 3, atau baca langsung `backend/README` bagian API untuk melihat bagaimana skema ini dipetakan ke endpoint.

## `migrate_excel.py`

Script migrasi data historis Excel Basarnas (2023-2025) ke skema ini. **Belum dijalankan** — disiapkan untuk dipakai nanti setelah file Excel asli tersedia. Lihat komentar di dalam file untuk aturan mapping kolom dan cara menjalankannya.
