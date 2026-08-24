-- =====================================================================
-- SEED DATA: sar_dashboard
-- Data referensi + dummy operasi untuk testing dashboard
-- Jalankan SETELAH schema_sar_dashboard_final.sql
-- =====================================================================

USE sar_dashboard;

-- ===== 1. TABEL REFERENSI =====

INSERT INTO ref_kategori (nama_kategori) VALUES
('Kecelakaan Kapal'),
('Kecelakaan Pesawat'),
('Bencana'),
('Kondisi Membahayakan Manusia'),
('Kecelakaan dengan Penanganan Khusus');

INSERT INTO ref_klasifikasi (nama_klasifikasi) VALUES
('Man Over Board'),
('Kapal Terbakar'),
('Kapal Tenggelam'),
('Hilang Kontak'),
('Mati Mesin'),
('Kapal Karam'),
('Pesawat Jatuh'),
('Pesawat Hilang Kontak'),
('Banjir'),
('Tanah Longsor'),
('Gempa Bumi'),
('Angin Puting Beliung'),
('Orang Tenggelam di Pantai'),
('Pendaki Hilang'),
('Terjatuh dari Ketinggian'),
('Terseret Ombak'),
('Evakuasi Medis Laut'),
('Pencarian Korban Khusus');

INSERT INTO ref_sumber_berita (nama_sumber) VALUES
('Masyarakat'),
('Instansi'),
('Nelayan'),
('Polisi'),
('Dishub'),
('Lainnya');

INSERT INTO ref_instansi (nama_instansi) VALUES
('BPBD'),
('TNI AL'),
('POL AIRUD'),
('PMI'),
('Syahbandar'),
('Pemerintah Desa'),
('Paguyuban Nelayan'),
('KSOP'),
('Kantor SROP'),
('Kantor VTS'),
('SATPOL AIR'),
('Basarnas Pusat');

INSERT INTO ref_peralatan (nama_peralatan) VALUES
('Peralatan Water Rescue'),
('Peralatan Komunikasi'),
('Peralatan Medis'),
('Peralatan APD dan Baju Hazmat'),
('Peralatan Perahu Rafting'),
('Peralatan Perahu Karet dan Motor Tempel'),
('Peralatan Handle Sonar (Aqua Eye)'),
('Peralatan SAR Pendukung Lainnya');

INSERT INTO ref_pos_unit (nama_pos, status) VALUES
('KN SAR Surabaya (Pusat)', 'aktif'),
('Pos SAR Trenggalek', 'aktif'),
('Pos SAR Banyuwangi', 'nonaktif'),
('Pos SAR Jember', 'nonaktif'),
('Unit Siaga SAR Sumenep', 'aktif'),
('Unit Siaga SAR Malang', 'aktif'),
('Unit Siaga SAR Bojonegoro', 'aktif'),
('Unit Siaga SAR Lamongan', 'aktif');

-- ===== 2. TABEL ADMIN =====

-- Password default: admin123 (WAJIB diganti setelah login pertama kali)
INSERT INTO admin (username, password, nama_lengkap, status) VALUES
('admin', 'scrypt:32768:8:1$iuWL2cf4SUbbtznJ$512c04cdd8030647fff352a23e50d18b6892ea44ef5e23db1d9eb5b5f8c08d033b64c1ad5518a20b15e5d383427a09aa7954deceddc2ac039bc9412944819270', 'Administrator SAR Surabaya', 'aktif');

-- ===== 3. LOKASI & OPERASI SAR (dummy, 2023-2026) =====

