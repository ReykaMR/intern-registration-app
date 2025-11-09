import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import PDFDocument from "pdfkit";
import db, {
  generateInvoiceNumber,
  generateReceiptNumber,
} from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const ensureUploadsDir = () => {
  const uploadsDir = path.join(__dirname, "../uploads");
  const paymentsDir = path.join(uploadsDir, "payments");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(paymentsDir)) {
    fs.mkdirSync(paymentsDir, { recursive: true });
  }
};

ensureUploadsDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsDir();
    cb(null, path.join(__dirname, "../uploads/payments"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "payment-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file gambar yang diizinkan!"), false);
    }
  },
});

const getTotalInstallments = (program) => {
  if (!program) return 4;

  const plan = program.program_installment_plan || program.installment_plan;

  if (!plan) return 4;

  if (plan === "none") return 1;
  if (plan === "4_installments") return 4;
  if (plan === "6_installments") return 6;

  const installments = parseInt(plan.split("_")[0]);
  return isNaN(installments) ? 4 : installments;
};

const validateStatusProgression = async (
  currentStatus,
  newStatus,
  currentInstallment,
  totalInstallments,
  paymentId,
  connection
) => {
  if (currentStatus === newStatus) {
    return { isValid: true };
  }

  if (currentStatus === "pending" && newStatus === "installment_1") {
    return { isValid: true, nextInstallment: 1 };
  }

  if (
    currentStatus.startsWith("installment_") &&
    newStatus.startsWith("installment_")
  ) {
    const currentNum = parseInt(currentStatus.split("_")[1]);
    const newNum = parseInt(newStatus.split("_")[1]);

    if (newNum !== currentNum + 1) {
      return {
        isValid: false,
        error: `Tidak bisa melompat cicilan. Dari ${currentStatus} harus ke installment_${currentNum + 1}`,
      };
    }

    const [previousPayments] = await connection.query(
      `SELECT * FROM payment_history 
       WHERE payment_id = ? 
       AND new_status = ? 
       AND amount_changed > 0`,
      [paymentId, currentStatus]
    );

    if (previousPayments.length === 0) {
      return {
        isValid: false,
        error: `Tidak bisa lanjut ke cicilan ${newNum}. Cicilan ${currentNum} belum dibayar.`,
      };
    }

    return { isValid: true, nextInstallment: newNum };
  }

  if (currentStatus.startsWith("installment_") && newStatus === "paid") {
    const currentNum = parseInt(currentStatus.split("_")[1]);

    if (currentNum !== totalInstallments) {
      return {
        isValid: false,
        error: `Belum bisa lunas. Masih ada ${totalInstallments - currentNum} cicilan lagi`,
      };
    }

    const lastInstallment = `installment_${currentNum}`;
    const [paidHistory] = await connection.query(
      `SELECT * FROM payment_history 
       WHERE payment_id = ? 
       AND new_status = ? 
       AND amount_changed > 0`,
      [paymentId, lastInstallment]
    );

    if (paidHistory.length === 0) {
      return {
        isValid: false,
        error: `Tidak bisa melunasi. Cicilan ${currentNum} belum dibayar.`,
      };
    }

    return { isValid: true, nextInstallment: 0 };
  }

  if (newStatus === "cancelled") {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: `Transisi status tidak valid: dari ${currentStatus} ke ${newStatus}`,
  };
};

const getStatusText = (status) => {
  const statusTexts = {
    pending: "Menunggu Pembayaran",
    installment_1: "Cicilan 1",
    installment_2: "Cicilan 2",
    installment_3: "Cicilan 3",
    installment_4: "Cicilan 4",
    installment_5: "Cicilan 5",
    installment_6: "Cicilan 6",
    paid: "Lunas",
    overdue: "Terlambat",
    cancelled: "Dibatalkan",
  };
  return statusTexts[status] || status;
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return "Rp 0";
  const numValue = parseFloat(value);
  return isNaN(numValue)
    ? "Rp 0"
    : `Rp ${Math.round(numValue).toLocaleString("id-ID")}`;
};

