-- =====================================================================
-- DATABASE: sar_dashboard
-- Dashboard Operasi SAR - Kantor SAR Surabaya
-- Versi FINAL setelah revisi lengkap (mengikuti 1NF/2NF/3NF)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS sar_dashboard
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sar_dashboard;

-- =====================================================================
-- 1. TABEL REFERENSI (LOOKUP)
-- =====================================================================

CREATE TABLE ref_kategori (
    id_kategori   INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE
    -- isi: 'Kecelakaan Kapal', 'Kecelakaan Pesawat', 'Bencana',
    --      'Kondisi Membahayakan Manusia', 'Kecelakaan dengan Penanganan Khusus'
);

CREATE TABLE ref_klasifikasi (
    id_klasifikasi   INT AUTO_INCREMENT PRIMARY KEY,
    nama_klasifikasi VARCHAR(150) NOT NULL UNIQUE
    -- isi: 'Man Over Board', 'Kapal Terbakar', 'Hilang Kontak', dst
);

-- CATATAN: kolom "JENIS KECELAKAAN" dari data asli Basarnas BUKAN kategori/lookup,
-- melainkan narasi bebas yang menggabungkan nama objek terdampak, deskripsi insiden,
-- dan rincian korban dalam 1 paragraf. Karena itu TIDAK dibuatkan tabel referensi --
-- disimpan sebagai kolom TEXT (`narasi_kejadian`) di operasi_sar, dan detail korban
-- per-orang dipecah ke tabel `korban` di bawah.

-- CATATAN PENTING: "STATUS OPERASI" TIDAK LAGI berupa tabel referensi + FK.
-- Ini variabel bantu (bukan data asli Basarnas) yang nilainya SELALU bisa
-- dihitung otomatis dari kelengkapan waktu_berangkat & waktu_selesai --
-- lihat kolom GENERATED `status_operasi` di tabel operasi_sar di bawah.
-- Dihapus dari sini supaya tidak ada risiko admin memilih status yang
-- kontradiktif dengan data waktu yang sebenarnya diisi.

CREATE TABLE ref_sumber_berita (
    id_sumber   INT AUTO_INCREMENT PRIMARY KEY,
    nama_sumber VARCHAR(150) NOT NULL UNIQUE
    -- isi kategori UMUM saja: 'Masyarakat','Instansi','Nelayan','Polisi','Dishub','Lainnya'
    -- Nama pelapor spesifik & kontak disimpan terpisah di operasi_sar (lihat bawah),
    -- BUKAN di tabel ini, karena sifatnya unik per laporan bukan kategori berulang.
);