-- Lokasi (LKK + titik ditemukan)
INSERT INTO lokasi (id_lokasi, deskripsi, koordinat_teks, latitude, longitude) VALUES
(1, 'Di Depan Pelabuhan Petro Gresik', '7.1164 S 112.6877 E', -7.116353, 112.68767),
(2, 'Titik ditemukan dekat Depan Pelabuhan Petro Gresik', '7.1110 S 112.7062 E', -7.110997, 112.706236),
(3, 'Di Perairan Pesisir Lamongan', '6.8263 S 112.3148 E', -6.826335, 112.314804),
(4, 'Titik ditemukan dekat Perairan Pesisir Lamongan', '6.8080 S 112.3089 E', -6.808032, 112.308874),
(5, 'Di Kawasan Pelabuhan Tanjung Perak', '7.1587 S 112.7671 E', -7.158737, 112.767052),
(6, 'Titik ditemukan dekat Kawasan Pelabuhan Tanjung Perak', '7.1361 S 112.7939 E', -7.136056, 112.793869),
(7, 'Di Perairan Selat Madura', '7.0071 S 112.8755 E', -7.007109, 112.875527),
(8, 'Di Perairan Bawean', '5.7303 S 112.6731 E', -5.730341, 112.673051),
(9, 'Titik ditemukan dekat Perairan Bawean', '5.7285 S 112.6465 E', -5.728473, 112.646464),
(10, 'Di Perairan Pantai Selatan Malang', '8.4418 S 112.6157 E', -8.441802, 112.615737),
(11, 'Di Perairan Pesisir Lamongan', '6.8758 S 112.3206 E', -6.875816, 112.320567),
(12, 'Titik ditemukan dekat Perairan Pesisir Lamongan', '6.8908 S 112.2967 E', -6.890844, 112.296735),
(13, 'Di Depan Pelabuhan Petro Gresik', '7.1113 S 112.6308 E', -7.111263, 112.63081),
(14, 'Titik ditemukan dekat Depan Pelabuhan Petro Gresik', '7.1173 S 112.6597 E', -7.117282, 112.659679),
(15, 'Di Perairan Bawean', '5.7452 S 112.6000 E', -5.745206, 112.600041),
(16, 'Di Perairan Bawean', '5.7938 S 112.6833 E', -5.793773, 112.683289),
(17, 'Titik ditemukan dekat Perairan Bawean', '5.7830 S 112.6775 E', -5.783024, 112.677548),
(18, 'Di Gunung Semeru, Malang', '8.1298 S 112.9384 E', -8.129842, 112.938426),
(19, 'Titik ditemukan dekat Gunung Semeru, Malang', '8.1217 S 112.9581 E', -8.121707, 112.958148),
(20, 'Di Gunung Semeru, Malang', '8.1135 S 112.9310 E', -8.113529, 112.931033),
(21, 'Titik ditemukan dekat Gunung Semeru, Malang', '8.1191 S 112.9343 E', -8.119143, 112.934344),
(22, 'Di Pantai Prigi, Trenggalek', '8.2603 S 111.6926 E', -8.260258, 111.692628),
(23, 'Di Kawasan Pelabuhan Tanjung Perak', '7.1960 S 112.7238 E', -7.196002, 112.723776),
(24, 'Di Perairan Ketapang, Sampang', '6.9258 S 113.2552 E', -6.925796, 113.255161),
(25, 'Di Perairan Bawean', '5.7165 S 112.6980 E', -5.716528, 112.698024),
(26, 'Di Perairan Selat Bali, Banyuwangi', '8.3373 S 114.4387 E', -8.33732, 114.438744),
(27, 'Titik ditemukan dekat Perairan Selat Bali, Banyuwangi', '8.3494 S 114.4105 E', -8.349352, 114.410481),
(28, 'Di Perairan Selat Madura', '7.0619 S 112.8359 E', -7.061864, 112.835896),
(29, 'Titik ditemukan dekat Perairan Selat Madura', '7.0707 S 112.8441 E', -7.070725, 112.844093),
(30, 'Di Perairan Selat Madura', '7.0868 S 112.8539 E', -7.086784, 112.853941),
(31, 'Titik ditemukan dekat Perairan Selat Madura', '7.0931 S 112.8398 E', -7.09311, 112.839809),
(32, 'Di Perairan Pantai Selatan Malang', '8.4284 S 112.6370 E', -8.428405, 112.63697),
(33, 'Titik ditemukan dekat Perairan Pantai Selatan Malang', '8.4575 S 112.6229 E', -8.457458, 112.622892),
(34, 'Di Perairan Selat Bali, Banyuwangi', '8.3573 S 114.4165 E', -8.357324, 114.416511),
(35, 'Titik ditemukan dekat Perairan Selat Bali, Banyuwangi', '8.3627 S 114.4389 E', -8.362675, 114.438927),
(36, 'Di Perairan Ketapang, Sampang', '6.9276 S 113.3107 E', -6.927599, 113.310708),
(37, 'Titik ditemukan dekat Perairan Ketapang, Sampang', '6.9543 S 113.2930 E', -6.954312, 113.292973),
(38, 'Di Perairan Keramaian Sumenep', '5.0903 S 114.7342 E', -5.090293, 114.734204),
(39, 'Di Perairan Selat Madura', '7.0667 S 112.8168 E', -7.066693, 112.816813),
(40, 'Titik ditemukan dekat Perairan Selat Madura', '7.0574 S 112.7974 E', -7.057362, 112.797442),
(41, 'Di Perairan Pantai Selatan Malang', '8.4444 S 112.6007 E', -8.444383, 112.600734),
(42, 'Titik ditemukan dekat Perairan Pantai Selatan Malang', '8.4401 S 112.5820 E', -8.440084, 112.582028),
(43, 'Di Pantai Prigi, Trenggalek', '8.3048 S 111.7652 E', -8.3048, 111.765157),
(44, 'Di Bengawan Solo, Bojonegoro', '7.1231 S 111.9078 E', -7.123056, 111.907812),
(45, 'Di Perairan Selatan Karang Jamuang', '6.9504 S 112.7174 E', -6.950355, 112.717396),
(46, 'Titik ditemukan dekat Perairan Selatan Karang Jamuang', '6.9522 S 112.7243 E', -6.952208, 112.724317),
(47, 'Di Perairan Keramaian Sumenep', '5.1189 S 114.7505 E', -5.118914, 114.750515),
(48, 'Di Perairan Selat Bali, Banyuwangi', '8.3138 S 114.3548 E', -8.313786, 114.35478),
(49, 'Titik ditemukan dekat Perairan Selat Bali, Banyuwangi', '8.3391 S 114.3609 E', -8.33905, 114.360927),
(50, 'Di Pantai Prigi, Trenggalek', '8.2525 S 111.7504 E', -8.252504, 111.750404),
(51, 'Titik ditemukan dekat Pantai Prigi, Trenggalek', '8.2495 S 111.7378 E', -8.249504, 111.737826),
(52, 'Di Perairan Ketapang, Sampang', '6.9489 S 113.3072 E', -6.948919, 113.307214),
(53, 'Di Perairan Selat Bali, Banyuwangi', '8.3447 S 114.3574 E', -8.344678, 114.357353),
(54, 'Di Depan Pelabuhan Petro Gresik', '7.1381 S 112.6761 E', -7.138132, 112.676089),
(55, 'Titik ditemukan dekat Depan Pelabuhan Petro Gresik', '7.1546 S 112.7045 E', -7.15464, 112.704464),
(56, 'Di Pantai Prigi, Trenggalek', '8.2654 S 111.7708 E', -8.26541, 111.770794),
(57, 'Di Perairan Selat Bali, Ketapang', '8.0817 S 114.3585 E', -8.081701, 114.358456),
(58, 'Titik ditemukan dekat Perairan Selat Bali, Ketapang', '8.0776 S 114.3739 E', -8.077634, 114.373893),
(59, 'Di Perairan Keramaian Sumenep', '5.1238 S 114.7148 E', -5.123824, 114.714765),
(60, 'Di Perairan Kepulauan Sumenep', '6.9497 S 113.8523 E', -6.949653, 113.852274),
(61, 'Titik ditemukan dekat Perairan Kepulauan Sumenep', '6.9756 S 113.8579 E', -6.975616, 113.857911);