router.get("/", async (req, res) => {
  try {
    const { status, program, search, start_date, end_date } = req.query;

    let query = `
      SELECT 
        py.*,
        r.registration_code,
        r.id as registration_id,
        u.full_name,
        u.email,
        u.phone,
        p.name as program_name,
        p.training_cost as program_training_cost,
        p.departure_cost as program_departure_cost,
        p.duration as program_duration,
        p.installment_plan as program_installment_plan
      FROM payments py
      LEFT JOIN registrations r ON py.registration_id = r.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== "all") {
      query += " AND py.status = ?";
      params.push(status);
    }

    if (program && program !== "all") {
      query += " AND p.id = ?";
      params.push(program);
    }

    if (search) {
      query +=
        " AND (u.full_name LIKE ? OR u.email LIKE ? OR py.invoice_number LIKE ? OR r.registration_code LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (start_date) {
      query += " AND DATE(py.created_at) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(py.created_at) <= ?";
      params.push(end_date);
    }

    query += " ORDER BY py.created_at DESC";

    const [payments] = await db.promise().query(query, params);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/statistics", async (req, res) => {
  try {
    const [stats] = await db.promise().query(`
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(amount_paid), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_payments,
        COALESCE(SUM(CASE WHEN status LIKE 'installment_%' THEN 1 ELSE 0 END), 0) as installment_payments,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) as paid_payments,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END), 0) as overdue_payments
      FROM payments
      WHERE status != 'cancelled'
    `);

    const [recentPayments] = await db.promise().query(`
      SELECT 
        py.*,
        u.full_name,
        p.name as program_name
      FROM payments py
      LEFT JOIN registrations r ON py.registration_id = r.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      WHERE py.status != 'cancelled'
      ORDER BY py.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        statistics: stats[0],
        recentPayments,
      },
    });
  } catch (error) {
    console.error("Error fetching payment statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const [payments] = await db.promise().query(
      `
      SELECT 
        py.*,
        r.registration_code,
        p.name as program_name,
        p.training_cost as program_training_cost,
        p.departure_cost as program_departure_cost,
        p.duration as program_duration,
        p.installment_plan as program_installment_plan
      FROM payments py
      LEFT JOIN registrations r ON py.registration_id = r.id
      LEFT JOIN programs p ON r.program_id = p.id
      WHERE r.user_id = ? AND py.status != 'cancelled'
      ORDER BY py.created_at DESC
    `,
      [req.params.userId]
    );

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Error fetching user payments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post(
  "/:id/upload-proof",
  upload.single("proof_image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada file yang diupload",
        });
      }

      const proofImage = `/uploads/payments/${req.file.filename}`;

      await db
        .promise()
        .query("UPDATE payments SET proof_image = ? WHERE id = ?", [
          proofImage,
          req.params.id,
        ]);

      res.json({
        success: true,
        message:
          "Bukti pembayaran berhasil diupload dan menunggu verifikasi admin",
        data: {
          proof_image: proofImage,
        },
      });
    } catch (error) {
      console.error("Error uploading payment proof:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.post("/:id/create-invoice", async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const { installment_number, amount, due_date, notes, verified_by } =
      req.body;
    const paymentId = req.params.id;

    const [payments] = await connection.query(
      `SELECT py.*, p.training_cost as program_training_cost, p.installment_plan as program_installment_plan
       FROM payments py
       LEFT JOIN registrations r ON py.registration_id = r.id
       LEFT JOIN programs p ON r.program_id = p.id
       WHERE py.id = ?`,
      [paymentId]
    );

    if (payments.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const currentPayment = payments[0];
    const totalInstallments = getTotalInstallments(currentPayment);

    let expectedInstallment = 1;
    if (currentPayment.status === "pending") {
      expectedInstallment = 1;
    } else if (currentPayment.status.startsWith("installment_")) {
      const currentNum = parseInt(currentPayment.status.split("_")[1]);
      expectedInstallment = currentNum + 1;
    }

    if (installment_number !== expectedInstallment) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Tidak dapat membuat invoice untuk cicilan ${installment_number}. Cicilan berikutnya yang diharapkan: ${expectedInstallment}.`,
      });
    }

    if (installment_number > totalInstallments) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Tidak dapat membuat cicilan ${installment_number}. Program ini maksimal ${totalInstallments} cicilan.`,
      });
    }

    if (installment_number > 1) {
      const previousStatus = `installment_${installment_number - 1}`;
      const [paidHistory] = await connection.query(
        `SELECT * FROM payment_history 
         WHERE payment_id = ? 
         AND new_status = ? 
         AND amount_changed > 0`,
        [paymentId, previousStatus]
      );

      if (paidHistory.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Tidak dapat membuat invoice cicilan ${installment_number}. Cicilan ${installment_number - 1} belum dibayar.`,
        });
      }
    }

    if (!amount || amount <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Amount harus lebih dari 0",
      });
    }

    if (!due_date) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Due date harus diisi",
      });
    }

    const dueDate = new Date(due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Due date harus di masa depan",
      });
    }

    let installmentAmounts = {};
    try {
      installmentAmounts = currentPayment.installment_amounts
        ? JSON.parse(currentPayment.installment_amounts)
        : {};
    } catch (e) {
      installmentAmounts = {};
    }

    installmentAmounts[`installment_${installment_number}`] = {
      amount: amount,
      due_date: due_date,
      created_at: new Date().toISOString(),
      created_by: verified_by,
      notes: notes,
    };

    const newStatus = `installment_${installment_number}`;

    await connection.query(
      `UPDATE payments 
       SET status = ?,
           due_date = ?,
           next_due_date = ?,
           current_installment_number = ?,
           installment_amounts = ?,
           is_manual_invoice = TRUE,
           notes = CONCAT(COALESCE(notes, ''), ?),
           updated_at = NOW()
       WHERE id = ?`,
      [
        newStatus,
        due_date,
        due_date,
        installment_number,
        JSON.stringify(installmentAmounts),
        ` | Manual Invoice: Cicilan ${installment_number} - Amount: Rp ${amount} - Due: ${due_date}`,
        paymentId,
      ]
    );

    await connection.query(
      `INSERT INTO payment_history 
       (payment_id, old_status, new_status, notes, changed_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        paymentId,
        currentPayment.status,
        newStatus,
        `Manual invoice created: Cicilan ${installment_number} - Amount: Rp ${amount} - Due: ${due_date} - ${notes || ""
        }`,
        verified_by,
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: `Tagihan cicilan ${installment_number} berhasil dibuat`,
      data: {
        status: newStatus,
        installment_number: installment_number,
        amount: amount,
        due_date: due_date,
        current_installment_number: installment_number,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error creating manual invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  } finally {
    connection.release();
  }
});

router.put("/:id/status", async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const {
      status,
      amount_paid,
      notes,
      verified_by,
      is_manual = false,
      payment_method,
      bank_name,
      account_number,
      payment_date,
    } = req.body;
    const paymentId = req.params.id;

    const [currentPayments] = await connection.query(
      `SELECT py.*, p.training_cost as program_training_cost, p.installment_plan as program_installment_plan
       FROM payments py
       LEFT JOIN registrations r ON py.registration_id = r.id
       LEFT JOIN programs p ON r.program_id = p.id
       WHERE py.id = ?`,
      [paymentId]
    );

    if (currentPayments.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const currentPayment = currentPayments[0];
    const totalInstallments = getTotalInstallments(currentPayment);
    const totalAmount = parseFloat(currentPayment.program_training_cost);
    const currentAmountPaid = parseFloat(currentPayment.amount_paid || 0);
    const newPaymentAmount = parseFloat(amount_paid || 0);
    const newTotalPaid = currentAmountPaid + newPaymentAmount;

    const validation = await validateStatusProgression(
      currentPayment.status,
      status,
      currentPayment.current_installment_number,
      totalInstallments,
      paymentId,
      connection
    );

    if (!validation.isValid) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: validation.error,
        details: {
          currentStatus: currentPayment.status,
          requestedStatus: status,
          currentAmountPaid,
          newPaymentAmount,
          totalAmount,
        },
      });
    }

    if (newTotalPaid > totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Jumlah pembayaran melebihi total tagihan. Total: ${totalAmount}, Sudah dibayar: ${currentAmountPaid}, Maksimal: ${totalAmount - currentAmountPaid
          }`,
      });
    }

    let finalStatus = status;
    let receipt_number = currentPayment.receipt_number;
    let due_date = currentPayment.due_date;
    let current_installment_number = currentPayment.current_installment_number;

    if (finalStatus === "pending") {
      current_installment_number = 0;
    } else if (finalStatus.startsWith("installment_")) {
      current_installment_number = parseInt(finalStatus.split("_")[1]);
    } else if (finalStatus === "paid") {
      current_installment_number = 0;
    }

    if (newTotalPaid >= totalAmount && finalStatus !== "cancelled") {
      finalStatus = "paid";
      current_installment_number = 0;

      if (!receipt_number) {
        receipt_number = await generateReceiptNumber();
      }
    }

    if (
      !receipt_number &&
      finalStatus !== "pending" &&
      finalStatus !== "cancelled" &&
      newPaymentAmount > 0
    ) {
      receipt_number = await generateReceiptNumber();
    }

    let updateQuery = `UPDATE payments 
       SET status = ?, amount_paid = ?, receipt_number = ?, notes = COALESCE(?, notes), 
           verified_by = ?, verified_at = NOW(), due_date = ?, current_installment_number = ?`;

    let updateParams = [
      finalStatus,
      newTotalPaid,
      receipt_number,
      notes,
      verified_by,
      due_date,
      current_installment_number,
    ];

    if (is_manual) {
      updateQuery += `, payment_method = ?, bank_name = ?, account_number = ?, payment_date = ?`;
      updateParams.push(
        payment_method || "transfer",
        bank_name,
        account_number,
        payment_date || new Date()
      );
    }

    updateQuery += ` WHERE id = ?`;
    updateParams.push(paymentId);

    await connection.query(updateQuery, updateParams);

    const historyNotes =
      notes ||
      (is_manual
        ? `Manual payment: Rp ${newPaymentAmount} - Status: ${finalStatus}`
        : `Status berubah dari ${currentPayment.status} ke ${finalStatus} - Pembayaran: Rp ${newPaymentAmount}`);

    await connection.query(
      `INSERT INTO payment_history 
       (payment_id, old_status, new_status, old_amount_paid, new_amount_paid, amount_changed, notes, changed_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        currentPayment.status,
        finalStatus,
        currentAmountPaid,
        newTotalPaid,
        newPaymentAmount,
        historyNotes,
        verified_by,
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message:
        "Status pembayaran berhasil diperbarui" +
        (is_manual ? " (Manual Payment)" : ""),
      data: {
        receipt_number,
        amount_paid: newTotalPaid,
        status: finalStatus,
        due_date: due_date,
        current_installment_number: current_installment_number,
        is_manual: is_manual,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error updating payment status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  } finally {
    connection.release();
  }
});

