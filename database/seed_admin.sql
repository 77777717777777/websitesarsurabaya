-- =====================================================================
-- SEED: akun admin pertama
-- Jalankan SETELAH database/schema.sql (tabel `admin` sudah harus ada).
--
-- Username: admin
-- Password: admin123  (WAJIB diganti sebelum dipakai di produksi -- lihat
-- README.md bagian "Login Admin Pertama Kali")
-- =====================================================================

INSERT INTO `admin` (`username`, `password`, `nama_lengkap`, `status`) VALUES
('admin', 'scrypt:32768:8:1$Gxh7z3zl9QmVuj0E$285591be9eebda714f50fd5838130e606a57772b4348293e6870f10bbd03d42abd97e432afebe5fc23a484626abbec901a7a6912695270ea1c6793216415c45e', 'Administrator', 'aktif');