-- Operasi SAR (dummy)
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-01-13 23:17:00', 2, 7, NULL, '4 Org. Nahkoda, mengalami pesawat jatuh di Depan Pelabuhan Petro Gresik.', 1, 257.77, 2, 5, 'Ibu Sri', 'Warga Sekitar', '081234567003', '2023-01-14 00:17:00', '2023-01-14 00:37:00', '2023-01-14 01:24:00', '2023-01-15 10:24:00', 27, 127, NULL, 34.11, 4, 4, 0, 0, NULL, 2, 0.16, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2024-03-24 11:22:00', 2, 8, NULL, '5 Org. Pengunjung Pantai, mengalami pesawat hilang kontak di Perairan Pesisir Lamongan.', 3, 303.43, 3, 5, NULL, NULL, NULL, '2024-03-24 13:22:00', '2024-03-24 14:06:00', '2024-03-24 15:14:00', '2024-03-26 08:14:00', 11, 78, 62.25, NULL, 5, 5, 0, 0, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', 4, 0.76, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-01-02 23:56:00', 3, 10, NULL, '10 Org. Nelayan, mengalami tanah longsor di Kawasan Pelabuhan Tanjung Perak.', 5, 130.67, 4, 2, NULL, 'POL AIRUD Lamongan', NULL, '2025-01-03 04:56:00', '2025-01-03 05:44:00', '2025-01-03 06:04:00', '2025-01-04 03:04:00', 19, 81, NULL, 7.6, 10, 7, 0, 3, NULL, 6, 0.95, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-10-09 05:16:00', 5, 18, NULL, '8 Org. PNP, mengalami pencarian korban khusus di Perairan Selat Madura.', 7, 80.89, 5, 4, NULL, NULL, NULL, '2025-10-09 08:16:00', '2025-10-09 08:59:00', '2025-10-09 10:25:00', NULL, 20, 25, 12.65, NULL, 8, 0, 0, 8, NULL, NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-01-02 12:16:00', 4, 15, NULL, '12 Org. Nahkoda, mengalami terjatuh dari ketinggian di Perairan Bawean.', 8, 18.05, 8, 2, 'Bpk. Kamto', 'Anggota SATPOL AIR Polres Gresik', '081234567002', '2025-01-02 14:16:00', '2025-01-02 14:34:00', '2025-01-02 16:08:00', '2025-01-04 03:08:00', 25, 148, 29.6, NULL, 12, 0, 11, 1, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', 9, 5.13, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-10-19 07:37:00', 5, 17, NULL, '5 Org. ABK Kapal Nelayan, mengalami evakuasi medis laut di Perairan Pantai Selatan Malang.', 10, 241.81, 6, 3, 'Bpk. Kamto', 'Anggota SATPOL AIR Polres Gresik', '081234567002', '2023-10-19 13:37:00', '2023-10-19 14:12:00', '2023-10-19 15:02:00', NULL, 19, 137, 36.83, NULL, 5, 0, 0, 5, NULL, NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-06-20 04:40:00', 3, 10, NULL, '10 Org. Pendaki, mengalami tanah longsor di Perairan Pesisir Lamongan.', 11, 110.97, 2, 1, NULL, NULL, NULL, '2023-06-20 09:40:00', '2023-06-20 09:57:00', '2023-06-20 11:04:00', '2023-06-21 23:04:00', 11, 111, 13.22, NULL, 10, 2, 6, 2, NULL, 12, 7.82, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-06-20 13:51:00', 2, 8, NULL, '4 Org. Pemancing, mengalami pesawat hilang kontak di Depan Pelabuhan Petro Gresik.', 13, 311.17, 8, 2, 'Bpk. Kamto', 'Anggota SATPOL AIR Polres Gresik', '081234567002', '2023-06-20 16:51:00', '2023-06-20 17:25:00', '2023-06-20 18:14:00', '2023-06-20 20:14:00', 18, 109, NULL, 20.37, 4, 1, 3, 0, NULL, 14, 5.41, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-12-07 12:43:00', 2, 8, NULL, '8 Org. Pengunjung Pantai, mengalami pesawat hilang kontak di Perairan Bawean.', 15, 184.02, 7, 5, 'Bpk. Hadi', 'Nelayan Setempat', '081234567004', '2025-12-07 15:43:00', '2025-12-07 16:27:00', '2025-12-07 17:43:00', NULL, 15, 41, 61.46, NULL, 8, 0, 0, 8, NULL, NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2024-02-02 13:26:00', 3, 12, NULL, '7 Org. Nelayan, mengalami angin puting beliung di Perairan Bawean.', 16, 156.9, 1, 5, 'Ibu Sri', 'Warga Sekitar', '081234567003', '2024-02-02 14:26:00', '2024-02-02 15:03:00', '2024-02-02 16:01:00', '2024-02-03 19:01:00', 10, 119, 21.31, NULL, 7, 3, 3, 1, NULL, 17, 1.73, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2026-06-26 20:15:00', 1, 6, 'Kapal Kayu Warna Merah', '9 Org. Pendaki, mengalami kapal karam di Gunung Semeru, Malang.', 18, 296.04, 1, 3, 'Bpk. Hadi', 'Nelayan Setempat', '081234567004', '2026-06-27 02:15:00', '2026-06-27 02:53:00', '2026-06-27 03:21:00', '2026-06-28 21:21:00', 13, 130, 76.76, NULL, 9, 5, 0, 4, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', 19, 7.1, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2024-02-14 08:56:00', 4, 14, NULL, '5 Org. Nelayan, mengalami pendaki hilang di Gunung Semeru, Malang.', 20, 185.99, 1, 4, NULL, 'POL AIRUD Lamongan', NULL, '2024-02-14 12:56:00', '2024-02-14 13:24:00', '2024-02-14 14:29:00', '2024-02-15 12:29:00', 16, 41, NULL, 33.79, 5, 2, 2, 1, NULL, 21, 2.48, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-03-06 08:02:00', 1, 5, NULL, '8 Org. ABK Kapal Nelayan, mengalami mati mesin di Pantai Prigi, Trenggalek.', 22, 347.58, 8, 1, 'Bpk. Yayak', 'Anggota BPBD Bangkalan', '081234567001', '2025-03-06 11:02:00', '2025-03-06 11:47:00', '2025-03-06 13:08:00', NULL, 18, 142, 31.98, NULL, 8, 0, 0, 8, NULL, NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-12-19 09:44:00', 4, 15, NULL, '4 Org. Wisatawan, mengalami terjatuh dari ketinggian di Kawasan Pelabuhan Tanjung Perak.', 23, 300.95, 7, 6, NULL, 'POL AIRUD Lamongan', NULL, '2025-12-19 12:44:00', '2025-12-19 13:00:00', '2025-12-19 13:31:00', NULL, 28, 25, NULL, 57.75, 4, 0, 0, 4, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-04-07 16:23:00', 5, 18, NULL, '11 Org. Penumpang Kapal, mengalami pencarian korban khusus di Perairan Ketapang, Sampang.', 24, 86.15, 3, 3, 'Ibu Sri', 'Warga Sekitar', '081234567003', '2023-04-07 20:23:00', '2023-04-07 20:45:00', '2023-04-07 21:08:00', NULL, 15, 99, 55.58, NULL, 11, 0, 0, 11, NULL, NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-09-13 22:18:00', 5, 18, NULL, '5 Org. Pemancing, mengalami pencarian korban khusus di Perairan Bawean.', 25, 307.59, 3, 4, 'Bpk. Kamto', 'Anggota SATPOL AIR Polres Gresik', '081234567002', '2023-09-14 03:18:00', '2023-09-14 03:41:00', '2023-09-14 04:09:00', NULL, 20, 149, 70.0, NULL, 5, 0, 0, 5, NULL, NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-06-18 21:54:00', 5, 18, NULL, '4 Org. Pemancing, mengalami pencarian korban khusus di Perairan Selat Bali, Banyuwangi.', 26, 273.73, 1, 5, 'Bpk. Yayak', 'Anggota BPBD Bangkalan', '081234567001', '2023-06-19 03:54:00', '2023-06-19 04:52:00', '2023-06-19 05:48:00', '2023-06-21 05:48:00', 13, 133, 88.09, NULL, 4, 0, 3, 1, NULL, 27, 3.31, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2024-04-11 12:54:00', 4, 13, NULL, '11 Org. Nahkoda, mengalami orang tenggelam di pantai di Perairan Selat Madura.', 28, 299.82, 5, 1, NULL, NULL, NULL, '2024-04-11 15:54:00', '2024-04-11 16:09:00', '2024-04-11 17:41:00', '2024-04-13 17:41:00', 19, 78, 67.58, NULL, 11, 0, 9, 2, NULL, 29, 6.25, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-02-16 09:20:00', 4, 14, NULL, '8 Org. Pengunjung Pantai, mengalami pendaki hilang di Perairan Selat Madura.', 30, 309.65, 5, 2, NULL, 'POL AIRUD Lamongan', NULL, '2023-02-16 12:20:00', '2023-02-16 12:56:00', '2023-02-16 13:30:00', '2023-02-16 18:30:00', 22, 113, 87.05, NULL, 8, 2, 6, 0, NULL, 31, 1.32, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2026-02-22 02:53:00', 5, 17, NULL, '5 Org. Pendaki, mengalami evakuasi medis laut di Perairan Pantai Selatan Malang.', 32, 47.45, 3, 5, 'Bpk. Yayak', 'Anggota BPBD Bangkalan', '081234567001', '2026-02-22 04:53:00', '2026-02-22 05:16:00', '2026-02-22 06:45:00', '2026-02-22 18:45:00', 21, 80, 78.25, NULL, 5, 0, 5, 0, NULL, 33, 1.35, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-06-23 14:25:00', 4, 13, NULL, '7 Org. Pendaki, mengalami orang tenggelam di pantai di Perairan Selat Bali, Banyuwangi.', 34, 211.13, 3, 6, 'Ibu Sri', 'Warga Sekitar', '081234567003', '2025-06-23 15:25:00', '2025-06-23 15:45:00', '2025-06-23 16:16:00', '2025-06-23 23:16:00', 27, 104, 50.96, NULL, 7, 5, 0, 2, NULL, 35, 9.42, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2026-01-13 21:05:00', 3, 12, NULL, '11 Org. Nahkoda, mengalami angin puting beliung di Perairan Ketapang, Sampang.', 36, 111.03, 4, 5, 'Bpk. Yayak', 'Anggota BPBD Bangkalan', '081234567001', '2026-01-14 01:05:00', '2026-01-14 01:27:00', '2026-01-14 02:23:00', '2026-01-15 22:23:00', 17, 121, 48.37, NULL, 11, 9, 1, 1, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', 37, 9.46, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-03-08 12:34:00', 2, 8, NULL, '12 Org. Nahkoda, mengalami pesawat hilang kontak di Perairan Keramaian Sumenep.', 38, 104.23, 8, 1, NULL, 'POL AIRUD Lamongan', NULL, '2023-03-08 16:34:00', '2023-03-08 17:25:00', '2023-03-08 18:36:00', NULL, 22, 25, 58.33, NULL, 12, 0, 0, 12, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-02-10 12:55:00', 3, 11, NULL, '11 Org. Nelayan, mengalami gempa bumi di Perairan Selat Madura.', 39, 71.02, 2, 5, 'Bpk. Hadi', 'Nelayan Setempat', '081234567004', '2025-02-10 15:55:00', '2025-02-10 16:32:00', '2025-02-10 18:25:00', '2025-02-11 04:25:00', 29, 59, 14.89, NULL, 11, 3, 1, 7, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', 40, 7.75, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-02-04 15:28:00', 3, 11, NULL, '2 Org. Penumpang Kapal, mengalami gempa bumi di Perairan Pantai Selatan Malang.', 41, 199.55, 8, 1, 'Bpk. Yayak', 'Anggota BPBD Bangkalan', '081234567001', '2025-02-04 18:28:00', '2025-02-04 18:47:00', '2025-02-04 20:29:00', '2025-02-06 12:29:00', 11, 135, 42.72, NULL, 2, 2, 0, 0, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', 42, 6.09, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2024-02-03 10:06:00', 5, 18, NULL, '5 Org. ABK Kapal Nelayan, mengalami pencarian korban khusus di Pantai Prigi, Trenggalek.', 43, 251.45, 3, 3, 'Bpk. Yayak', 'Anggota BPBD Bangkalan', '081234567001', '2024-02-03 16:06:00', '2024-02-03 16:30:00', '2024-02-03 17:34:00', NULL, 22, 53, NULL, 58.09, 5, 0, 0, 5, NULL, NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-04-10 11:43:00', 5, 18, NULL, '11 Org. Nahkoda, mengalami pencarian korban khusus di Bengawan Solo, Bojonegoro.', 44, 133.64, 7, 2, 'Bpk. Kamto', 'Anggota SATPOL AIR Polres Gresik', '081234567002', '2025-04-10 13:43:00', '2025-04-10 14:14:00', '2025-04-10 14:40:00', NULL, 13, 51, NULL, 29.35, 11, 0, 0, 11, NULL, NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2024-08-18 11:59:00', 1, 4, NULL, '11 Org. Pemancing, mengalami hilang kontak di Perairan Selatan Karang Jamuang.', 45, 330.26, 2, 3, 'Bpk. Kamto', 'Anggota SATPOL AIR Polres Gresik', '081234567002', '2024-08-18 14:59:00', '2024-08-18 15:20:00', '2024-08-18 17:11:00', '2024-08-19 15:11:00', 25, 55, 5.37, NULL, 11, 2, 2, 7, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', 46, 9.07, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2024-03-03 01:15:00', 4, 16, NULL, '5 Org. ABK Kapal Nelayan, mengalami terseret ombak di Perairan Keramaian Sumenep.', 47, 221.33, 1, 6, 'Bpk. Hadi', 'Nelayan Setempat', '081234567004', '2024-03-03 03:15:00', '2024-03-03 04:15:00', '2024-03-03 04:53:00', NULL, 17, 126, 39.77, NULL, 5, 0, 0, 5, NULL, NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-08-31 08:02:00', 2, 8, NULL, '6 Org. Penumpang Kapal, mengalami pesawat hilang kontak di Perairan Selat Bali, Banyuwangi.', 48, 287.02, 5, 1, NULL, 'POL AIRUD Lamongan', NULL, '2025-08-31 12:02:00', '2025-08-31 12:45:00', '2025-08-31 13:54:00', '2025-09-01 01:54:00', 18, 41, 34.33, NULL, 6, 3, 3, 0, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', 49, 8.24, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-09-13 16:24:00', 5, 17, NULL, '8 Org. Nahkoda, mengalami evakuasi medis laut di Pantai Prigi, Trenggalek.', 50, 348.32, 5, 6, 'Ibu Sri', 'Warga Sekitar', '081234567003', '2023-09-13 17:24:00', '2023-09-13 17:47:00', '2023-09-13 18:16:00', '2023-09-14 06:16:00', 20, 108, NULL, 48.82, 8, 7, 0, 1, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', 51, 3.07, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-01-24 20:49:00', 5, 18, NULL, '8 Org. Pemancing, mengalami pencarian korban khusus di Perairan Ketapang, Sampang.', 52, 290.65, 1, 4, NULL, NULL, NULL, '2023-01-24 23:49:00', '2023-01-25 00:45:00', '2023-01-25 01:43:00', NULL, 22, 96, 23.55, NULL, 8, 0, 0, 8, NULL, NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-07-25 01:36:00', 5, 17, NULL, '7 Org. PNP, mengalami evakuasi medis laut di Perairan Selat Bali, Banyuwangi.', 53, 355.24, 5, 5, NULL, NULL, NULL, '2023-07-25 02:36:00', '2023-07-25 02:59:00', '2023-07-25 03:31:00', NULL, 27, 113, 34.84, NULL, 7, 0, 0, 7, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-11-10 15:55:00', 1, 6, 'Kapal Kayu Warna Merah', '6 Org. Wisatawan, mengalami kapal karam di Depan Pelabuhan Petro Gresik.', 54, 69.22, 8, 5, 'Ibu Sri', 'Warga Sekitar', '081234567003', '2025-11-10 17:55:00', '2025-11-10 18:39:00', '2025-11-10 20:07:00', '2025-11-12 07:07:00', 17, 91, 55.69, NULL, 6, 2, 2, 2, NULL, 55, 3.05, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-11-30 06:48:00', 3, 11, NULL, '1 Org. Nahkoda, mengalami gempa bumi di Pantai Prigi, Trenggalek.', 56, NULL, 4, 5, NULL, NULL, NULL, '2025-12-01 06:48:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'Tdk. Melakukan Ops. SAR, cukup dilakukan pemapelan/koordinasi administratif ke instansi terkait.', NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-05-29 01:00:00', 3, 9, NULL, '6 Org. Pendaki, mengalami banjir di Perairan Selat Bali, Ketapang.', 57, 258.7, 8, 2, 'Bpk. Hadi', 'Nelayan Setempat', '081234567004', '2023-05-29 04:00:00', '2023-05-29 04:27:00', '2023-05-29 05:01:00', '2023-05-29 16:01:00', 10, 106, 59.05, NULL, 6, 5, 1, 0, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', 58, 1.84, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2025-09-28 22:23:00', 1, 5, 'KM Sinar Jaya', '4 Org. Nelayan, mengalami mati mesin di Perairan Keramaian Sumenep.', 59, 175.98, 3, 2, NULL, 'POL AIRUD Lamongan', NULL, '2025-09-29 02:23:00', '2025-09-29 02:45:00', '2025-09-29 04:32:00', NULL, 26, 134, 65.09, NULL, 4, 0, 0, 4, 'Cuaca buruk dan gelombang tinggi menghambat proses evakuasi.', NULL, NULL, 1);
INSERT INTO operasi_sar (waktu_kejadian, id_kategori, id_klasifikasi, nama_objek_terdampak, narasi_kejadian, id_lokasi_kejadian, radial_derajat, id_pos, id_sumber, nama_pelapor, instansi_pelapor, no_hp_pelapor, waktu_lapor, waktu_berangkat, waktu_tiba, waktu_selesai, waktu_siap_menit, waktu_tempuh_menit, jarak_laut_nm, jarak_darat_km, pob, jumlah_selamat, jumlah_meninggal, jumlah_hilang, kendala_pelaksanaan, id_lokasi_ditemukan, jarak_dari_lkk_km, id_admin_input) VALUES ('2023-10-03 12:33:00', 2, 7, NULL, '3 Org. Pemancing, mengalami pesawat jatuh di Perairan Kepulauan Sumenep.', 60, 11.6, 7, 5, 'Ibu Sri', 'Warga Sekitar', '081234567003', '2023-10-03 14:33:00', '2023-10-03 15:17:00', '2023-10-03 16:21:00', '2023-10-04 10:21:00', 23, 24, 69.36, NULL, 3, 1, 2, 0, NULL, 61, 4.52, 1);

