import express from "express";
import db from "../config/database.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const [users] = await db
      .promise()
      .query(
        "SELECT id, email, full_name, phone, address FROM users WHERE id = ?",
        [userId]
      );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    const [registrations] = await db.promise().query(
      `
      SELECT 
        r.*,
        p.name as program_name,
        p.description as program_description,
        p.training_cost as program_training_cost,
        p.departure_cost as program_departure_cost,
        p.duration as program_duration,
        p.schedule as program_schedule,
        r.registration_status,
        ss.status as selection_status,
        ss.notes as selection_notes,
        ps.status as placement_status,
        ps.company_name,
        ps.placement_date,
        ps.notes as placement_notes,
        py.status as payment_status,
        py.amount,
        py.amount_paid,
        py.invoice_number,
        py.receipt_number,
        py.due_date,
        py.payment_date
      FROM registrations r
      LEFT JOIN programs p ON r.program_id = p.id
      LEFT JOIN selection_status ss ON r.id = ss.registration_id
      LEFT JOIN placement_status ps ON r.id = ps.registration_id
      LEFT JOIN payments py ON r.id = py.registration_id
      WHERE r.user_id = ?
      ORDER BY r.registration_date DESC
    `,
      [userId]
    );

    const totalRegistrations = registrations.length;
    const pendingPayments = registrations.filter(
      (r) => r.payment_status === "pending"
    ).length;
    const pendingRegistration = registrations.filter(
      (r) => r.registration_status === "menunggu"
    ).length;
    const passedSelections = registrations.filter(
      (r) => r.selection_status === "lolos"
    ).length;

    res.json({
      success: true,
      data: {
        user,
        registrations,
        statistics: {
          totalRegistrations,
          pendingPayments,
          pendingRegistration,
          passedSelections,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/registration/:registrationId", async (req, res) => {
  try {
    const registrationId = req.params.registrationId;

    const [registrations] = await db.promise().query(
      `
      SELECT 
        r.*,
        p.name as program_name,
        p.description as program_description,
        p.training_cost as program_training_cost,
        p.departure_cost as program_departure_cost,
        p.duration as program_duration,
        p.schedule as program_schedule,
        p.contact_info as program_contact,
        ss.status as selection_status,
        ss.notes as selection_notes,
        ss.evaluated_at as selection_evaluated_at,
        ps.status as placement_status,
        ps.company_name,
        ps.placement_date,
        ps.notes as placement_notes,
        py.status as payment_status,
        py.amount,
        py.amount_paid,
        py.invoice_number,
        py.receipt_number,
        py.due_date,
        py.payment_date,
        py.payment_method,
        py.bank_name,
        py.proof_image
      FROM registrations r
      LEFT JOIN programs p ON r.program_id = p.id
      LEFT JOIN selection_status ss ON r.id = ss.registration_id
      LEFT JOIN placement_status ps ON r.id = ps.registration_id
      LEFT JOIN payments py ON r.id = py.registration_id
      WHERE r.id = ?
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
    console.error("Error fetching registration details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