router.post("/manual", async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const {
      registration_id,
      amount_paid = 0,
      payment_method = "transfer",
      bank_name,
      account_number,
      payment_date,
      due_date,
      notes,
      verified_by,
      status = "pending",
      is_manual = true,
    } = req.body;

    if (!registration_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Registration ID is required",
      });
    }

    const [registrations] = await connection.query(
      `
      SELECT r.*, p.training_cost, p.installment_plan 
      FROM registrations r
      LEFT JOIN programs p ON r.program_id = p.id
      WHERE r.id = ?
      `,
      [registration_id]
    );

    if (registrations.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    const registration = registrations[0];
    const totalAmount = parseFloat(registration.training_cost);
    const paymentAmount = parseFloat(amount_paid);

    if (paymentAmount <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Amount paid must be greater than 0",
      });
    }

    const [existingPayments] = await connection.query(
      "SELECT * FROM payments WHERE registration_id = ? AND status != 'cancelled'",
      [registration_id]
    );

    if (existingPayments.length > 0) {
      const existingPayment = existingPayments[0];
      const currentAmountPaid = parseFloat(existingPayment.amount_paid || 0);
      const newTotalPaid = currentAmountPaid + paymentAmount;

      if (newTotalPaid > totalAmount) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Jumlah pembayaran melebihi total tagihan. Total: ${totalAmount}, Sudah dibayar: ${currentAmountPaid}, Maksimal: ${totalAmount - currentAmountPaid
            }`,
        });
      }

      let newStatus = status;
      if (newTotalPaid >= totalAmount) {
        newStatus = "paid";
      } else if (status === "pending" && currentAmountPaid === 0) {
        newStatus = "installment_1";
      }

      const [result] = await connection.query(
        `UPDATE payments 
         SET amount_paid = ?, status = ?, receipt_number = COALESCE(receipt_number, ?), 
             payment_method = ?, bank_name = ?, account_number = ?,
             payment_date = ?, due_date = ?, notes = COALESCE(?, notes),
             verified_by = ?, verified_at = NOW(), amount = ?
         WHERE id = ?`,
        [
          newTotalPaid,
          newStatus,
          newStatus === "paid" ? await generateReceiptNumber() : null,
          payment_method,
          bank_name,
          account_number,
          payment_date,
          due_date,
          notes,
          verified_by,
          totalAmount,
          existingPayment.id,
        ]
      );

      await connection.query(
        `INSERT INTO payment_history 
         (payment_id, old_status, new_status, old_amount_paid, new_amount_paid, amount_changed, notes, changed_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          existingPayment.id,
          existingPayment.status,
          newStatus,
          currentAmountPaid,
          newTotalPaid,
          paymentAmount,
          notes || `Manual payment added`,
          verified_by,
        ]
      );

      await connection.commit();

      res.json({
        success: true,
        message:
          "Pembayaran manual berhasil ditambahkan ke invoice yang sudah ada",
        data: {
          payment_id: existingPayment.id,
          invoice_number: existingPayment.invoice_number,
          receipt_number: existingPayment.receipt_number,
          status: newStatus,
          amount_paid: newTotalPaid,
        },
      });
    } else {
      const invoice_number = await generateInvoiceNumber();

      let paymentStatus = status;
      if (paymentAmount >= totalAmount) {
        paymentStatus = "paid";
      } else if (paymentAmount > 0) {
        paymentStatus = "installment_1";
      }

      let receipt_number = null;
      if (paymentStatus === "paid") {
        receipt_number = await generateReceiptNumber();
      }

      const [result] = await connection.query(
        `INSERT INTO payments 
         (registration_id, invoice_number, amount, amount_paid, payment_method, bank_name, account_number, 
          status, payment_date, due_date, receipt_number, notes, verified_by, verified_at, current_installment_number) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          registration_id,
          invoice_number,
          totalAmount,
          paymentAmount,
          payment_method,
          bank_name,
          account_number,
          paymentStatus,
          payment_date,
          due_date,
          receipt_number,
          notes,
          verified_by,
          paymentAmount > 0 ? new Date() : null,
          paymentStatus === "installment_1" ? 1 : 0,
        ]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Invoice pembayaran berhasil dibuat",
        data: {
          payment_id: result.insertId,
          invoice_number,
          receipt_number,
          status: paymentStatus,
          amount_paid: paymentAmount,
        },
      });
    }
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error creating manual payment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  } finally {
    connection.release();
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [payments] = await db.promise().query(
      `
      SELECT 
        py.*,
        r.registration_code,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        p.name as program_name,
        p.training_cost as program_training_cost,
        p.departure_cost as program_departure_cost,
        p.duration as program_duration,
        p.installment_plan as program_installment_plan,
        verifier.full_name as verified_by_name
      FROM payments py
      LEFT JOIN registrations r ON py.registration_id = r.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      LEFT JOIN users verifier ON py.verified_by = verifier.id
      WHERE py.id = ?
    `,
      [req.params.id]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const [history] = await db.promise().query(
      `
      SELECT 
        ph.*, 
        u.full_name as changed_by_name,
        CASE 
          WHEN ph.old_amount_paid IS NOT NULL AND ph.new_amount_paid IS NOT NULL 
          THEN ph.new_amount_paid - ph.old_amount_paid 
          ELSE NULL 
        END as amount_paid_change
      FROM payment_history ph
      LEFT JOIN users u ON ph.changed_by = u.id
      WHERE ph.payment_id = ?
      ORDER BY ph.changed_at ASC
    `,
      [req.params.id]
    );

    const payment = payments[0];

    const totalInstallments = getTotalInstallments(payment);

    if (
      parseFloat(payment.amount) !== parseFloat(payment.program_training_cost)
    ) {
      await db
        .promise()
        .query("UPDATE payments SET amount = ? WHERE id = ?", [
          payment.program_training_cost,
          payment.id,
        ]);
      payment.amount = payment.program_training_cost;
    }

    res.json({
      success: true,
      data: {
        ...payment,
        history,
        total_installments: totalInstallments,
        remaining_installments:
          totalInstallments - (payment.current_installment_number || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/:id/receipt", async (req, res) => {
  let doc;
  try {
    const [payments] = await db.promise().query(
      `
      SELECT 
        py.*,
        r.registration_code,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        p.name as program_name,
        p.training_cost as program_training_cost,
        p.departure_cost as program_departure_cost,
        p.duration as program_duration,
        p.installment_plan as program_installment_plan,
        verifier.full_name as verified_by_name
      FROM payments py
      LEFT JOIN registrations r ON py.registration_id = r.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      LEFT JOIN users verifier ON py.verified_by = verifier.id
      WHERE py.id = ?
    `,
      [req.params.id]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const payment = payments[0];

    if (!payment.verified_by) {
      return res.status(400).json({
        success: false,
        message: "Kwitansi hanya tersedia untuk pembayaran yang sudah diverifikasi",
      });
    }

    const totalAmount = parseFloat(payment.program_training_cost);
    const amountPaid = parseFloat(payment.amount_paid || 0);
    const remaining = totalAmount - amountPaid;
    const progressPercentage = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;

    doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=kwitansi-${payment.receipt_number || payment.invoice_number}.pdf`
    );

    doc.pipe(res);

    const primaryColor = '#2c3e50';
    const secondaryColor = '#007bff';
    const successColor = '#28a745';
    const lightGray = '#f8f9fa';
    const borderGray = '#dee2e6';
    const textMuted = '#6c757d';

    doc.fillColor(primaryColor)
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('KWITANSI PEMBAYARAN', { align: 'center' });

    doc.fontSize(12)
      .text('Program Magang Perusahaan', { align: 'center' });

    doc.moveDown(0.5);

    doc.fontSize(9)
      .fillColor(textMuted)
      .text('FITALENTA', { align: 'center' })
      .text('Jl. Ganesa No.15E, Lb. Siliwangi, Kec. Coblong Bandung 40132', { align: 'center' })
      .text('Telp: (021) 123-4567 | Email: admin@fitalenta.com', { align: 'center' });

    doc.moveDown(1);

    doc.strokeColor(borderGray)
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();

    doc.moveDown(1);

    const receiptDate = payment.payment_date
      ? new Date(payment.payment_date).toLocaleDateString("id-ID")
      : new Date().toLocaleDateString("id-ID");

    doc.fontSize(10);

    doc.fillColor(primaryColor)
      .text(`No. Kwitansi: ${payment.receipt_number || payment.invoice_number}`)
      .text(`No. Invoice: ${payment.invoice_number}`)
      .text(`Tanggal: ${receiptDate}`)
      .text(`Status: ${getStatusText(payment.status)}`);

    doc.moveDown(1);

    if (payment.status.startsWith('installment_')) {
      const installmentNum = payment.status.split('_')[1];
      let installmentAmount = 0;

      if (payment.installment_amounts) {
        try {
          const installmentAmounts = typeof payment.installment_amounts === 'string'
            ? JSON.parse(payment.installment_amounts)
            : payment.installment_amounts;

          const installmentKey = `installment_${installmentNum}`;
          if (installmentAmounts[installmentKey]?.amount) {
            installmentAmount = parseFloat(installmentAmounts[installmentKey].amount);
          }
        } catch (e) {
          console.error("Error parsing installment_amounts:", e);
        }
      }

      if (installmentAmount === 0) {
        const [history] = await db.promise().query(
          `SELECT amount_changed FROM payment_history 
           WHERE payment_id = ? AND new_status = ? 
           ORDER BY changed_at DESC LIMIT 1`,
          [payment.id, payment.status]
        );
        installmentAmount = history.length > 0 ? parseFloat(history[0].amount_changed) : (totalAmount / 4);
      }

      doc.fillColor('#fff3cd')
        .rect(50, doc.y, doc.page.width - 100, 40)
        .fill();

      doc.strokeColor('#ffd43b')
        .rect(50, doc.y, doc.page.width - 100, 40)
        .stroke();

      doc.fillColor('#856404')
        .fontSize(10)
        .text(`Cicilan Ke-${installmentNum}`, 60, doc.y + 10)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(formatCurrency(installmentAmount), 60, doc.y + 25);

      doc.y += 50;
    }

    doc.moveDown(0.5);

    doc.fillColor(secondaryColor)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('DATA PESERTA:');

    doc.fillColor(primaryColor)
      .fontSize(10)
      .font('Helvetica')
      .text(`Nama Lengkap: ${payment.full_name || 'N/A'}`)
      .text(`Email: ${payment.email || 'N/A'}`)
      .text(`Telepon: ${payment.phone || 'N/A'}`);

    if (payment.address) {
      doc.text(`Alamat: ${payment.address}`);
    }

    doc.moveDown(1);

    doc.fillColor(secondaryColor)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('DETAIL PROGRAM:');

    doc.fillColor(primaryColor)
      .fontSize(10)
      .font('Helvetica')
      .text(`Program: ${payment.program_name || 'N/A'}`)
      .text(`Durasi: ${payment.program_duration || 'N/A'}`)
      .text(`Total Biaya: ${formatCurrency(totalAmount)}`)
      .text(`Plan Cicilan: ${payment.program_installment_plan || '4 cicilan'}`);

    doc.moveDown(1);

    doc.fillColor(secondaryColor)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('PROGRESS PEMBAYARAN:');

    doc.fillColor(primaryColor)
      .fontSize(10)
      .text(`Progress: ${progressPercentage.toFixed(1)}%`)
      .text(`Sudah Dibayar: ${formatCurrency(amountPaid)}`)
      .text(`Total Tagihan: ${formatCurrency(totalAmount)}`)
      .text(`Sisa: ${formatCurrency(remaining)}`);

    doc.moveDown(1);

    doc.fillColor(secondaryColor)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('RINCIAN PEMBAYARAN:');

    const tableTop = doc.y + 5;
    let currentY = tableTop;

    doc.fillColor(lightGray)
      .rect(50, currentY, doc.page.width - 100, 20)
      .fill();

    doc.fillColor(primaryColor)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('KETERANGAN', 55, currentY + 7)
      .text('JUMLAH', doc.page.width - 100, currentY + 7, { align: 'right' });

    currentY += 20;

    const items = [
      { description: `Biaya ${payment.program_name || ''}`, amount: totalAmount },
      { description: 'TOTAL TAGIHAN', amount: totalAmount, isTotal: true },
      { description: 'SUDAH DIBAYAR', amount: amountPaid, isTotal: true }
    ];

    if (remaining > 0) {
      items.push({ description: 'SISA TAGIHAN', amount: remaining, isTotal: true });
    }

    items.forEach((item, index) => {
      if (index % 2 === 0 && !item.isTotal) {
        doc.fillColor(lightGray)
          .rect(50, currentY, doc.page.width - 100, 18)
          .fill();
      }

      doc.fillColor(item.isTotal ? primaryColor : textMuted)
        .fontSize(item.isTotal ? 10 : 9)
        .font(item.isTotal ? 'Helvetica-Bold' : 'Helvetica')
        .text(item.description, 55, currentY + 5)
        .text(formatCurrency(item.amount), 50, currentY + 5, {
          width: doc.page.width - 110,
          align: 'right'
        });

      currentY += 18;
    });

    doc.y = currentY + 10;

    const statusText = payment.status === "paid"
      ? "LUNAS"
      : getStatusText(payment.status).toUpperCase();

    doc.fillColor(payment.status === "paid" ? successColor : secondaryColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`STATUS: ${statusText}`, { align: 'center' });

    doc.moveDown(1);

    if (payment.status === "paid" || payment.verified_by) {
      doc.fillColor(secondaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('KONFIRMASI PEMBAYARAN:');

      doc.fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica')
        .text(`Status: ${getStatusText(payment.status)}`)
        .text(`Tanggal Pembayaran: ${receiptDate}`)
        .text(`Metode: ${payment.payment_method || 'Transfer Bank'}`);

      if (payment.bank_name) {
        doc.text(`Bank: ${payment.bank_name}`);
      }

      if (payment.verified_by_name) {
        doc.text(`Terverifikasi oleh: ${payment.verified_by_name}`);
      }

      doc.moveDown(1);
    }

    const signatureY = Math.max(doc.y, doc.page.height - 100);

    doc.fillColor(primaryColor)
      .fontSize(10)
      .text(`Bandung, ${receiptDate}`, 400, signatureY, { width: 150, align: 'center' })
      .moveTo(400, signatureY + 20)
      .lineTo(550, signatureY + 20)
      .stroke()
      .text('Admin FITALENTA', 400, signatureY + 30, { width: 150, align: 'center' });

    const footerY = doc.page.height - 40;

    doc.fillColor(textMuted)
      .fontSize(8)
      .text('** Kwitansi ini sah dan dapat digunakan sebagai bukti pembayaran yang valid **',
        { align: 'center', lineGap: 3 })
      .text('Terima kasih telah mempercayai program magang kami', { align: 'center' })
      .text(`Generated on: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error("Error generating receipt PDF:", error);

    if (doc) {
      doc.end();
    }

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Gagal membuat PDF kwitansi: " + error.message,
      });
    }
  }
});

router.get("/registrations/active", async (req, res) => {
  try {
    const [registrations] = await db.promise().query(`
      SELECT 
        r.*,
        u.full_name,
        u.email,
        p.name as program_name,
        p.training_cost,
        p.installment_plan,
        COALESCE(py.amount_paid, 0) as amount_paid,
        py.status as payment_status,
        py.invoice_number
      FROM registrations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      LEFT JOIN payments py ON r.id = py.registration_id AND py.status != 'cancelled'
      WHERE r.id NOT IN (
        SELECT registration_id 
        FROM payments 
        WHERE status = 'cancelled'
      )
      ORDER BY r.registration_date DESC
    `);

    res.json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    console.error("Error fetching active registrations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;