-- Data korban per-orang
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (1, 'Budi Susanto', 'P', 32, 'Nahkoda', 'Brondong', 'Brondong', 'Lamongan', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (1, 'Hasbullah Susanto', 'L', 37, 'Pengunjung Pantai', 'Menang', 'Bangkalan', 'Malang', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (1, 'Ridho Setiawan', 'P', 20, 'Penumpang Kapal', 'Menang', 'Kediri Kota', 'Bojonegoro', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (1, 'Eko Saputra', 'L', 19, 'Pemancing', 'Brondong', 'Brondong', 'Lamongan', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (2, 'Tri', 'P', 40, 'Nelayan', 'Trogan', 'Brondong', 'Kediri', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (2, 'Slamet Firmansyah', 'P', 52, 'Pendaki', 'Kras', 'Brondong', 'Sampang', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (2, 'Andri Firmansyah', 'P', 20, 'Pemancing', 'Prancak', 'Klampis', 'Kediri', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (2, 'Rudi', 'P', 53, 'ABK Kapal Nelayan', 'Kras', 'Pagu', 'Bojonegoro', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (2, 'Fandi Firmansyah', 'P', 50, 'Pemancing', 'Prancak', 'Kediri Kota', 'Banyuwangi', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (4, 'Anggara Santoso', 'L', 19, 'Pemancing', 'Brondong', 'Bangkalan', 'Bangkalan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (4, 'Bambang Saputra', 'L', 47, 'PNP', 'Menang', 'Kediri Kota', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (4, 'Tri Firmansyah', 'L', 51, 'Nelayan', 'Brondong', 'Pagu', 'Sumenep', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (4, 'Tri Setiawan', 'L', 42, 'Pengunjung Pantai', 'Kras', 'Pagu', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (4, 'Bambang Wahyudi', 'L', 18, 'Pendaki', 'Tamanan', 'Bangkalan', 'Sampang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (4, 'Tri Santoso', 'P', 23, 'Pendaki', 'Trogan', 'Brondong', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (4, 'Slamet Setiawan', 'P', 50, 'ABK Kapal Nelayan', 'Kraton', 'Kediri Kota', 'Banyuwangi', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (4, 'Sutrisno Wahyudi', 'L', 30, 'Nahkoda', 'Kras', 'Pagu', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (6, 'Iwan Wijaya', 'L', 19, 'Penumpang Kapal', 'Brondong', 'Ketapang', 'Trenggalek', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (6, 'Andri Saputra', 'L', 30, 'Pengunjung Pantai', 'Menang', 'Klampis', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (6, 'Sutrisno Firmansyah', 'P', 54, 'Penumpang Kapal', 'Kraton', 'Kediri Kota', 'Banyuwangi', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (6, 'Wahyu', 'L', 23, 'Wisatawan', 'Prancak', 'Bangkalan', 'Banyuwangi', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (6, 'Andri Pratama', 'P', 53, 'PNP', 'Tamanan', 'Klampis', 'Trenggalek', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (8, 'Yusuf Pratama', 'L', 52, 'Wisatawan', 'Kraton', 'Bangkalan', 'Bojonegoro', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (8, 'Hariri Saputra', 'P', 42, 'Penumpang Kapal', 'Prancak', 'Pagu', 'Bojonegoro', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (8, 'Tri Pratama', 'L', 42, 'Pemancing', 'Ringin Anom', 'Ketapang', 'Sampang', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (8, 'Saiful Susanto', 'L', 36, 'Pengunjung Pantai', 'Prancak', 'Kediri Kota', 'Trenggalek', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (9, 'Hasbullah Santoso', 'P', 29, 'PNP', 'Trogan', 'Bangkalan', 'Bangkalan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (9, 'Slamet Wijaya', 'L', 44, 'Pendaki', 'Brondong', 'Kediri Kota', 'Sumenep', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (9, 'Nur Susanto', 'L', 24, 'Pemancing', 'Prancak', 'Pagu', 'Sampang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (9, 'Yohanes Firmansyah', 'P', 18, 'Penumpang Kapal', 'Brondong', 'Bangkalan', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (9, 'Andri Wijaya', 'P', 43, 'Penumpang Kapal', 'Kras', 'Ketapang', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (9, 'Eko Kurniawan', 'P', 43, 'Wisatawan', 'Brondong', 'Kediri Kota', 'Trenggalek', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (9, 'Joko Firmansyah', 'P', 55, 'PNP', 'Menang', 'Pagu', 'Lamongan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (9, 'Budi Pratama', 'L', 32, 'Pengunjung Pantai', 'Tamanan', 'Ketapang', 'Lamongan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (10, 'Hendra Kurniawan', 'L', 40, 'Pemancing', 'Prancak', 'Kediri Kota', 'Sumenep', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (10, 'Andri Wijaya', 'L', 18, 'Wisatawan', 'Kras', 'Brondong', 'Sampang', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (10, 'Fandi Saputra', 'P', 39, 'Wisatawan', 'Kras', 'Brondong', 'Lamongan', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (10, 'Nur Wahyudi', 'L', 37, 'PNP', 'Prancak', 'Kediri Kota', 'Bangkalan', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (10, 'Joko Wahyudi', 'L', 27, 'Pemancing', 'Trogan', 'Klampis', 'Kediri', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (10, 'Nur', 'L', 51, 'PNP', 'Ketapang Barat', 'Kediri Kota', 'Trenggalek', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (10, 'Joko Saputra', 'L', 53, 'ABK Kapal Nelayan', 'Trogan', 'Brondong', 'Lamongan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (12, 'Hanna Wijaya', 'P', 16, 'ABK Kapal Nelayan', 'Menang', 'Klampis', 'Sumenep', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (12, 'Budi Santoso', 'P', 52, 'Pengunjung Pantai', 'Ketapang Barat', 'Ketapang', 'Banyuwangi', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (12, 'Saiful Susanto', 'P', 37, 'Nelayan', 'Menang', 'Brondong', 'Trenggalek', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (12, 'Slamet Setiawan', 'L', 35, 'ABK Kapal Nelayan', 'Ringin Anom', 'Kediri Kota', 'Kediri', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (12, 'Tri Santoso', 'P', 32, 'Penumpang Kapal', 'Menang', 'Bangkalan', 'Sampang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (13, 'Anggara', 'L', 24, 'Nahkoda', 'Menang', 'Bangkalan', 'Sampang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (13, 'Yusuf Firmansyah', 'P', 53, 'PNP', 'Ringin Anom', 'Pagu', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (13, 'Hendra Wijaya', 'P', 52, 'Pendaki', 'Menang', 'Ketapang', 'Bojonegoro', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (13, 'Dana Ramadhan', 'L', 28, 'PNP', 'Menang', 'Kediri Kota', 'Lamongan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (13, 'Yohanes Santoso', 'L', 50, 'ABK Kapal Nelayan', 'Trogan', 'Bangkalan', 'Sumenep', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (13, 'Fandi Ramadhan', 'P', 33, 'Pemancing', 'Brondong', 'Brondong', 'Trenggalek', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (13, 'Budi Wijaya', 'L', 29, 'Wisatawan', 'Brondong', 'Pagu', 'Lamongan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (13, 'Ridho Santoso', 'L', 32, 'Nahkoda', 'Prancak', 'Bangkalan', 'Kediri', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (14, 'Anggara Wahyudi', 'L', 45, 'Penumpang Kapal', 'Ketapang Barat', 'Brondong', 'Kediri', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (14, 'Anggara Susanto', 'P', 20, 'Nelayan', 'Tamanan', 'Pagu', 'Gresik', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (14, 'Tarmin', 'L', 25, 'Pengunjung Pantai', 'Kras', 'Kediri Kota', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (14, 'Wahyu', 'P', 50, 'Pemancing', 'Ketapang Barat', 'Bangkalan', 'Gresik', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (16, 'Wahyu Pratama', 'P', 24, 'Nelayan', 'Ringin Anom', 'Pagu', 'Gresik', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (16, 'Tarmin Firmansyah', 'P', 44, 'Pengunjung Pantai', 'Brondong', 'Kediri Kota', 'Sampang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (16, 'Anggara Susanto', 'L', 41, 'Pemancing', 'Tamanan', 'Kediri Kota', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (16, 'Budi Susanto', 'P', 24, 'Nelayan', 'Kraton', 'Klampis', 'Banyuwangi', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (16, 'Anggara Saputra', 'L', 43, 'ABK Kapal Nelayan', 'Ringin Anom', 'Pagu', 'Bangkalan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (17, 'Wahyu Saputra', 'P', 42, 'Nahkoda', 'Brondong', 'Ketapang', 'Sumenep', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (17, 'Anggara', 'L', 25, 'Nahkoda', 'Prancak', 'Ketapang', 'Sumenep', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (17, 'Hafid', 'L', 46, 'Nahkoda', 'Brondong', 'Pagu', 'Trenggalek', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (17, 'Fandi Pratama', 'L', 44, 'Wisatawan', 'Ringin Anom', 'Klampis', 'Lamongan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (19, 'Veikko', 'P', 52, 'Pendaki', 'Tamanan', 'Bangkalan', 'Sampang', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (19, 'Nur Wahyudi', 'P', 54, 'PNP', 'Prancak', 'Kediri Kota', 'Malang', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (19, 'Hendra Pratama', 'P', 22, 'Nahkoda', 'Kraton', 'Bangkalan', 'Trenggalek', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (19, 'Nur Setiawan', 'L', 30, 'Penumpang Kapal', 'Trogan', 'Pagu', 'Malang', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (19, 'Saiful', 'P', 52, 'Nahkoda', 'Kras', 'Kediri Kota', 'Lamongan', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (19, 'Sutrisno Wijaya', 'P', 32, 'Pemancing', 'Tamanan', 'Klampis', 'Malang', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (19, 'Fandi Santoso', 'P', 21, 'Pengunjung Pantai', 'Ringin Anom', 'Kediri Kota', 'Gresik', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (19, 'Dana Susanto', 'P', 27, 'ABK Kapal Nelayan', 'Ketapang Barat', 'Bangkalan', 'Sampang', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (20, 'Reno Setiawan', 'L', 45, 'Nelayan', 'Tamanan', 'Ketapang', 'Bojonegoro', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (20, 'Yusuf Wijaya', 'L', 54, 'Pemancing', 'Ringin Anom', 'Brondong', 'Malang', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (20, 'Hanna Wahyudi', 'L', 45, 'Pendaki', 'Kras', 'Kediri Kota', 'Lamongan', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (20, 'Nur Wijaya', 'L', 20, 'Pengunjung Pantai', 'Trogan', 'Bangkalan', 'Kediri', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (20, 'Anton Ramadhan', 'P', 39, 'Penumpang Kapal', 'Menang', 'Pagu', 'Banyuwangi', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (21, 'Bambang Wahyudi', 'P', 53, 'Wisatawan', 'Tamanan', 'Bangkalan', 'Bojonegoro', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (21, 'Reno Santoso', 'L', 45, 'PNP', 'Prancak', 'Brondong', 'Banyuwangi', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (21, 'Saiful Setiawan', 'P', 51, 'PNP', 'Kras', 'Ketapang', 'Bojonegoro', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (21, 'Hafid', 'L', 53, 'Wisatawan', 'Kraton', 'Klampis', 'Trenggalek', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (21, 'Budi Pratama', 'P', 37, 'Pemancing', 'Trogan', 'Klampis', 'Bojonegoro', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (21, 'Veikko Susanto', 'L', 24, 'Pemancing', 'Prancak', 'Kediri Kota', 'Banyuwangi', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (21, 'Tri Susanto', 'P', 44, 'Pengunjung Pantai', 'Trogan', 'Brondong', 'Trenggalek', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (25, 'Andri Wahyudi', 'P', 21, 'Pengunjung Pantai', 'Prancak', 'Ketapang', 'Kediri', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (25, 'Dana Santoso', 'P', 43, 'Penumpang Kapal', 'Ringin Anom', 'Ketapang', 'Kediri', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (26, 'Wahyu Firmansyah', 'P', 36, 'Nahkoda', 'Ringin Anom', 'Bangkalan', 'Sumenep', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (26, 'Reno Saputra', 'L', 38, 'Wisatawan', 'Trogan', 'Klampis', 'Gresik', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (26, 'Joko Wijaya', 'L', 29, 'Nahkoda', 'Trogan', 'Bangkalan', 'Trenggalek', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (26, 'Bambang Setiawan', 'L', 36, 'Nahkoda', 'Kras', 'Klampis', 'Kediri', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (26, 'Yohanes Ramadhan', 'L', 43, 'Pemancing', 'Kras', 'Brondong', 'Sampang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (29, 'Reno Saputra', 'L', 48, 'Penumpang Kapal', 'Ringin Anom', 'Ketapang', 'Banyuwangi', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (29, 'Iwan Susanto', 'P', 17, 'Pendaki', 'Tamanan', 'Brondong', 'Bangkalan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (29, 'Saiful Setiawan', 'P', 30, 'ABK Kapal Nelayan', 'Tamanan', 'Klampis', 'Bangkalan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (29, 'Saiful Firmansyah', 'P', 26, 'Nelayan', 'Ketapang Barat', 'Kediri Kota', 'Kediri', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (29, 'Rudi Kurniawan', 'L', 44, 'Pemancing', 'Menang', 'Klampis', 'Bangkalan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (30, 'Wahyu Saputra', 'L', 20, 'Pengunjung Pantai', 'Menang', 'Brondong', 'Malang', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (30, 'Hafid Susanto', 'L', 43, 'Pengunjung Pantai', 'Ketapang Barat', 'Bangkalan', 'Gresik', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (30, 'Hafid Susanto', 'P', 55, 'Pemancing', 'Prancak', 'Kediri Kota', 'Sumenep', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (30, 'Saiful Firmansyah', 'L', 16, 'Nahkoda', 'Ketapang Barat', 'Bangkalan', 'Kediri', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (30, 'Hasbullah Santoso', 'P', 38, 'Pendaki', 'Kraton', 'Ketapang', 'Kediri', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (30, 'Veikko Wijaya', 'P', 38, 'Nelayan', 'Prancak', 'Ketapang', 'Kediri', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (31, 'Budi', 'L', 38, 'Penumpang Kapal', 'Brondong', 'Bangkalan', 'Sampang', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (31, 'Rudi Kurniawan', 'L', 46, 'Pemancing', 'Tamanan', 'Ketapang', 'Bojonegoro', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (31, 'Saiful Wijaya', 'L', 54, 'ABK Kapal Nelayan', 'Prancak', 'Brondong', 'Sumenep', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (31, 'Budi Wijaya', 'P', 41, 'ABK Kapal Nelayan', 'Trogan', 'Brondong', 'Lamongan', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (31, 'Fandi Wijaya', 'P', 23, 'Penumpang Kapal', 'Trogan', 'Klampis', 'Sumenep', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (31, 'Reno Wahyudi', 'L', 48, 'Nahkoda', 'Menang', 'Klampis', 'Kediri', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (31, 'Tarmin Santoso', 'P', 48, 'Wisatawan', 'Prancak', 'Brondong', 'Sampang', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (31, 'Hanna Firmansyah', 'P', 23, 'Wisatawan', 'Ringin Anom', 'Bangkalan', 'Banyuwangi', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (32, 'Yohanes Wijaya', 'P', 45, 'Nelayan', 'Brondong', 'Brondong', 'Bojonegoro', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (32, 'Andri Saputra', 'P', 37, 'Pendaki', 'Trogan', 'Brondong', 'Banyuwangi', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (32, 'Ridho Setiawan', 'P', 30, 'Nelayan', 'Prancak', 'Brondong', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (32, 'Slamet Kurniawan', 'L', 18, 'Wisatawan', 'Kras', 'Ketapang', 'Sumenep', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (32, 'Slamet Kurniawan', 'P', 51, 'Pengunjung Pantai', 'Brondong', 'Klampis', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (32, 'Reno Wijaya', 'P', 34, 'Nelayan', 'Kraton', 'Bangkalan', 'Sumenep', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (32, 'Reno Wijaya', 'L', 28, 'Pengunjung Pantai', 'Kraton', 'Bangkalan', 'Trenggalek', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (32, 'Nur Ramadhan', 'P', 33, 'Penumpang Kapal', 'Kraton', 'Bangkalan', 'Sumenep', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (33, 'Hafid Firmansyah', 'P', 47, 'Pemancing', 'Kraton', 'Bangkalan', 'Kediri', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (33, 'Budi Saputra', 'P', 48, 'Nelayan', 'Trogan', 'Ketapang', 'Banyuwangi', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (33, 'Andri Saputra', 'P', 25, 'Pendaki', 'Menang', 'Ketapang', 'Gresik', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (33, 'Reno Firmansyah', 'P', 51, 'Wisatawan', 'Ketapang Barat', 'Bangkalan', 'Gresik', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (33, 'Tarmin', 'L', 41, 'Wisatawan', 'Kraton', 'Ketapang', 'Malang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (33, 'Anton', 'L', 18, 'Nelayan', 'Trogan', 'Ketapang', 'Bojonegoro', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (33, 'Joko Susanto', 'L', 30, 'Pemancing', 'Prancak', 'Klampis', 'Bangkalan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (34, 'Nur Saputra', 'P', 37, 'Penumpang Kapal', 'Menang', 'Brondong', 'Lamongan', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (34, 'Anggara', 'P', 40, 'Pengunjung Pantai', 'Trogan', 'Brondong', 'Bangkalan', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (34, 'Wahyu Setiawan', 'P', 43, 'Wisatawan', 'Ketapang Barat', 'Klampis', 'Sampang', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (34, 'Sutrisno Firmansyah', 'P', 50, 'Wisatawan', 'Trogan', 'Bangkalan', 'Bojonegoro', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (34, 'Agus Ramadhan', 'L', 30, 'Pemancing', 'Ringin Anom', 'Klampis', 'Sampang', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (34, 'Dana Setiawan', 'P', 36, 'Nelayan', 'Prancak', 'Kediri Kota', 'Kediri', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (36, 'Sutrisno Susanto', 'P', 20, 'Pendaki', 'Prancak', 'Klampis', 'Kediri', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (36, 'Nur Saputra', 'L', 15, 'Wisatawan', 'Kras', 'Klampis', 'Malang', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (36, 'Joko Pratama', 'P', 34, 'Pemancing', 'Menang', 'Kediri Kota', 'Gresik', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (36, 'Budi Santoso', 'L', 22, 'Nelayan', 'Menang', 'Klampis', 'Sumenep', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (36, 'Veikko Firmansyah', 'P', 22, 'Wisatawan', 'Tamanan', 'Ketapang', 'Sampang', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (36, 'Slamet Kurniawan', 'P', 24, 'Nelayan', 'Tamanan', 'Pagu', 'Banyuwangi', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (37, 'Fandi Ramadhan', 'L', 50, 'Nelayan', 'Menang', 'Kediri Kota', 'Bangkalan', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (37, 'Bobby Pratama', 'L', 28, 'ABK Kapal Nelayan', 'Kraton', 'Pagu', 'Gresik', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (37, 'Budi Setiawan', 'L', 19, 'Nelayan', 'Kraton', 'Brondong', 'Sumenep', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (37, 'Yohanes Kurniawan', 'P', 38, 'Pendaki', 'Ketapang Barat', 'Pagu', 'Sumenep', 'Hilang');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (38, 'Slamet Wahyudi', 'P', 43, 'PNP', 'Ringin Anom', 'Klampis', 'Bangkalan', 'Selamat');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (38, 'Andri Firmansyah', 'P', 29, 'Pengunjung Pantai', 'Tamanan', 'Klampis', 'Trenggalek', 'Meninggal Dunia');
INSERT INTO korban (id_operasi, nama, jenis_kelamin, usia, pekerjaan, alamat_desa, alamat_kecamatan, alamat_kabupaten, status) VALUES (38, 'Eko Kurniawan', 'L', 41, 'Wisatawan', 'Menang', 'Bangkalan', 'Banyuwangi', 'Meninggal Dunia');

-- Instansi & jumlah personel per operasi
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (1, 2, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (2, 11, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (2, 6, 5);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (3, 9, 3);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (4, 7, 1);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (5, 10, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (6, 8, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (6, 5, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (6, 1, 5);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (7, 12, 3);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (7, 3, 3);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (7, 4, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (8, 5, 6);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (8, 11, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (8, 7, 5);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (9, 3, 4);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (10, 1, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (10, 5, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (10, 10, 4);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (11, 5, 8);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (11, 10, 8);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (11, 9, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (12, 4, 3);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (12, 6, 5);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (13, 10, 5);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (13, 12, 8);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (14, 6, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (14, 2, 1);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (15, 2, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (15, 4, 8);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (16, 3, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (16, 7, 8);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (16, 12, 5);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (17, 6, 5);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (17, 10, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (18, 2, 5);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (18, 11, 8);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (18, 1, 1);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (19, 11, 1);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (19, 10, 6);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (19, 1, 4);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (20, 7, 4);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (20, 2, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (20, 11, 8);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (21, 6, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (21, 10, 1);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (21, 11, 3);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (22, 5, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (22, 6, 1);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (23, 8, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (23, 6, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (23, 2, 4);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (24, 10, 8);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (24, 12, 6);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (25, 6, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (25, 5, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (26, 10, 8);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (26, 5, 4);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (27, 8, 3);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (27, 9, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (28, 12, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (28, 10, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (28, 9, 5);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (29, 1, 6);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (30, 6, 5);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (30, 7, 4);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (30, 12, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (31, 3, 3);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (31, 10, 3);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (31, 11, 6);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (32, 5, 6);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (33, 6, 3);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (33, 7, 7);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (34, 9, 3);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (35, 3, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (35, 1, 2);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (36, 9, 4);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (36, 11, 4);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (37, 11, 3);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (38, 12, 8);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (38, 3, 1);
INSERT INTO operasi_instansi (id_operasi, id_instansi, jumlah_personel) VALUES (38, 7, 6);

-- Peralatan per operasi
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (1, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (1, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (1, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (1, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (1, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (2, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (2, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (2, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (2, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (2, 6, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (3, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (3, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (3, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (3, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (4, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (4, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (4, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (4, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (5, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (5, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (5, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (5, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (5, 6, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (5, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (6, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (6, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (6, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (6, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (7, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (7, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (7, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (7, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (8, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (8, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (8, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (8, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (8, 6, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (8, 5, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (9, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (9, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (9, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (9, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (9, 6, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (10, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (10, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (10, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (10, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (11, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (11, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (11, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (11, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (11, 7, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (11, 6, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (12, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (12, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (12, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (12, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (13, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (13, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (13, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (13, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (14, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (14, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (14, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (14, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (14, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (14, 6, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (15, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (15, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (15, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (15, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (16, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (16, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (16, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (16, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (16, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (17, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (17, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (17, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (17, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (17, 7, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (17, 6, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (18, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (18, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (18, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (18, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (18, 7, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (18, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (19, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (19, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (19, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (19, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (20, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (20, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (20, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (20, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (21, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (21, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (21, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (21, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (22, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (22, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (22, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (22, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (22, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (23, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (23, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (23, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (23, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (23, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (24, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (24, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (24, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (24, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (24, 7, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (24, 5, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (25, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (25, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (25, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (25, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (25, 5, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (26, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (26, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (26, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (26, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (26, 6, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (26, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (27, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (27, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (27, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (27, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (28, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (28, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (28, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (28, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (29, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (29, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (29, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (29, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (29, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (30, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (30, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (30, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (30, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (31, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (31, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (31, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (31, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (31, 5, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (31, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (32, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (32, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (32, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (32, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (32, 7, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (33, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (33, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (33, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (33, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (33, 6, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (33, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (34, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (34, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (34, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (34, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (34, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (36, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (36, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (36, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (36, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (36, 5, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (36, 7, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (37, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (37, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (37, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (37, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (37, 7, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (37, 5, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (38, 1, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (38, 2, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (38, 3, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (38, 4, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (38, 8, 1);
INSERT INTO operasi_peralatan (id_operasi, id_peralatan, jumlah) VALUES (38, 7, 1);
