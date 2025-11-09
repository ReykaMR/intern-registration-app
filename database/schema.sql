-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 21, 2025 at 01:25 PM
-- Server version: 8.0.30
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `intern_registration`
--

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','success','error') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `related_entity` enum('registration','payment','selection','placement') DEFAULT NULL,
  `related_entity_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `registration_id` int DEFAULT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `amount_paid` decimal(15,2) DEFAULT '0.00',
  `payment_method` enum('transfer','cash','credit_card') DEFAULT 'transfer',
  `bank_name` varchar(100) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `status` enum('pending','installment_1','installment_2','installment_3','installment_4','installment_5','installment_6','paid','overdue','cancelled') DEFAULT 'pending',
  `due_date` date DEFAULT NULL,
  `proof_image` varchar(255) DEFAULT NULL,
  `payment_date` timestamp NULL DEFAULT NULL,
  `verified_by` int DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `receipt_number` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_manual_invoice` tinyint(1) DEFAULT '0',
  `installment_amounts` json DEFAULT NULL,
  `current_installment_number` int DEFAULT '0',
  `next_due_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_history`
--

CREATE TABLE `payment_history` (
  `id` int NOT NULL,
  `payment_id` int DEFAULT NULL,
  `old_status` enum('pending','installment_1','installment_2','installment_3','installment_4','installment_5','installment_6','paid','overdue','cancelled') DEFAULT NULL,
  `new_status` enum('pending','installment_1','installment_2','installment_3','installment_4','installment_5','installment_6','paid','overdue','cancelled') DEFAULT NULL,
  `amount_changed` decimal(10,2) DEFAULT NULL,
  `notes` text,
  `changed_by` int DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `old_amount_paid` decimal(15,2) DEFAULT NULL,
  `new_amount_paid` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `placement_status`
--

CREATE TABLE `placement_status` (
  `id` int NOT NULL,
  `registration_id` int DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `status` enum('proses','lolos','ditempatkan') DEFAULT 'proses',
  `placement_date` date DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

CREATE TABLE `programs` (
  `id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `requirements` text,
  `schedule` text,
  `duration` varchar(100) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `current_participants` int DEFAULT '0',
  `status` enum('active','inactive','full') DEFAULT 'active',
  `contact_info` text,
  `registration_deadline` date DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `location` varchar(255) DEFAULT 'Jakarta, Indonesia & Jepang',
  `training_cost` decimal(10,2) DEFAULT '16000000.00',
  `training_fee_details` text,
  `departure_cost` decimal(10,2) DEFAULT '30000000.00',
  `departure_fee_details` text,
  `installment_plan` varchar(20) DEFAULT 'none',
  `bridge_fund` varchar(255) DEFAULT 'Tersedia (Jaminan dari perusahaan pengirim)',
  `timeline_text` text,
  `requirements_text` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`id`, `category_id`, `name`, `description`, `requirements`, `schedule`, `duration`, `capacity`, `current_participants`, `status`, `contact_info`, `registration_deadline`, `start_date`, `end_date`, `created_at`, `updated_at`, `location`, `training_cost`, `training_fee_details`, `departure_cost`, `departure_fee_details`, `installment_plan`, `bridge_fund`, `timeline_text`, `requirements_text`) VALUES
(1, 1, 'Program Regular', 'Skema terbaik untuk persiapan intensif dan komprehensif.', '- Ijazah Minimal SMA/Sederajat\n- Sehat Jasmani & Rohani\n- Usia Maksimal 30 Tahun', 'Senin-Jumat, 09:00-17:00', '4 bulan', 20, 0, 'active', 'Email: info@fitalenta.co.id\nTelp: 0811 1011 9273\nAlamat: Gedung Science Techno Park ITB. Jl. Ganesa No.15E, Lb. Siliwangi, Kec. Coblong, Bandung 40132', '2024-12-31', '2024-02-01', '2024-04-30', '2025-10-02 07:08:29', '2025-10-21 05:31:44', 'Asrama Depok', '16000000.00', 'Biaya administrasi pendaftaran.\nSeragam pelatihan lengkap.\nModul, buku pelajaran bahasa Jepang, dan materi pendukung lainnya.\nAkses penuh ke fasilitas kelas dan laboratorium bahasa.\nFasilitas asrama (akomodasi dan utilitas dasar selama periode pelatihan).\nPendampingan dan bimbingan belajar intensif.', '30000000.00', 'Tiket pesawat ke Jepang (sekali jalan).\nPengurusan Visa Kerja & dokumen keberangkatan.\nAsuransi perjalanan dan asuransi kesehatan awal di Jepang.\nBiaya penempatan kerja di Jepang (termasuk administrasi penyaluran).\nPendampingan proses keberangkatan hingga penyaluran ke perusahaan di Jepang.', '4_installments', 'Tersedia (Jaminan dari perusahaan pengirim)', 'Bulan 1: Pelatihan Dasar Bahasa Jepang (Hiragana & Katakana)\r\nBulan 2: Pengembangan Kosakata dan Tata Bahasa\r\nBulan 3: Budaya Jepang dan Etika Kerja\r\nBulan 4: Persiapan Akhir dan Evaluasi', 'Minimal 18 tahun dan Maksimal 30 Tahun.\nMinimal Ijazah SMA/SMK Sederajat.\nSehat Jasmani & Rohani (Wajib dibuktikan dengan Surat Keterangan Sehat dari fasilitas kesehatan).\nTidak memiliki catatan kriminal (Wajib melampirkan Surat Keterangan Catatan Kepolisian/SKCK).\nBersedia mengikuti seluruh rangkaian pelatihan dan aturan asrama hingga selesai.'),
(2, 2, 'Program Hybrid', 'Fleksibilitas pelatihan virtual dengan pemantapan di asrama.', '- Ijazah Minimal SMA/Sederajat\n- Sehat Jasmani & Rohani\n- Usia Maksimal 30 Tahun', 'Senin-Jumat, 09:00-17:00', '6 bulan', 15, 0, 'active', 'Email: info@fitalenta.co.id\nTelp: 0811 1011 9273\nAlamat: Gedung Science Techno Park ITB. Jl. Ganesa No.15E, Lb. Siliwangi, Kec. Coblong, Bandung 40132', '2024-12-31', '2024-02-01', '2024-04-30', '2025-10-02 07:08:29', '2025-10-21 05:31:54', '-', '7150000.00', 'Biaya administrasi pendaftaran.\nAkses ke platform pembelajaran virtual (LMS).\nModul & buku pelajaran digital bahasa Jepang. \nSesi live interaction & bimbingan virtual.\nFasilitas asrama (akomodasi & utilitas dasar) selama 1 bulan pemantapan luring.\nPendampingan & bimbingan belajar.', '30000000.00', 'Tiket pesawat ke Jepang Visa & dokumen keberangkatan \nAsuransi perjalanan & kesehatan \nBiaya penempatan kerja di Jepang\nPendampingan proses keberangkatan hingga penyaluran', '6_installments', 'Tersedia (Jaminan dari perusahaan pengirim)', 'Minggu 1-6: Pelatihan Dasar Bahasa Jepang (Virtual: Penguasaan Hiragana & Katakana).\nMinggu 7-12: Pengembangan Kosakata dan Tata Bahasa Lanjutan (Virtual: Fokus N5 dan Komunikasi Dasar).\nMinggu 13-20: Bahasa Lanjutan, Evaluasi Virtual, dan Persiapan Administratif (Virtual: Fokus N4, Self-Study, dan Pre-screening dokumen penempatan).\nMinggu 21-24: Pemantapan Budaya, Kesiapan Fisik/Mental, dan Penyaluran (Luring di Asrama: Etika Kerja, Simulasi Wawancara, Ujian Akhir, dan Proses Keberangkatan).', 'Minimal 18 tahun dan Maksimal 30 Tahun.\nMinimal Ijazah SMA/SMK Sederajat.\nSehat Jasmani & Rohani (Wajib dibuktikan dengan Surat Keterangan Sehat dari fasilitas kesehatan).\nTidak memiliki catatan kriminal (Wajib melampirkan Surat Keterangan Catatan Kepolisian/SKCK).\nBersedia mengikuti seluruh rangkaian pelatihan dan aturan asrama hingga selesai.'),
(3, 3, 'Program Fast Track', 'Jalur cepat untuk yang sudah memiliki sertifikat Noryoku Shiken N4 dan Specified Skilled Worker', '- Mahasiswa Statistika/TI/Matematika\n- Menguasai dasar statistik\n- Familiar dengan Python/R', 'Senin-Jumat, 09:00-17:00', '1 bulan', 12, 0, 'active', 'Email: info@fitalenta.co.id\nTelp: 0811 1011 9273\nAlamat: Gedung Science Techno Park ITB. Jl. Ganesa No.15E, Lb. Siliwangi, Kec. Coblong, Bandung 40132', '2024-12-31', '2024-02-01', '2024-05-31', '2025-10-02 07:08:29', '2025-10-21 11:07:39', 'Jakarta, Indonesia & Jepang', '4000000.00', 'Biaya administrasi dan pendaftaran\nVerifikasi sertifikat N4 / Sertifikat Keahlian (SSW)\nOrientasi budaya kerja dan etika bisnis (1 bulan) \nKonsultasi persiapan keberangkatan dan wawancara \nAkses ke fasilitas kelas/ruangan briefing', '30000000.00', 'Tiket pesawat ke Jepang Visa dan dokumen keberangkatan \nAsuransi perjalanan dan kesehatan awal\nBiaya penempatan kerja di Jepang\nProcessing fee administrasi penyaluran', 'none', 'Tersedia (Jaminan dari perusahaan pengirim)', 'Minggu 1: Verifikasi Dokumen, Sertifikat N4/SSW, dan Keahlian Teknis \nMinggu 2: Orientasi Budaya Kerja, Etika Jepang (Horenso), dan Simulasi Wawancara \nMinggu 3: Pengurusan Dokumen Administrasi Keberangkatan dan Visa\nMinggu 4: Briefing Akhir, Matching Perusahaan, dan Pemberangkatan', 'Memiliki sertifikat Noryoku Shiken N4\nMemiliki sertifikat Specified Skilled Worker (SSW)\nMinimal 18 tahun dan Maksimal 30 Tahun.\nMinimal Ijazah SMA/SMK Sederajat.\nSehat Jasmani & Rohani (Wajib dibuktikan dengan Surat Keterangan Sehat dari fasilitas kesehatan).\nTidak memiliki catatan kriminal (Wajib melampirkan Surat Keterangan Catatan Kepolisian/SKCK).\nBersedia mengikuti seluruh rangkaian pelatihan dan aturan asrama hingga selesai.');

-- --------------------------------------------------------

--
-- Table structure for table `program_categories`
--

CREATE TABLE `program_categories` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `program_categories`
--

INSERT INTO `program_categories` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'Regular', 'Program magang di bidang teknologi informasi dan pengembangan software', '2025-10-02 07:08:29'),
(2, 'Hybrid', 'Program magang di bidang analisis data dan machine learning', '2025-10-02 07:08:29'),
(3, 'Fast Track', 'Program magang di bidang pemasaran digital dan media sosial', '2025-10-02 07:08:29');

-- --------------------------------------------------------

--
-- Table structure for table `registrations`
--

CREATE TABLE `registrations` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  `registration_status` enum('menunggu','lolos','tidak_lolos') DEFAULT 'menunggu',
  `registration_code` varchar(50) NOT NULL,
  `selection_notes` text,
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `nik` varchar(20) DEFAULT NULL,
  `gender` enum('L','P') DEFAULT NULL,
  `birth_place` varchar(100) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `last_education` varchar(50) DEFAULT NULL,
  `major` varchar(255) DEFAULT NULL,
  `education_institution` varchar(255) DEFAULT NULL,
  `current_activity` varchar(50) DEFAULT NULL,
  `marital_status` varchar(50) DEFAULT NULL,
  `parent_phone` varchar(20) DEFAULT NULL,
  `parent_relationship` varchar(20) DEFAULT NULL,
  `ktp_province_code` varchar(10) DEFAULT NULL,
  `ktp_province_name` varchar(100) DEFAULT NULL,
  `ktp_city_code` varchar(20) DEFAULT NULL,
  `ktp_city_name` varchar(100) DEFAULT NULL,
  `ktp_address` text,
  `domicile_province_code` varchar(10) DEFAULT NULL,
  `domicile_province_name` varchar(100) DEFAULT NULL,
  `domicile_city_code` varchar(20) DEFAULT NULL,
  `domicile_city_name` varchar(100) DEFAULT NULL,
  `domicile_address` text,
  `photo_path` varchar(255) DEFAULT NULL,
  `n4_certificate_path` varchar(255) DEFAULT NULL,
  `ssw_certificate_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `registration_status_history`
--

CREATE TABLE `registration_status_history` (
  `id` int NOT NULL,
  `registration_id` int DEFAULT NULL,
  `old_status` enum('menunggu','lolos','tidak_lolos') DEFAULT NULL,
  `new_status` enum('menunggu','lolos','tidak_lolos') DEFAULT NULL,
  `notes` text,
  `changed_by` int DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `selection_status`
--

CREATE TABLE `selection_status` (
  `id` int NOT NULL,
  `registration_id` int DEFAULT NULL,
  `status` enum('menunggu','lolos','tidak_lolos') DEFAULT 'menunggu',
  `notes` text,
  `evaluated_by` int DEFAULT NULL,
  `evaluated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `user_type` enum('participant','admin') DEFAULT 'participant',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `birth_place` varchar(100) DEFAULT NULL,
  `birth_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `full_name`, `phone`, `address`, `user_type`, `created_at`, `updated_at`, `birth_place`, `birth_date`) VALUES
(1, 'admin@gmail.com', '$2a$12$xJy3WDCbb37u0BCUepQTk.QL7A7B8hrka0.ZH6gh1NwN3PljrMufG', 'Admin Fitalenta', '081312557168', '', 'admin', '2025-10-02 07:08:29', '2025-10-21 12:19:54', NULL, NULL),
(5, 'user1@gmail.com', '$2b$12$tEe5PStStL4/aqC56ZSIX.ytdeaGPveMAOGxO3BC.Df45ZjEoag2a', 'User 1', '', '', 'participant', '2025-10-21 12:21:55', '2025-10-21 12:21:55', NULL, NULL),
(6, 'user2@gmail.com', '$2b$12$Im8LbTmbb4mYZaaeZCwqY.e00xuELRmGH01eSJkd2kcLccFWnh/t6', 'User 2', '', '', 'participant', '2025-10-21 12:22:54', '2025-10-21 12:22:54', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD KEY `registration_id` (`registration_id`),
  ADD KEY `verified_by` (`verified_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_invoice` (`invoice_number`),
  ADD KEY `idx_receipt` (`receipt_number`);

--
-- Indexes for table `payment_history`
--
ALTER TABLE `payment_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `changed_by` (`changed_by`),
  ADD KEY `idx_payment` (`payment_id`);

--
-- Indexes for table `placement_status`
--
ALTER TABLE `placement_status`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_registration` (`registration_id`);

--
-- Indexes for table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_category` (`category_id`);

--
-- Indexes for table `program_categories`
--
ALTER TABLE `program_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `registrations`
--
ALTER TABLE `registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `registration_code` (`registration_code`),
  ADD UNIQUE KEY `unique_user_program` (`user_id`,`program_id`),
  ADD KEY `idx_program` (`program_id`),
  ADD KEY `idx_registration_code` (`registration_code`);

--
-- Indexes for table `registration_status_history`
--
ALTER TABLE `registration_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `registration_id` (`registration_id`),
  ADD KEY `changed_by` (`changed_by`);

--
-- Indexes for table `selection_status`
--
ALTER TABLE `selection_status`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluated_by` (`evaluated_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_registration` (`registration_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_user_type` (`user_type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payment_history`
--
ALTER TABLE `payment_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `placement_status`
--
ALTER TABLE `placement_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `programs`
--
ALTER TABLE `programs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `program_categories`
--
ALTER TABLE `program_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `registrations`
--
ALTER TABLE `registrations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `registration_status_history`
--
ALTER TABLE `registration_status_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `selection_status`
--
ALTER TABLE `selection_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `payment_history`
--
ALTER TABLE `payment_history`
  ADD CONSTRAINT `payment_history_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `placement_status`
--
ALTER TABLE `placement_status`
  ADD CONSTRAINT `placement_status_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `programs`
--
ALTER TABLE `programs`
  ADD CONSTRAINT `programs_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `program_categories` (`id`);

--
-- Constraints for table `registrations`
--
ALTER TABLE `registrations`
  ADD CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `registrations_ibfk_2` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `registration_status_history`
--
ALTER TABLE `registration_status_history`
  ADD CONSTRAINT `registration_status_history_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `registration_status_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `selection_status`
--
ALTER TABLE `selection_status`
  ADD CONSTRAINT `selection_status_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `selection_status_ibfk_2` FOREIGN KEY (`evaluated_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
