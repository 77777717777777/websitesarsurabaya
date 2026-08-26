-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: sar_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `kejadian_sar`
--

DROP TABLE IF EXISTS `kejadian_sar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kejadian_sar` (
  `no_urut` bigint(20) NOT NULL,
  `tahun` bigint(20) DEFAULT NULL,
  `bulan` text DEFAULT NULL,
  `bulan_angka` tinyint(4) DEFAULT NULL,
  `kategori` text DEFAULT NULL,
  `klasifikasi` text DEFAULT NULL,
  `kategori_kejadian` text DEFAULT NULL,
  `jenis_kecelakaan` text DEFAULT NULL,
  `posisi_koordinat_area` text DEFAULT NULL,
  `koordinat_lkk_teks` text DEFAULT NULL,
  `tipe_lkk` text DEFAULT NULL,
  `latitude_lkk` double DEFAULT NULL,
  `longitude_lkk` double DEFAULT NULL,
  `status_operasi` enum('Dilaksanakan','Tidak Dilaksanakan') DEFAULT NULL,
  `waktu_kejadian` datetime DEFAULT NULL,
  `waktu_lapor` datetime DEFAULT NULL,
  `rentang_waktu` int(11) DEFAULT NULL COMMENT 'durasi dalam menit',
  `waktu_berangkat` datetime DEFAULT NULL,
  `waktu_tiba` datetime DEFAULT NULL,
  `waktu_selesai` datetime DEFAULT NULL,
  `jarak` text DEFAULT NULL,
  `waktu_siap` double DEFAULT NULL,
  `waktu_tempuh` text DEFAULT NULL,
  `waktu_tempuh_menit` double DEFAULT NULL,
  `pob` int(11) DEFAULT NULL,
  `s_org` int(11) DEFAULT NULL,
  `md_org` int(11) DEFAULT NULL,
  `h_org` int(11) DEFAULT NULL,
  `instansi_jml_person` text DEFAULT NULL,
  `peralatan` text DEFAULT NULL,
  `sumber_berita` text DEFAULT NULL,
  `kendala_pelaksanaan_ops_sar` text DEFAULT NULL,
  `lokasi_ditemukan` text DEFAULT NULL,
  `koordinat_ditemukan_teks` text DEFAULT NULL,
  `tipe_ditemukan` text DEFAULT NULL,
  `latitude_ditemukan` double DEFAULT NULL,
  `longitude_ditemukan` double DEFAULT NULL,
  `lainlain` text DEFAULT NULL,
  `biaya_rp` text DEFAULT NULL,
  `aksi` text DEFAULT NULL,
  `wilayah_mapped` text DEFAULT NULL,
  `durasi_operasi_hari` double DEFAULT NULL,
  PRIMARY KEY (`no_urut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kejadian_sar_backup`
--

DROP TABLE IF EXISTS `kejadian_sar_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kejadian_sar_backup` (
  `no_urut` bigint(20) DEFAULT NULL,
  `tahun` bigint(20) DEFAULT NULL,
  `bulan` text DEFAULT NULL,
  `kategori` text DEFAULT NULL,
  `klasifikasi` text DEFAULT NULL,
  `kategori_kejadian` text DEFAULT NULL,
  `jenis_kecelakaan` text DEFAULT NULL,
  `posisi_koordinat_area` text DEFAULT NULL,
  `koordinat_lkk_teks` text DEFAULT NULL,
  `tipe_lkk` text DEFAULT NULL,
  `latitude_lkk` double DEFAULT NULL,
  `longitude_lkk` double DEFAULT NULL,
  `status_operasi` text DEFAULT NULL,
  `waktu_kejadian` datetime DEFAULT NULL,
  `waktu_lapor` datetime DEFAULT NULL,
  `rentang_waktu` text DEFAULT NULL,
  `waktu_berangkat` text DEFAULT NULL,
  `waktu_tiba` text DEFAULT NULL,
  `waktu_selesai` text DEFAULT NULL,
  `jarak` text DEFAULT NULL,
  `waktu_siap` double DEFAULT NULL,
  `waktu_tempuh` text DEFAULT NULL,
  `waktu_tempuh_menit` double DEFAULT NULL,
  `pob` text DEFAULT NULL,
  `s_org` text DEFAULT NULL,
  `md_org` text DEFAULT NULL,
  `h_org` text DEFAULT NULL,
  `instansi_jml_person` text DEFAULT NULL,
  `peralatan` text DEFAULT NULL,
  `sumber_berita` text DEFAULT NULL,
  `kendala_pelaksanaan_ops_sar` text DEFAULT NULL,
  `lokasi_ditemukan` text DEFAULT NULL,
  `koordinat_ditemukan_teks` text DEFAULT NULL,
  `tipe_ditemukan` text DEFAULT NULL,
  `latitude_ditemukan` double DEFAULT NULL,
  `longitude_ditemukan` double DEFAULT NULL,
  `lainlain` text DEFAULT NULL,
  `biaya_rp` text DEFAULT NULL,
  `aksi` text DEFAULT NULL,
  `wilayah_mapped` text DEFAULT NULL,
  `durasi_operasi_hari` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-26 11:58:03
