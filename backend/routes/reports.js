import express from "express";
import db from "../config/database.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const router = express.Router();

router.get("/financial/summary", async (req, res) => {
  try {
    const { start_date, end_date, program } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_paid ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status IN ('installment_1', 'installment_2', 'installment_3', 'installment_4', 'installment_5', 'installment_6') THEN (amount - amount_paid) ELSE 0 END), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as total_overdue,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(amount_paid), 0) as total_amount_paid
      FROM payments
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += " AND DATE(created_at) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(created_at) <= ?";
      params.push(end_date);
    }

    if (program && program !== "all") {
      query +=
        " AND registration_id IN (SELECT id FROM registrations WHERE program_id = ?)";
      params.push(program);
    }

    const [summary] = await db.promise().query(query, params);

    const [statusDistribution] = await db.promise().query(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(amount_paid), 0) as total_paid
      FROM payments
      GROUP BY status
    `);

    const [monthlyTrend] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(payment_date, '%Y-%m') as month,
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount_paid), 0) as revenue
      FROM payments 
      WHERE status = 'paid' AND payment_date IS NOT NULL
      GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      data: {
        summary: summary[0],
        statusDistribution,
        monthlyTrend,
      },
    });
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/financial/detailed", async (req, res) => {
  try {
    const { start_date, end_date, program, status, search } = req.query;

    let query = `
      SELECT 
        py.*,
        r.registration_code,
        u.full_name,
        u.email,
        u.phone,
        p.name as program_name,
        p.training_cost as program_training_cost,
        p.departure_cost as program_departure_cost,
        verifier.full_name as verified_by_name
      FROM payments py
      LEFT JOIN registrations r ON py.registration_id = r.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      LEFT JOIN users verifier ON py.verified_by = verifier.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += " AND DATE(py.created_at) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(py.created_at) <= ?";
      params.push(end_date);
    }

    if (program && program !== "all") {
      query += " AND p.id = ?";
      params.push(program);
    }

    if (status && status !== "all") {
      query += " AND py.status = ?";
      params.push(status);
    }

    if (search) {
      query +=
        " AND (u.full_name LIKE ? OR u.email LIKE ? OR py.invoice_number LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY py.created_at DESC";

    const [payments] = await db.promise().query(query, params);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Error fetching detailed financial report:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/financial/export/excel", async (req, res) => {
  try {
    const { start_date, end_date, program, status } = req.query;

    let query = `
      SELECT 
        py.invoice_number,
        py.receipt_number,
        py.amount,
        py.amount_paid,
        py.status,
        py.payment_method,
        py.payment_date,
        py.created_at,
        r.registration_code,
        u.full_name,
        u.email,
        u.phone,
        p.name as program_name,
        p.training_cost as program_training_cost,
        p.departure_cost as program_departure_cost
      FROM payments py
      LEFT JOIN registrations r ON py.registration_id = r.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += " AND DATE(py.created_at) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(py.created_at) <= ?";
      params.push(end_date);
    }

    if (program && program !== "all") {
      query += " AND p.id = ?";
      params.push(program);
    }

    if (status && status !== "all") {
      query += " AND py.status = ?";
      params.push(status);
    }

    query += " ORDER BY py.created_at DESC";

    const [payments] = await db.promise().query(query, params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Keuangan");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Invoice Number", key: "invoice_number", width: 20 },
      { header: "Receipt Number", key: "receipt_number", width: 20 },
      { header: "Nama Peserta", key: "full_name", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Program", key: "program_name", width: 20 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Amount Paid", key: "amount_paid", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Payment Method", key: "payment_method", width: 15 },
      { header: "Payment Date", key: "payment_date", width: 15 },
      { header: "Created At", key: "created_at", width: 15 },
    ];

    payments.forEach((payment, index) => {
      worksheet.addRow({
        no: index + 1,
        ...payment,
        amount: payment.amount,
        amount_paid: payment.amount_paid,
        payment_date: payment.payment_date
          ? new Date(payment.payment_date).toLocaleDateString("id-ID")
          : "-",
        created_at: new Date(payment.created_at).toLocaleDateString("id-ID"),
      });
    });

    const totalRow = payments.length + 3;
    worksheet.addRow({});
    worksheet.addRow({
      no: "TOTAL",
      amount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      amount_paid: payments.reduce(
        (sum, p) => sum + parseFloat(p.amount_paid),
        0
      ),
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6FA" },
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="financial-report-${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/financial/export/pdf", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let summaryQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_paid ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status IN ('installment_1', 'installment_2', 'installment_3', 'installment_4', 'installment_5', 'installment_6') THEN (amount - amount_paid) ELSE 0 END), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as total_overdue
      FROM payments
      WHERE 1=1
    `;
    const summaryParams = [];

    if (start_date) {
      summaryQuery += " AND DATE(created_at) >= ?";
      summaryParams.push(start_date);
    }

    if (end_date) {
      summaryQuery += " AND DATE(created_at) <= ?";
      summaryParams.push(end_date);
    }

    const [summary] = await db.promise().query(summaryQuery, summaryParams);

    let recentPaymentsQuery = `
      SELECT 
        py.*,
        u.full_name,
        p.name as program_name
      FROM payments py
      LEFT JOIN registrations r ON py.registration_id = r.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN programs p ON r.program_id = p.id
      WHERE 1=1
    `;
    const recentParams = [];

    if (start_date) {
      recentPaymentsQuery += " AND DATE(py.created_at) >= ?";
      recentParams.push(start_date);
    }

    if (end_date) {
      recentPaymentsQuery += " AND DATE(py.created_at) <= ?";
      recentParams.push(end_date);
    }

    recentPaymentsQuery += " ORDER BY py.created_at DESC LIMIT 10";

    const [recentPayments] = await db
      .promise()
      .query(recentPaymentsQuery, recentParams);

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="financial-report-${
        new Date().toISOString().split("T")[0]
      }.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(20).text("Laporan Keuangan", 100, 100);
    doc
      .fontSize(12)
      .text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 100, 130);

    doc.text("Ringkasan Keuangan:", 100, 170);
    doc.text(
      `Total Pendapatan: Rp ${
        summary[0].total_revenue?.toLocaleString("id-ID") || 0
      }`,
      120,
      190
    );
    doc.text(
      `Pending: Rp ${summary[0].total_pending?.toLocaleString("id-ID") || 0}`,
      120,
      210
    );
    doc.text(
      `Outstanding (Cicilan): Rp ${
        summary[0].total_outstanding?.toLocaleString("id-ID") || 0
      }`,
      120,
      230
    );

    if (summary[0].total_overdue > 0) {
      doc.text(
        `Overdue: Rp ${summary[0].total_overdue?.toLocaleString("id-ID") || 0}`,
        120,
        250
      );
    }

    doc.text("Transaksi Terbaru:", 100, 290);
    let yPosition = 310;

    recentPayments.forEach((payment, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 100;
      }

      doc.text(
        `${index + 1}. ${payment.full_name} - ${payment.program_name} - Rp ${(
          payment.amount_paid || 0
        ).toLocaleString("id-ID")} (${payment.status})`,
        120,
        yPosition
      );
      yPosition += 20;
    });

    doc.end();
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