CREATE TABLE ref_instansi (
    id_instansi   INT AUTO_INCREMENT PRIMARY KEY,
    nama_instansi VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE ref_peralatan (
    id_peralatan   INT AUTO_INCREMENT PRIMARY KEY,
    nama_peralatan VARCHAR(150) NOT NULL UNIQUE
    -- isi PERSIS 8 kategori baku (standarisasi dari data asli yang banyak typo):
    -- 'Peralatan Water Rescue', 'Peralatan Komunikasi', 'Peralatan Medis',
    -- 'Peralatan APD dan Baju Hazmat', 'Peralatan Perahu Rafting',
    -- 'Peralatan Perahu Karet dan Motor Tempel', 'Peralatan Handle Sonar (Aqua Eye)',
    -- 'Peralatan SAR Pendukung Lainnya'
);

CREATE TABLE ref_pos_unit (
    id_pos    INT AUTO_INCREMENT PRIMARY KEY,
    nama_pos  VARCHAR(150) NOT NULL UNIQUE,
    status    ENUM('aktif','nonaktif') DEFAULT 'aktif'
    -- kolom "AKSI" di data asli Basarnas (isinya nama pos, contoh: "SURABAYA",
    -- "RIB 06 KN SAR SURABAYA") di-mapping ke tabel ini via id_pos di operasi_sar,
    -- TIDAK dibuatkan kolom teks terpisah.
);

-- =====================================================================
-- 2. TABEL LOKASI (dipakai ulang untuk LKK & lokasi ditemukan)
-- =====================================================================
-- CATATAN: kolom "TIPE LKK"/"TIPE DITEMUKAN" (nilai: DMS dsb) dari data asli
-- SENGAJA TIDAK disimpan -- itu cuma variabel bantu validasi format koordinat
-- saat admin input data, bukan data yang perlu tersimpan permanen.

CREATE TABLE lokasi (
    id_lokasi      INT AUTO_INCREMENT PRIMARY KEY,
    deskripsi      VARCHAR(255),      -- contoh: 'Di Perairan Selatan Karang Jamuang'
    koordinat_teks VARCHAR(150),      -- contoh: '6° 56' 37.56" S 112° 43' 44.10" E'
    latitude       DECIMAL(10,7),
    longitude      DECIMAL(10,7)
);

-- =====================================================================
-- 3. TABEL ADMIN (login, HANYA untuk input/edit data -- BUKAN user publik)
-- =====================================================================

CREATE TABLE admin (
    id_admin      INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,   -- WAJIB hash (werkzeug/bcrypt), JANGAN plain text
    nama_lengkap  VARCHAR(100) NOT NULL,
    status        ENUM('aktif','nonaktif') DEFAULT 'aktif',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================================
-- 4. TABEL KORBAN (detail per-orang -- PII, WAJIB dilindungi dari publik)
-- =====================================================================

CREATE TABLE korban (
    id_korban          INT AUTO_INCREMENT PRIMARY KEY,
    id_operasi         INT NOT NULL,
    nama               VARCHAR(150) NOT NULL,
    jenis_kelamin      ENUM('L','P'),
    usia               INT,
    pekerjaan          VARCHAR(150),   -- contoh: 'Pemancing', 'ABK KMN Raden Joyo 3', 'Nahkoda', 'PNP'
    alamat_desa        VARCHAR(100),
    alamat_kecamatan   VARCHAR(100),
    alamat_kabupaten   VARCHAR(100),
    status             ENUM('Selamat','Meninggal Dunia','Hilang') NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- FK ke operasi_sar SENGAJA belum didefinisikan di sini -- tabel operasi_sar
    -- baru dibuat setelah ini, jadi FK-nya ditambahkan lewat ALTER TABLE di bagian 5.
);

-- =====================================================================
-- 5. TABEL UTAMA: OPERASI SAR
-- =====================================================================

CREATE TABLE operasi_sar (
    id_operasi              INT AUTO_INCREMENT PRIMARY KEY,

    -- waktu kejadian & turunannya (tahun/bulan TIDAK disimpan manual)
    waktu_kejadian          DATETIME NOT NULL,
    tahun                   SMALLINT GENERATED ALWAYS AS (YEAR(waktu_kejadian)) STORED,
    bulan                   TINYINT  GENERATED ALWAYS AS (MONTH(waktu_kejadian)) STORED,

    -- klasifikasi kejadian
    id_kategori             INT,
    id_klasifikasi          INT,
    nama_objek_terdampak    VARCHAR(150),  -- contoh: 'KM Fortuner', 'Kapal Kayu Warna Biru Dongker'
    narasi_kejadian         TEXT,          -- kronologi/uraian bebas (BUKAN kategori)

    -- lokasi kejadian (LKK)
    id_lokasi_kejadian      INT,
    radial_derajat          DECIMAL(6,2),  -- arah kompas dari pos SAR ke LKK, contoh: 353.00
    id_pos                  INT,           -- Pos/Unit Siaga penanggung jawab (= kolom "AKSI" asli)

    -- status operasi: lihat kolom GENERATED `status_operasi` di bawah,
    -- setelah kolom waktu_berangkat/waktu_selesai didefinisikan

    -- sumber berita: id_sumber = kategori umum (untuk chart),
    -- nama_pelapor & no_hp_pelapor = data pribadi (PII), HANYA utk endpoint admin
    id_sumber                INT,
    nama_pelapor              VARCHAR(150),
    instansi_pelapor          VARCHAR(150),
    no_hp_pelapor             VARCHAR(30),

    -- waktu-waktu operasi
    waktu_lapor              DATETIME,
    waktu_berangkat          DATETIME,
    waktu_tiba                DATETIME,
    waktu_selesai              DATETIME,
    -- Status Operasi dihitung OTOMATIS oleh database, TIDAK BISA diisi manual.
    -- 'Dilaksanakan' kalau waktu_berangkat & waktu_selesai keduanya terisi;
    -- selain itu (misal cuma waktu_kejadian+waktu_lapor) -> 'Tidak Dilaksanakan'.
    status_operasi              VARCHAR(20) GENERATED ALWAYS AS (
                                     CASE WHEN waktu_berangkat IS NOT NULL
                                               AND waktu_selesai IS NOT NULL
                                          THEN 'Dilaksanakan'
                                          ELSE 'Tidak Dilaksanakan'
                                     END
                                 ) STORED,
    waktu_siap_menit           INT,           -- satuan MENIT, contoh: 20
    waktu_tempuh_menit          INT,           -- satuan MENIT, contoh: 82, 40

    -- jarak (dipecah 2 karena beda satuan/medium)
    jarak_laut_nm             DECIMAL(10,2), -- Nautical Mile
    jarak_darat_km            DECIMAL(10,2), -- Kilometer

    -- data korban (agregat -- detail per-orang ada di tabel korban)
    pob                       INT,           -- Person On Board
    jumlah_selamat            INT DEFAULT 0,
    jumlah_meninggal          INT DEFAULT 0,
    jumlah_hilang             INT DEFAULT 0,

    kendala_pelaksanaan       TEXT,          -- juga dipakai utk keterangan status "Tidak Dilaksanakan"

    -- lokasi ditemukan (nullable, isi kalau korban/operasi sudah ditemukan)
    id_lokasi_ditemukan       INT NULL,
    jarak_dari_lkk_km         DECIMAL(10,2), -- jarak titik ditemukan dari LKK

    lain_lain                 TEXT,
    biaya_rp                  DECIMAL(15,2),

    -- durasi operasi dihitung otomatis, BUKAN input manual
    durasi_operasi_hari       INT GENERATED ALWAYS AS
                               (DATEDIFF(waktu_selesai, waktu_berangkat)) STORED,

    id_admin_input             INT NULL,      -- audit trail: siapa yang input data ini
    created_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_kategori FOREIGN KEY (id_kategori) REFERENCES ref_kategori(id_kategori),
    CONSTRAINT fk_klasifikasi FOREIGN KEY (id_klasifikasi) REFERENCES ref_klasifikasi(id_klasifikasi),
    CONSTRAINT fk_lokasi_kejadian FOREIGN KEY (id_lokasi_kejadian) REFERENCES lokasi(id_lokasi),
    CONSTRAINT fk_lokasi_ditemukan FOREIGN KEY (id_lokasi_ditemukan) REFERENCES lokasi(id_lokasi),
    CONSTRAINT fk_pos FOREIGN KEY (id_pos) REFERENCES ref_pos_unit(id_pos),
    -- (tidak ada lagi fk_status -- status_operasi sekarang GENERATED column, bukan FK)
    CONSTRAINT fk_sumber FOREIGN KEY (id_sumber) REFERENCES ref_sumber_berita(id_sumber),
    CONSTRAINT fk_operasi_admin_input FOREIGN KEY (id_admin_input) REFERENCES admin(id_admin)
);

-- Tambahkan FK dari korban ke operasi_sar sekarang (operasi_sar baru selesai dibuat)
ALTER TABLE korban
    ADD CONSTRAINT fk_korban_operasi_sar FOREIGN KEY (id_operasi)
        REFERENCES operasi_sar(id_operasi) ON DELETE CASCADE;

-- =====================================================================
-- 6. TABEL RELASI MANY-TO-MANY
-- =====================================================================

CREATE TABLE operasi_instansi (
    id_operasi      INT NOT NULL,
    id_instansi     INT NOT NULL,
    jumlah_personel INT DEFAULT 0,   -- WAJIB integer diskrit
    PRIMARY KEY (id_operasi, id_instansi),
    CONSTRAINT fk_oi_operasi FOREIGN KEY (id_operasi)
        REFERENCES operasi_sar(id_operasi) ON DELETE CASCADE,
    CONSTRAINT fk_oi_instansi FOREIGN KEY (id_instansi)
        REFERENCES ref_instansi(id_instansi)
);

CREATE TABLE operasi_peralatan (
    id_operasi     INT NOT NULL,
    id_peralatan   INT NOT NULL,
    jumlah         INT DEFAULT 1,
    PRIMARY KEY (id_operasi, id_peralatan),
    CONSTRAINT fk_op_operasi FOREIGN KEY (id_operasi)
        REFERENCES operasi_sar(id_operasi) ON DELETE CASCADE,
    CONSTRAINT fk_op_peralatan FOREIGN KEY (id_peralatan)
        REFERENCES ref_peralatan(id_peralatan)
);

-- =====================================================================
-- 7. INDEX TAMBAHAN (mempercepat query filter dashboard)
-- =====================================================================

CREATE INDEX idx_operasi_tahun_bulan ON operasi_sar (tahun, bulan);
CREATE INDEX idx_operasi_status ON operasi_sar (status_operasi);
CREATE INDEX idx_operasi_kategori ON operasi_sar (id_kategori);
CREATE INDEX idx_operasi_pos ON operasi_sar (id_pos);
CREATE INDEX idx_korban_operasi ON korban (id_operasi);
