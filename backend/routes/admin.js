import express from "express";
import db, { promisePool } from "../config/database.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const deleteFileSafely = (filePath) => {
  if (!filePath) return false;

  try {
    const fullPath = path.join(__dirname, '..', filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`File deleted: ${fullPath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
};

router.get("/statistics", async (req, res) => {
  try {
    // console.log("Fetching admin statistics...");

    const [totalRegistrations] = await db.promise().query(
      "SELECT COUNT(*) as total FROM registrations"
    );

    const [newRegistrations] = await db.promise().query(
      `SELECT COUNT(*) as total 
       FROM registrations 
       WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    const [revenueResult] = await db.promise().query(
      "SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments WHERE status = 'paid'"
    );

    const [paymentStats] = await db.promise().query(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'installment_1' THEN 1 END) as installment_1,
        COUNT(CASE WHEN status = 'installment_2' THEN 1 END) as installment_2,
        COUNT(CASE WHEN status = 'installment_3' THEN 1 END) as installment_3,
        COUNT(CASE WHEN status = 'installment_4' THEN 1 END) as installment_4,
        COUNT(CASE WHEN status = 'installment_5' THEN 1 END) as installment_5,
        COUNT(CASE WHEN status = 'installment_6' THEN 1 END) as installment_6,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
      FROM payments
    `);

    const [registrationStats] = await db.promise().query(`
      SELECT 
        COUNT(CASE WHEN registration_status = 'menunggu' THEN 1 END) as menunggu,
        COUNT(CASE WHEN registration_status = 'lolos' THEN 1 END) as lolos,
        COUNT(CASE WHEN registration_status = 'tidak_lolos' THEN 1 END) as tidak_lolos
      FROM registrations
    `);

    const [selectionStats] = await db.promise().query(`
      SELECT 
        COUNT(CASE WHEN status = 'menunggu' THEN 1 END) as menunggu,
        COUNT(CASE WHEN status = 'lolos' THEN 1 END) as lolos,
        COUNT(CASE WHEN status = 'tidak_lolos' THEN 1 END) as tidak_lolos
      FROM selection_status
    `);

    const [placementStats] = await db.promise().query(`
      SELECT 
        COUNT(CASE WHEN status = 'proses' THEN 1 END) as proses,
        COUNT(CASE WHEN status = 'lolos' THEN 1 END) as lolos,
        COUNT(CASE WHEN status = 'ditempatkan' THEN 1 END) as ditempatkan
      FROM placement_status
    `);

    const pendingVerifications =
      registrationStats[0].menunggu +
      selectionStats[0].menunggu +
      paymentStats[0].pending;

    const statistics = {
      totalRegistrations: totalRegistrations[0].total,
      newRegistrations: newRegistrations[0].total,
      totalRevenue: parseFloat(revenueResult[0].total),
      pendingVerifications,
      paymentStats: paymentStats[0],
      registrationStats: registrationStats[0],
      selectionStats: selectionStats[0],
      placementStats: placementStats[0],
    };

    // console.log("Admin statistics fetched successfully");

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error("❌ Error fetching admin statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    // console.log("Fetching admin dashboard data...");

    const [stats] = await db.promise().query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE user_type = 'participant') as total_participants,
        (SELECT COUNT(*) FROM registrations) as total_registrations,
        (SELECT COUNT(*) FROM programs) as total_programs,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM registrations WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_registrations
    `);

    const [recentRegistrations] = await db.promise().query(`
      SELECT 
        r.*,
        u.full_name,
        u.email,
        p.name as program_name,
        py.status as payment_status,
        ss.status as selection_status,
        ps.status as placement_status
      FROM registrations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      LEFT JOIN payments py ON r.id = py.registration_id
      LEFT JOIN selection_status ss ON r.id = ss.registration_id
      LEFT JOIN placement_status ps ON r.id = ps.registration_id
      ORDER BY r.registration_date DESC
      LIMIT 5
    `);

    const [paymentStats] = await db.promise().query(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount_paid), 0) as total_amount
      FROM payments 
      GROUP BY status
    `);

    const [programStats] = await db.promise().query(`
      SELECT 
        p.id,
        p.name,
        p.capacity,
        p.current_participants,
        COUNT(r.id) as total_registrations
      FROM programs p
      LEFT JOIN registrations r ON p.id = r.program_id
      WHERE p.status = 'active'
      GROUP BY p.id
    `);

    // console.log("Admin dashboard data fetched successfully");

    res.json({
      success: true,
      data: {
        statistics: stats[0],
        recentRegistrations,
        paymentStats,
        programStats,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching admin dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

router.get("/overview", async (req, res) => {
  try {
    // console.log("Fetching admin overview data...");

    const [overviewStats] = await db.promise().query(`
      SELECT 
        -- User stats
        (SELECT COUNT(*) FROM users WHERE user_type = 'participant') as total_participants,
        (SELECT COUNT(*) FROM users WHERE user_type = 'admin') as total_admins,
        
        -- Registration stats
        (SELECT COUNT(*) FROM registrations) as total_registrations,
        (SELECT COUNT(*) FROM registrations WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_registrations_7d,
        (SELECT COUNT(*) FROM registrations WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as new_registrations_30d,
        
        -- Program stats
        (SELECT COUNT(*) FROM programs) as total_programs,
        (SELECT COUNT(*) FROM programs WHERE status = 'active') as active_programs,
        (SELECT COUNT(*) FROM programs WHERE status = 'full') as full_programs,
        
        -- Financial stats
        (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE status = 'paid') as total_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status != 'cancelled') as total_invoiced,
        
        -- Status counts
        (SELECT COUNT(*) FROM registrations WHERE registration_status = 'menunggu') as pending_interviews,
        (SELECT COUNT(*) FROM registrations WHERE registration_status = 'lolos') as passed_interviews,
        (SELECT COUNT(*) FROM selection_status WHERE status = 'menunggu') as pending_selections,
        (SELECT COUNT(*) FROM selection_status WHERE status = 'lolos') as passed_selections,
        (SELECT COUNT(*) FROM placement_status WHERE status = 'proses') as pending_placements,
        (SELECT COUNT(*) FROM placement_status WHERE status = 'ditempatkan') as completed_placements
    `);

    const [recentActivities] = await db.promise().query(`
      (SELECT 
        'registration' as type,
        r.registration_date as date,
        CONCAT(u.full_name, ' mendaftar program ', p.name) as description,
        u.full_name,
        p.name as program_name
      FROM registrations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      ORDER BY r.registration_date DESC
      LIMIT 10)
      
      UNION ALL
      
      (SELECT 
        'payment' as type,
        py.verified_at as date,
        CONCAT('Pembayaran diverifikasi untuk ', u.full_name) as description,
        u.full_name,
        p.name as program_name
      FROM payments py
      LEFT JOIN registrations r ON py.registration_id = r.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      WHERE py.verified_at IS NOT NULL
      ORDER BY py.verified_at DESC
      LIMIT 10)
      
      ORDER BY date DESC
      LIMIT 15
    `);

    // console.log("Admin overview data fetched successfully");

    res.json({
      success: true,
      data: {
        overview: overviewStats[0],
        recentActivities,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching admin overview:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

router.get("/users", async (req, res) => {
  try {
    const [users] = await promisePool.query(`
      SELECT 
        id, 
        email, 
        full_name, 
        phone, 
        address, 
        user_type, 
        created_at, 
        updated_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { email, password, full_name, phone, address, user_type } = req.body;

    const [existingUsers] = await promisePool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    const hashedPassword = await bcrypt.hash(password || "password123", 12);

    const [result] = await promisePool.query(
      `INSERT INTO users (email, password, full_name, phone, address, user_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, full_name, phone, address, user_type]
    );

    res.json({
      success: true,
      message: `User "${full_name}" berhasil dibuat`,
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, full_name, phone, address, user_type } = req.body;

    const [users] = await promisePool.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const [existingUsers] = await promisePool.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email sudah digunakan oleh user lain",
      });
    }

    await promisePool.query(
      `UPDATE users 
       SET email = ?, full_name = ?, phone = ?, address = ?, user_type = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [email, full_name, phone, address, user_type, userId]
    );

    res.json({
      success: true,
      message: `User "${full_name}" berhasil diupdate`,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.delete("/users/:id", async (req, res) => {
  let connection;
  try {
    const userId = req.params.id;

    const [users] = await promisePool.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const user = users[0];

    if (user.user_type === "admin") {
      return res.status(400).json({
        success: false,
        message: "Tidak dapat menghapus user admin",
      });
    }

    const filesToDelete = [];
    const programIdsToUpdate = [];

    const [registrations] = await promisePool.query(
      `SELECT id, program_id, photo_path, n4_certificate_path, ssw_certificate_path 
       FROM registrations 
       WHERE user_id = ?`,
      [userId]
    );

    registrations.forEach(reg => {
      if (reg.photo_path) filesToDelete.push(reg.photo_path);
      if (reg.n4_certificate_path) filesToDelete.push(reg.n4_certificate_path);
      if (reg.ssw_certificate_path) filesToDelete.push(reg.ssw_certificate_path);

      if (reg.program_id && !programIdsToUpdate.includes(reg.program_id)) {
        programIdsToUpdate.push(reg.program_id);
      }
    });

    const [payments] = await promisePool.query(
      `SELECT p.proof_image 
       FROM payments p 
       JOIN registrations r ON p.registration_id = r.id 
       WHERE r.user_id = ?`,
      [userId]
    );

    payments.forEach(payment => {
      if (payment.proof_image) filesToDelete.push(payment.proof_image);
    });

    connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query("DELETE FROM users WHERE id = ?", [userId]);

      for (const programId of programIdsToUpdate) {
        await connection.query(
          `UPDATE programs 
           SET current_participants = (
             SELECT COUNT(*) 
             FROM registrations 
             WHERE program_id = ? AND registration_status = 'lolos'
           )
           WHERE id = ?`,
          [programId, programId]
        );
        console.log(`Updated current_participants for program ${programId}`);
      }

      await connection.commit();

      let deletedFilesCount = 0;
      filesToDelete.forEach(filePath => {
        if (deleteFileSafely(filePath)) {
          deletedFilesCount++;
        }
      });

      console.log(`Deleted ${deletedFilesCount} files for user ${userId}`);
      console.log(`Updated ${programIdsToUpdate.length} programs' current_participants`);

      res.json({
        success: true,
        message: `User "${user.full_name}" berhasil dihapus. ${deletedFilesCount} file terkait telah dihapus dan ${programIdsToUpdate.length} program diperbarui.`,
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;