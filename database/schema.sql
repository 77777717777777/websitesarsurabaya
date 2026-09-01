-- =====================================================================
-- DATABASE: sar_db
-- Dashboard Operasi SAR - Kantor SAR Surabaya
--
-- Skema AKTUAL yang dipakai backend (lihat backend/routes/public_routes.py
-- dan backend/routes/admin_routes.py): satu tabel flat `kejadian_sar` (hasil
-- keputusan hybrid di awal proyek, menggantikan rancangan normalized
-- operasi_sar/korban/ref_* yang ada di database/schema.backup.sql -- rancangan
-- itu SUDAH TIDAK DIPAKAI, disimpan hanya sebagai arsip riwayat desain),
-- ditambah tabel `admin` untuk login pengelola data.
--
-- Urutan setup (lihat README.md):
--   mysql -u root -p < database/schema.sql
--   mysql -u root -p sar_db < database/seed_admin.sql
--   mysql -u root -p sar_db < database/data_kejadian_sar.sql   -- data historis 2023-2025
-- =====================================================================

CREATE DATABASE IF NOT EXISTS sar_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sar_db;

-- =====================================================================
-- 1. TABEL UTAMA: kejadian_sar (satu baris = satu kejadian/operasi SAR)
-- =====================================================================
-- `no_urut` adalah PRIMARY KEY tapi BUKAN AUTO_INCREMENT -- id berikutnya
-- dihitung manual di backend (lihat _next_no_urut() di admin_routes.py,
-- pakai SELECT ... FOR UPDATE supaya aman dari race condition input
-- bersamaan). Ini konsisten dengan cara data historis diimpor (no_urut
-- mengikuti nomor urut asli dari laporan Basarnas, bukan angka baru).

CREATE TABLE kejadian_sar (
  no_urut bigint(20) NOT NULL,
  tahun bigint(20) DEFAULT NULL,
  bulan text DEFAULT NULL,
  bulan_angka tinyint(4) DEFAULT NULL,
  kategori text DEFAULT NULL,
  klasifikasi text DEFAULT NULL,               -- kolom legacy, tidak dipakai untuk filter
  kategori_kejadian text DEFAULT NULL,          -- klasifikasi detail (dipakai untuk filter)
  jenis_kecelakaan text DEFAULT NULL,           -- narasi kejadian
  posisi_koordinat_area text DEFAULT NULL,
  koordinat_lkk_teks text DEFAULT NULL,         -- kolom legacy
  tipe_lkk text DEFAULT NULL,                   -- kolom legacy
  latitude_lkk double DEFAULT NULL,
  longitude_lkk double DEFAULT NULL,
  status_operasi enum('Dilaksanakan','Tidak Dilaksanakan') DEFAULT NULL,
  waktu_kejadian datetime DEFAULT NULL,
  waktu_lapor datetime DEFAULT NULL,
  rentang_waktu int(11) DEFAULT NULL COMMENT 'durasi dalam menit, kolom legacy',
  waktu_berangkat datetime DEFAULT NULL,
  waktu_tiba datetime DEFAULT NULL,
  waktu_selesai datetime DEFAULT NULL,
  jarak text DEFAULT NULL,                      -- kolom legacy
  waktu_siap double DEFAULT NULL,
  waktu_tempuh text DEFAULT NULL,               -- kolom legacy
  waktu_tempuh_menit double DEFAULT NULL,
  pob int(11) DEFAULT NULL,
  s_org int(11) DEFAULT NULL,
  md_org int(11) DEFAULT NULL,
  h_org int(11) DEFAULT NULL,
  instansi_jml_person text DEFAULT NULL,
  peralatan text DEFAULT NULL,
  sumber_berita text DEFAULT NULL,
  kendala_pelaksanaan_ops_sar text DEFAULT NULL,
  lokasi_ditemukan text DEFAULT NULL,
  koordinat_ditemukan_teks text DEFAULT NULL,   -- kolom legacy
  tipe_ditemukan text DEFAULT NULL,             -- kolom legacy
  latitude_ditemukan double DEFAULT NULL,
  longitude_ditemukan double DEFAULT NULL,
  lainlain text DEFAULT NULL,
  biaya_rp text DEFAULT NULL,
  aksi text DEFAULT NULL,                       -- kolom legacy, sumber wilayah_mapped
  wilayah_mapped text DEFAULT NULL,             -- bisa berisi multi-wilayah dipisah koma
  durasi_operasi_hari double DEFAULT NULL,
  PRIMARY KEY (no_urut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================================
-- 2. TABEL ADMIN (login, HANYA untuk input/edit data -- BUKAN user publik)
-- =====================================================================

CREATE TABLE admin (
  id_admin bigint(20) NOT NULL AUTO_INCREMENT,
  username varchar(50) NOT NULL,
  password varchar(255) NOT NULL,   -- WAJIB hash (werkzeug.security), JANGAN plain text
  nama_lengkap varchar(100) DEFAULT NULL,
  status enum('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id_admin),
  UNIQUE KEY uq_admin_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================================
-- 3. INDEX (mempercepat query filter dashboard)
-- =====================================================================

CREATE INDEX idx_kejadian_tahun_bulan ON kejadian_sar (tahun, bulan_angka);
CREATE INDEX idx_kejadian_status ON kejadian_sar (status_operasi);
CREATE INDEX idx_kejadian_kategori ON kejadian_sar (kategori(100));
CREATE INDEX idx_kejadian_waktu ON kejadian_sar (waktu_kejadian);

-- Isi data admin pertama: jalankan database/seed_admin.sql setelah ini.
-- Isi data historis kejadian: jalankan database/data_kejadian_sar.sql setelah itu.
