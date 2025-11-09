import express from "express";
import db from "../config/database.js";
import {
  generateRegistrationCode,
  generateInvoiceNumber,
} from "../config/database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const {
      program,
      payment_status,
      selection_status,
      placement_status,
      search,
    } = req.query;

    let query = `
      SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.registration_code,
        r.registration_status,
        r.registration_date,
        r.nik,
        r.gender,
        r.birth_place,
        r.birth_date,
        r.last_education,
        r.major,
        r.education_institution,
        r.current_activity,
        r.marital_status,
        r.parent_phone,
        r.parent_relationship,
        r.ktp_province_code,
        r.ktp_province_name,
        r.ktp_city_code,
        r.ktp_city_name,
        r.ktp_address,
        r.domicile_province_code,
        r.domicile_province_name,
        r.domicile_city_code,
        r.domicile_city_name,
        r.domicile_address,
        r.photo_path,
        r.n4_certificate_path,
        r.ssw_certificate_path,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        p.name as program_name,
        p.training_cost as program_training_cost,
        p.departure_cost as program_departure_cost,
        p.duration as program_duration,
        p.installment_plan as program_installment_plan,
        p.location as program_location,
        ss.status as selection_status,
        ss.notes as selection_notes,
        ss.evaluated_at as selection_evaluated_at,
        ps.status as placement_status,
        ps.notes as placement_notes,
        ps.company_name,
        ps.placement_date,
        py.status as payment_status,
        py.amount,
        py.amount_paid,
        py.invoice_number,
        py.receipt_number,
        py.due_date,
        py.payment_date,
        py.verified_at as payment_verified_at
      FROM registrations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      LEFT JOIN (
        SELECT registration_id, status, notes, evaluated_at
        FROM selection_status 
        WHERE (registration_id, evaluated_at) IN (
          SELECT registration_id, MAX(evaluated_at) 
          FROM selection_status 
          GROUP BY registration_id
        ) OR evaluated_at IS NULL
      ) ss ON r.id = ss.registration_id
      LEFT JOIN (
        SELECT registration_id, status, notes, company_name, placement_date
        FROM placement_status 
        WHERE (registration_id, updated_at) IN (
          SELECT registration_id, MAX(updated_at) 
          FROM placement_status 
          GROUP BY registration_id
        ) OR updated_at IS NULL
      ) ps ON r.id = ps.registration_id
      LEFT JOIN (
        SELECT registration_id, status, amount, amount_paid, invoice_number, 
               receipt_number, due_date, payment_date, verified_at
        FROM payments 
        WHERE (registration_id, updated_at) IN (
          SELECT registration_id, MAX(updated_at) 
          FROM payments 
          GROUP BY registration_id
        ) OR updated_at IS NULL
      ) py ON r.id = py.registration_id
      WHERE 1=1
    `;

    const params = [];

    if (program && program !== "all") {
      query += " AND r.program_id = ?";
      params.push(program);
    }

    if (payment_status && payment_status !== "all") {
      if (payment_status === "no_payment") {
        query += " AND py.registration_id IS NULL";
      } else {
        query += " AND py.status = ?";
        params.push(payment_status);
      }
    }

    if (selection_status && selection_status !== "all") {
      if (selection_status === "no_selection") {
        query += " AND ss.registration_id IS NULL";
      } else {
        query += " AND ss.status = ?";
        params.push(selection_status);
      }
    }

    if (placement_status && placement_status !== "all") {
      if (placement_status === "no_placement") {
        query += " AND ps.registration_id IS NULL";
      } else {
        query += " AND ps.status = ?";
        params.push(placement_status);
      }
    }

    if (search) {
      query +=
        " AND (u.full_name LIKE ? OR u.email LIKE ? OR r.registration_code LIKE ? OR p.name LIKE ? OR u.phone LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY r.registration_date DESC";

    // console.log("Executing registration query:", query);
    // console.log("With parameters:", params);

    const [registrations] = await db.promise().query(query, params);

    // console.log(`Found ${registrations.length} registrations`);

    res.json({
      success: true,
      data: registrations,
      count: registrations.length,
    });
  } catch (error) {
    // console.error("Error fetching registrations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

router.get("/statistics/summary", async (req, res) => {
  try {
    const [totalResult] = await db.promise().query(
      "SELECT COUNT(*) as total FROM registrations"
    );

    const [newResult] = await db.promise().query(
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

    res.json({
      success: true,
      data: {
        statistics: {
          totalRegistrations: totalResult[0].total,
          newRegistrations: newResult[0].total,
          totalRevenue: parseFloat(revenueResult[0].total),
          pendingVerifications,
          paymentStats: paymentStats[0],
          registrationStats: registrationStats[0],
          selectionStats: selectionStats[0],
          placementStats: placementStats[0],
        }
      },
    });
  } catch (error) {
    console.error("Error fetching registration statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const registrationId = req.params.id;

    const [registrations] = await db.promise().query(
      `
      SELECT 
        r.*,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        p.name as program_name,
        p.training_cost as program_training_cost,
        p.departure_cost as program_departure_cost,
        p.duration as program_duration,
        p.installment_plan as program_installment_plan,
        p.location as program_location,
        ss.status as selection_status,
        ss.notes as selection_notes,
        ss.evaluated_at as selection_evaluated_at,
        ps.status as placement_status,
        ps.notes as placement_notes,
        ps.company_name,
        ps.placement_date,
        py.status as payment_status,
        py.amount,
        py.amount_paid,
        py.invoice_number,
        py.receipt_number,
        py.due_date,
        py.payment_date,
        py.verified_at as payment_verified_at
      FROM registrations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      LEFT JOIN selection_status ss ON r.id = ss.registration_id
      LEFT JOIN placement_status ps ON r.id = ps.registration_id
      LEFT JOIN payments py ON r.id = py.registration_id
      WHERE r.id = ?
      GROUP BY r.id
    `,
      [registrationId]
    );

    if (registrations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    res.json({
      success: true,
      data: registrations[0],
    });
  } catch (error) {
    console.error("Error fetching registration:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.put("/:id/selection", async (req, res) => {
  try {
    const { status, notes, evaluated_by, test_score } = req.body;

    const [existing] = await db
      .promise()
      .query("SELECT * FROM selection_status WHERE registration_id = ?", [
        req.params.id,
      ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Selection status record not found",
      });
    }

    const oldStatus = existing[0].status;

    const [result] = await db.promise().query(
      `UPDATE selection_status 
       SET status = ?, notes = ?, evaluated_at = NOW(), evaluated_by = ?
       ${test_score !== undefined ? ', test_score = ?' : ''}
       WHERE registration_id = ?`,
      test_score !== undefined
        ? [status, notes, evaluated_by, test_score, req.params.id]
        : [status, notes, evaluated_by, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Selection status record not found",
      });
    }

    if (oldStatus !== status) {
      await db.promise().query(
        `INSERT INTO selection_status_history 
         (selection_status_id, old_status, new_status, notes, changed_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [existing[0].id, oldStatus, status, notes, evaluated_by]
      );
    }

    res.json({
      success: true,
      message: "Selection status updated successfully",
    });
  } catch (error) {
    console.error("Error updating selection status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.put("/:id/placement", async (req, res) => {
  try {
    const { status, company_name, placement_date, notes } = req.body;

    const [existing] = await db
      .promise()
      .query("SELECT * FROM placement_status WHERE registration_id = ?", [
        req.params.id,
      ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Placement status record not found",
      });
    }

    const oldStatus = existing[0].status;

    const [result] = await db.promise().query(
      `UPDATE placement_status 
       SET status = ?, company_name = ?, placement_date = ?, notes = ?, updated_at = NOW()
       WHERE registration_id = ?`,
      [status, company_name, placement_date, notes, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Placement status record not found",
      });
    }

    if (oldStatus !== status) {
      await db.promise().query(
        `INSERT INTO placement_status_history 
         (placement_status_id, old_status, new_status, notes) 
         VALUES (?, ?, ?, ?)`,
        [existing[0].id, oldStatus, status, notes]
      );
    }

    res.json({
      success: true,
      message: "Placement status updated successfully",
    });
  } catch (error) {
    console.error("Error updating placement status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.put("/:id/payment", async (req, res) => {
  try {
    const { status, amount_paid, payment_date, receipt_number, notes, verified_by } =
      req.body;

    const [existing] = await db
      .promise()
      .query("SELECT * FROM payments WHERE registration_id = ?", [
        req.params.id,
      ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    const payment = existing[0];
    const oldStatus = payment.status;
    const oldAmountPaid = payment.amount_paid;

    let finalReceiptNumber = receipt_number;
    if ((status === 'paid' || status.startsWith('installment_')) && !receipt_number) {
      const { generateReceiptNumber } = await import('../config/database.js');
      finalReceiptNumber = await generateReceiptNumber();
    }

    const [result] = await db.promise().query(
      `UPDATE payments 
       SET status = ?, 
           amount_paid = COALESCE(?, amount_paid),
           payment_date = ?,
           receipt_number = ?,
           notes = ?,
           verified_by = ?,
           verified_at = NOW(),
           updated_at = NOW()
       WHERE registration_id = ?`,
      [
        status,
        amount_paid,
        payment_date,
        finalReceiptNumber,
        notes,
        verified_by,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    await db.promise().query(
      `INSERT INTO payment_history 
       (payment_id, old_status, new_status, old_amount_paid, new_amount_paid, notes, changed_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.id,
        oldStatus,
        status,
        oldAmountPaid,
        amount_paid || oldAmountPaid,
        notes,
        verified_by
      ]
    );

    res.json({
      success: true,
      message: "Payment status updated successfully",
      data: {
        receipt_number: finalReceiptNumber
      }
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      program_id,
      nik,
      gender,
      birth_place,
      birth_date,
      last_education,
      parent_phone,
      ktp_province_code,
      ktp_province_name,
      ktp_city_code,
      ktp_city_name,
      ktp_address,
      domicile_province_code,
      domicile_province_name,
      domicile_city_code,
      domicile_city_name,
      domicile_address,
      parent_relationship,
      major,
      education_institution,
      current_activity,
      marital_status,
      photo_path,
      n4_certificate_path,
      ssw_certificate_path,
      user_data = {},
    } = req.body;

    const user_id = req.body.user_id || req.user?.userId;

    if (!program_id) {
      return res.status(400).json({
        success: false,
        message: "Program ID wajib diisi",
      });
    }

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
    }

    const [users] = await db
      .promise()
      .query("SELECT id, full_name, email FROM users WHERE id = ?", [user_id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const [programs] = await db
      .promise()
      .query(
        "SELECT id, name, capacity, current_participants, training_cost, installment_plan FROM programs WHERE id = ? AND status = 'active'",
        [program_id]
      );

    if (programs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Program tidak ditemukan atau tidak aktif",
      });
    }

    const program = programs[0];

    if (program.current_participants >= program.capacity) {
      return res.status(400).json({
        success: false,
        message: "Kuota program sudah penuh",
      });
    }

    const [existingRegistrations] = await db
      .promise()
      .query(
        "SELECT id FROM registrations WHERE user_id = ? AND program_id = ?",
        [user_id, program_id]
      );

    if (existingRegistrations.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Anda sudah terdaftar di program ini",
      });
    }

    const registrationCode = await generateRegistrationCode();

    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      const [result] = await connection.query(
        `INSERT INTO registrations 
         (user_id, program_id, registration_code, registration_status,
          nik, gender, birth_place, birth_date, last_education, parent_phone,
          ktp_province_code, ktp_province_name, ktp_city_code, ktp_city_name, ktp_address,
          domicile_province_code, domicile_province_name, domicile_city_code, domicile_city_name, domicile_address,
          parent_relationship, major, education_institution, current_activity, marital_status,
          photo_path, n4_certificate_path, ssw_certificate_path) 
         VALUES (?, ?, ?, 'menunggu',
                 ?, ?, ?, ?, ?, ?,
                 ?, ?, ?, ?, ?,
                 ?, ?, ?, ?, ?,
                 ?, ?, ?, ?, ?,
                 ?, ?, ?)`,
        [
          user_id,
          program_id,
          registrationCode,
          nik,
          gender,
          birth_place,
          birth_date,
          last_education,
          parent_phone,
          ktp_province_code,
          ktp_province_name,
          ktp_city_code,
          ktp_city_name,
          ktp_address,
          domicile_province_code,
          domicile_province_name,
          domicile_city_code,
          domicile_city_name,
          domicile_address,
          parent_relationship,
          major,
          education_institution,
          current_activity,
          marital_status,
          photo_path,
          n4_certificate_path,
          ssw_certificate_path,
        ]
      );

      const registrationId = result.insertId;

      const invoiceNumber = await generateInvoiceNumber();

      await connection.query(
        `INSERT INTO payments 
         (registration_id, invoice_number, amount, due_date, status, current_installment_number) 
         VALUES (?, ?, ?, null, 'pending', 0)`,
        [registrationId, invoiceNumber, program.training_cost]
      );

      await connection.query(
        "INSERT INTO selection_status (registration_id, status) VALUES (?, 'menunggu')",
        [registrationId]
      );

      await connection.query(
        "INSERT INTO placement_status (registration_id, status) VALUES (?, 'proses')",
        [registrationId]
      );

      await connection.query(
        "UPDATE programs SET current_participants = current_participants + 1 WHERE id = ?",
        [program_id]
      );

      if (user_data.full_name || user_data.phone) {
        const updateFields = [];
        const updateValues = [];

        if (user_data.full_name) {
          updateFields.push("full_name = ?");
          updateValues.push(user_data.full_name);
        }
        if (user_data.phone) {
          updateFields.push("phone = ?");
          updateValues.push(user_data.phone);
        }

        if (updateFields.length > 0) {
          updateValues.push(user_id);
          await connection.query(
            `UPDATE users SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            updateValues
          );
        }
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        success: true,
        message: "Pendaftaran berhasil",
        data: {
          registration_id: registrationId,
          registration_code: registrationCode,
          invoice_number: invoiceNumber,
          amount: program.training_cost,
          installment_plan: program.installment_plan,
        },
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error creating registration:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

router.put("/:id/registration-status", async (req, res) => {
  try {
    const { status, notes, evaluated_by } = req.body;
    const registrationId = req.params.id;

    const validStatuses = ["menunggu", "lolos", "tidak_lolos"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status tidak valid. Gunakan: ${validStatuses.join(", ")}`,
      });
    }

    const [currentRegistrations] = await db
      .promise()
      .query("SELECT registration_status FROM registrations WHERE id = ?", [
        registrationId,
      ]);

    if (currentRegistrations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Registrasi tidak ditemukan",
      });
    }

    const oldStatus = currentRegistrations[0].registration_status;

    if (oldStatus === status) {
      return res.json({
        success: true,
        message: "Status pendaftaran sama, tidak ada perubahan",
        data: {
          registration_id: registrationId,
          registration_status: status,
        },
      });
    }

    const [result] = await db.promise().query(
      `UPDATE registrations 
       SET registration_status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, registrationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Registrasi tidak ditemukan",
      });
    }

    try {
      await db.promise().query(
        `INSERT INTO registration_status_history 
         (registration_id, old_status, new_status, notes, changed_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [registrationId, oldStatus, status, notes, evaluated_by]
      );
    } catch (historyError) {
      console.warn("Cannot log to registration_status_history:", historyError.message);
    }

    const [updatedRegistrations] = await db.promise().query(
      `SELECT r.*, u.full_name, u.email, p.name as program_name 
       FROM registrations r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN programs p ON r.program_id = p.id
       WHERE r.id = ?`,
      [registrationId]
    );

    res.json({
      success: true,
      message: "Status pendaftaran berhasil diperbarui",
      data: {
        registration_id: registrationId,
        registration_status: status,
        updated_registration: updatedRegistrations[0],
      },
    });
  } catch (error) {
    console.error("Error updating registration status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const registrationId = req.params.id;

    const [registrations] = await db
      .promise()
      .query("SELECT id, program_id FROM registrations WHERE id = ?", [registrationId]);

    if (registrations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    const registration = registrations[0];

    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      await connection.query("DELETE FROM payment_history WHERE payment_id IN (SELECT id FROM payments WHERE registration_id = ?)", [registrationId]);
      await connection.query("DELETE FROM payments WHERE registration_id = ?", [registrationId]);
      await connection.query("DELETE FROM selection_status WHERE registration_id = ?", [registrationId]);
      await connection.query("DELETE FROM placement_status WHERE registration_id = ?", [registrationId]);
      await connection.query("DELETE FROM registration_status_history WHERE registration_id = ?", [registrationId]);

      await connection.query("DELETE FROM registrations WHERE id = ?", [registrationId]);

      await connection.query(
        "UPDATE programs SET current_participants = GREATEST(0, current_participants - 1) WHERE id = ?",
        [registration.program_id]
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: "Registration deleted successfully",
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting registration:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;