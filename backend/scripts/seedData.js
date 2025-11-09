import bcrypt from "bcryptjs";
import db from "../config/database.js";

const seedData = async () => {
  let connection;
  try {
    console.log("Seeding database with initial data...");

    connection = db.promise();
    await connection.execute("SELECT 1");
    console.log("Database connection established");

    const adminPassword = await bcrypt.hash("admin", 12);
    const user1Password = await bcrypt.hash("user123", 12);
    const user2Password = await bcrypt.hash("user321", 12);

    console.log("Clearing existing data...");

    // Clear data in correct order to avoid foreign key constraints
    await connection.execute("DELETE FROM payment_history");
    await connection.execute("DELETE FROM payments");
    await connection.execute("DELETE FROM placement_status");
    await connection.execute("DELETE FROM selection_status");
    await connection.execute("DELETE FROM registration_status_history");
    await connection.execute("DELETE FROM registrations");
    await connection.execute("DELETE FROM notifications");
    await connection.execute("DELETE FROM programs");
    await connection.execute("DELETE FROM program_categories");
    await connection.execute("DELETE FROM users WHERE id > 0");

    // Reset auto increment
    await connection.execute("ALTER TABLE users AUTO_INCREMENT = 1");
    await connection.execute("ALTER TABLE program_categories AUTO_INCREMENT = 1");
    await connection.execute("ALTER TABLE programs AUTO_INCREMENT = 1");
    await connection.execute("ALTER TABLE registrations AUTO_INCREMENT = 1");
    await connection.execute("ALTER TABLE payments AUTO_INCREMENT = 1");
    await connection.execute("ALTER TABLE selection_status AUTO_INCREMENT = 1");
    await connection.execute("ALTER TABLE placement_status AUTO_INCREMENT = 1");
    await connection.execute("ALTER TABLE notifications AUTO_INCREMENT = 1");
    await connection.execute("ALTER TABLE payment_history AUTO_INCREMENT = 1");
    await connection.execute("ALTER TABLE registration_status_history AUTO_INCREMENT = 1");

    // Insert admin user
    await connection.execute(
      `INSERT INTO users (id, email, password, full_name, user_type) 
       VALUES (?, ?, ?, ?, 'admin')`,
      [1, "admin@gmail.com", adminPassword, "Administrator Fitalenta"]
    );

    // Insert participant users
    await connection.execute(
      `INSERT INTO users (id, email, password, full_name, phone, address, user_type) VALUES
      (?, ?, ?, ?, ?, ?, 'participant'),
      (?, ?, ?, ?, ?, ?, 'participant')`,
      [
        2, "user1@gmail.com", user1Password, "User Satu", "08882124339", "Jl. Contoh No. 123",
        3, "user2@gmail.com", user2Password, "User Dua", "083821612483", "Jl. Demo No. 456"
      ]
    );

    // Insert program categories
    await connection.execute(`
      INSERT INTO program_categories (id, name, description) VALUES
      (1, 'Regular', 'Program persiapan intensif dan komprehensif dengan metode offline'),
      (2, 'Hybrid', 'Program fleksibel dengan kombinasi pembelajaran virtual dan tatap muka'),
      (3, 'Fast Track', 'Program jalur cepat untuk yang sudah memiliki sertifikasi')
    `);

    // Insert programs data
    const programsData = [
      {
        id: 1,
        category_id: 1,
        name: "Program Regular",
        description: "Skema terbaik untuk persiapan intensif dan komprehensif.",
        requirements: "- Ijazah Minimal SMA/Sederajat\n- Sehat Jasmani & Rohani\n- Usia Maksimal 30 Tahun",
        schedule: "Senin-Jumat, 09:00-17:00",
        duration: "4 bulan",
        capacity: 20,
        current_participants: 0,
        status: "active",
        contact_info: "Email: info@fitalenta.co.id\nTelp: 0811 1011 9273\nAlamat: Gedung Science Techno Park ITB. Jl. Ganesa No.15E, Lb. Siliwangi, Kec. Coblong, Bandung 40132",
        registration_deadline: "2024-12-31",
        start_date: "2024-02-01",
        end_date: "2024-04-30",
        location: "Asrama Depok",
        training_cost: "16000000.00",
        training_fee_details: "Biaya administrasi pendaftaran.\nSeragam pelatihan lengkap.\nModul, buku pelajaran bahasa Jepang, dan materi pendukung lainnya.\nAkses penuh ke fasilitas kelas dan laboratorium bahasa.\nFasilitas asrama (akomodasi dan utilitas dasar selama periode pelatihan).\nPendampingan dan bimbingan belajar intensif.",
        departure_cost: "30000000.00",
        departure_fee_details: "Tiket pesawat ke Jepang (sekali jalan).\nPengurusan Visa Kerja & dokumen keberangkatan.\nAsuransi perjalanan dan asuransi kesehatan awal di Jepang.\nBiaya penempatan kerja di Jepang (termasuk administrasi penyaluran).\nPendampingan proses keberangkatan hingga penyaluran ke perusahaan di Jepang.",
        installment_plan: "4_installments",
        bridge_fund: "Tersedia (Jaminan dari perusahaan pengirim)",
        timeline_text: "Bulan 1: Pelatihan Dasar Bahasa Jepang (Hiragana & Katakana)\nBulan 2: Pengembangan Kosakata dan Tata Bahasa\nBulan 3: Budaya Jepang dan Etika Kerja\nBulan 4: Persiapan Akhir dan Evaluasi",
        requirements_text: "Minimal 18 tahun dan Maksimal 30 Tahun.\nMinimal Ijazah SMA/SMK Sederajat.\nSehat Jasmani & Rohani (Wajib dibuktikan dengan Surat Keterangan Sehat dari fasilitas kesehatan).\nTidak memiliki catatan kriminal (Wajib melampirkan Surat Keterangan Catatan Kepolisian/SKCK).\nBersedia mengikuti seluruh rangkaian pelatihan dan aturan asrama hingga selesai."
      },
      {
        id: 2,
        category_id: 2,
        name: "Program Hybrid",
        description: "Fleksibilitas pelatihan virtual dengan pemantapan di asrama.",
        requirements: "- Ijazah Minimal SMA/Sederajat\n- Sehat Jasmani & Rohani\n- Usia Maksimal 30 Tahun",
        schedule: "Senin-Jumat, 09:00-17:00",
        duration: "6 bulan",
        capacity: 15,
        current_participants: 0,
        status: "active",
        contact_info: "Email: info@fitalenta.co.id\nTelp: 0811 1011 9273\nAlamat: Gedung Science Techno Park ITB. Jl. Ganesa No.15E, Lb. Siliwangi, Kec. Coblong, Bandung 40132",
        registration_deadline: "2024-12-31",
        start_date: "2024-02-01",
        end_date: "2024-04-30",
        location: "-",
        training_cost: "7150000.00",
        training_fee_details: "Biaya administrasi pendaftaran.\nAkses ke platform pembelajaran virtual (LMS).\nModul & buku pelajaran digital bahasa Jepang. \nSesi live interaction & bimbingan virtual.\nFasilitas asrama (akomodasi & utilitas dasar) selama 1 bulan pemantapan luring.\nPendampingan & bimbingan belajar.",
        departure_cost: "30000000.00",
        departure_fee_details: "Tiket pesawat ke Jepang Visa & dokumen keberangkatan \nAsuransi perjalanan & kesehatan \nBiaya penempatan kerja di Jepang\nPendampingan proses keberangkatan hingga penyaluran",
        installment_plan: "6_installments",
        bridge_fund: "Tersedia (Jaminan dari perusahaan pengirim)",
        timeline_text: "Minggu 1-6: Pelatihan Dasar Bahasa Jepang (Virtual: Penguasaan Hiragana & Katakana).\nMinggu 7-12: Pengembangan Kosakata dan Tata Bahasa Lanjutan (Virtual: Fokus N5 dan Komunikasi Dasar).\nMinggu 13-20: Bahasa Lanjutan, Evaluasi Virtual, dan Persiaapan Administratif (Virtual: Fokus N4, Self-Study, dan Pre-screening dokumen penempatan).\nMinggu 21-24: Pemantapan Budaya, Kesiapan Fisik/Mental, dan Penyaluran (Luring di Asrama: Etika Kerja, Simulasi Wawancara, Ujian Akhir, dan Proses Keberangkatan).",
        requirements_text: "Minimal 18 tahun dan Maksimal 30 Tahun.\nMinimal Ijazah SMA/SMK Sederajat.\nSehat Jasmani & Rohani (Wajib dibuktikan dengan Surat Keterangan Sehat dari fasilitas kesehatan).\nTidak memiliki catatan kriminal (Wajib melampirkan Surat Keterangan Catatan Kepolisian/SKCK).\nBersedia mengikuti seluruh rangkaian pelatihan dan aturan asrama hingga selesai."
      },
      {
        id: 3,
        category_id: 3,
        name: "Program Fast Track",
        description: "Jalur cepat untuk yang sudah memiliki sertifikat Noryoku Shiken N4 dan Specified Skilled Worker",
        requirements: "- Mahasiswa Statistika/TI/Matematika\n- Menguasai dasar statistik\n- Familiar dengan Python/R",
        schedule: "Senin-Jumat, 09:00-17:00",
        duration: "1 bulan",
        capacity: 12,
        current_participants: 0,
        status: "active",
        contact_info: "Email: info@fitalenta.co.id\nTelp: 0811 1011 9273\nAlamat: Gedung Science Techno Park ITB. Jl. Ganesa No.15E, Lb. Siliwangi, Kec. Coblong, Bandung 40132",
        registration_deadline: "2024-12-31",
        start_date: "2024-02-01",
        end_date: "2024-05-31",
        location: "Jakarta, Indonesia & Jepang",
        training_cost: "4000000.00",
        training_fee_details: "Biaya administrasi dan pendaftaran\nVerifikasi sertifikat N4 / Sertifikat Keahlian (SSW)\nOrientasi budaya kerja dan etika bisnis (1 bulan) \nKonsultasi persiapan keberangkatan dan wawancara \nAkses ke fasilitas kelas/ruangan briefing",
        departure_cost: "30000000.00",
        departure_fee_details: "Tiket pesawat ke Jepang Visa dan dokumen keberangkatan \nAsuransi perjalanan dan kesehatan awal\nBiaya penempatan kerja di Jepang\nProcessing fee administrasi penyaluran",
        installment_plan: "none",
        bridge_fund: "Tersedia (Jaminan dari perusahaan pengirim)",
        timeline_text: "Minggu 1: Verifikasi Dokumen, Sertifikat N4/SSW, dan Keahlian Teknis \nMinggu 2: Orientasi Budaya Kerja, Etika Jepang (Horenso), dan Simulasi Wawancara \nMinggu 3: Pengurusan Dokumen Administrasi Keberangkatan dan Visa\nMinggu 4: Briefing Akhir, Matching Perusahaan, dan Pemberangkatan",
        requirements_text: "Memiliki sertifikat Noryoku Shiken N4\nMemiliki sertifikat Specified Skilled Worker (SSW)\nMinimal 18 tahun dan Maksimal 30 Tahun.\nMinimal Ijazah SMA/SMK Sederajat.\nSehat Jasmani & Rohani (Wajib dibuktikan dengan Surat Keterangan Sehat dari fasilitas kesehatan).\nTidak memiliki catatan kriminal (Wajib melampirkan Surat Keterangan Catatan Kepolisian/SKCK).\nBersedia mengikuti seluruh rangkaian pelatihan dan aturan asrama hingga selesai."
      }
    ];

    // Insert each program
    for (const program of programsData) {
      await connection.execute(
        `INSERT INTO programs (
          id, category_id, name, description, requirements, schedule, duration, 
          capacity, current_participants, status, contact_info, registration_deadline, 
          start_date, end_date, location, training_cost, training_fee_details, 
          departure_cost, departure_fee_details, installment_plan, bridge_fund, 
          timeline_text, requirements_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          program.id,
          program.category_id,
          program.name,
          program.description,
          program.requirements,
          program.schedule,
          program.duration,
          program.capacity,
          program.current_participants,
          program.status,
          program.contact_info,
          program.registration_deadline,
          program.start_date,
          program.end_date,
          program.location,
          program.training_cost,
          program.training_fee_details,
          program.departure_cost,
          program.departure_fee_details,
          program.installment_plan,
          program.bridge_fund,
          program.timeline_text,
          program.requirements_text
        ]
      );
    }

    console.log("Database seeded successfully!");
    console.log("\n=== Login Credentials ===");
    console.log("Admin: admin@gmail.com / admin");
    console.log("User 1: user1@gmail.com / user123");
    console.log("User 2: user2@gmail.com / user321");
    console.log("\n=== Sample Data Created ===");
    console.log("- 3 Program Categories");
    console.log("- 3 Programs (Regular, Hybrid, Fast Track)");
    console.log("- No sample registrations (clean start)");
    console.log("===========================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

seedData();