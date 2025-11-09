import express from "express";
import { promisePool } from "../config/database.js";

const router = express.Router();

const updateCurrentParticipants = async (programId = null) => {
  try {
    if (programId) {
      const [result] = await promisePool.query(`
        UPDATE programs 
        SET current_participants = (
          SELECT COUNT(*) 
          FROM registrations 
          WHERE program_id = ? AND registration_status = 'lolos'
        )
        WHERE id = ?
      `, [programId, programId]);
      return result.affectedRows;
    } else {
      const [result] = await promisePool.query(`
        UPDATE programs p
        SET p.current_participants = (
          SELECT COUNT(*) 
          FROM registrations r 
          WHERE r.program_id = p.id AND r.registration_status = 'lolos'
        )
      `);
      return result.affectedRows;
    }
  } catch (error) {
    console.error("Error updating current_participants:", error);
    throw error;
  }
};

router.get("/", async (req, res) => {
  try {
    const [programs] = await promisePool.query(`
      SELECT p.*, pc.name as category_name 
      FROM programs p 
      LEFT JOIN program_categories pc ON p.category_id = pc.id 
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      data: programs,
    });
  } catch (error) {
    console.error("❌ Error fetching programs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

router.post("/sync-participants", async (req, res) => {
  try {
    const updatedCount = await updateCurrentParticipants();

    res.json({
      success: true,
      message: `Berhasil menyinkronkan participant count untuk ${updatedCount} program`,
    });
  } catch (error) {
    console.error("Error syncing participants:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menyinkronkan data participants",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const programId = req.params.id;

    const [programs] = await promisePool.query(
      `
      SELECT p.*, pc.name as category_name 
      FROM programs p 
      LEFT JOIN program_categories pc ON p.category_id = pc.id 
      WHERE p.id = ?
    `,
      [programId]
    );

    if (programs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    const program = programs[0];

    const [relatedPrograms] = await promisePool.query(
      `
      SELECT id, name, description, duration, training_cost, departure_cost, installment_plan
      FROM programs 
      WHERE category_id = ? AND id != ? AND status = 'active' 
      LIMIT 3
    `,
      [program.category_id, programId]
    );

    res.json({
      success: true,
      data: {
        ...program,
        relatedPrograms,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching program:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      category_id,
      name,
      description,
      requirements,
      schedule,
      duration,
      capacity,
      contact_info,
      status,
      training_cost,
      departure_cost,
      installment_plan,
      location,
      bridge_fund,
      timeline_text,
      training_fee_details,
      departure_fee_details,
      requirements_text,
    } = req.body;

    if (capacity !== undefined) {
      const [program] = await promisePool.query(
        "SELECT current_participants FROM programs WHERE id = ?",
        [req.params.id]
      );

      if (program.length > 0 && capacity < program[0].current_participants) {
        return res.status(400).json({
          success: false,
          message: `Kapasitas tidak bisa dikurangi menjadi ${capacity} karena sudah ada ${program[0].current_participants} peserta yang terdaftar`,
        });
      }
    }

    await promisePool.query(
      `UPDATE programs 
       SET category_id = ?, name = ?, description = ?, requirements = ?, 
           schedule = ?, duration = ?, capacity = ?, contact_info = ?, 
           status = ?, training_cost = ?, departure_cost = ?,
           installment_plan = ?, location = ?, bridge_fund = ?,
           timeline_text = ?, training_fee_details = ?, departure_fee_details = ?, requirements_text = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        category_id,
        name,
        description,
        requirements,
        schedule,
        duration,
        capacity,
        contact_info,
        status,
        training_cost,
        departure_cost,
        installment_plan,
        location,
        bridge_fund,
        timeline_text,
        training_fee_details,
        departure_fee_details,
        requirements_text,
        req.params.id,
      ]
    );

    res.json({
      success: true,
      message: "Program updated successfully",
    });
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      category_id,
      name,
      description,
      requirements,
      schedule,
      duration,
      capacity,
      contact_info,
      status,
      location,
      training_cost,
      departure_cost,
      installment_plan,
      bridge_fund,
      timeline_text,
      training_fee_details,
      departure_fee_details,
      requirements_text,
    } = req.body;

    const [result] = await promisePool.query(
      `INSERT INTO programs 
       (category_id, name, description, requirements, schedule, duration, capacity, 
        contact_info, status, location, training_cost, departure_cost, installment_plan, 
        bridge_fund, timeline_text, training_fee_details, departure_fee_details, requirements_text,
        current_participants) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        category_id,
        name,
        description,
        requirements,
        schedule,
        duration,
        capacity,
        contact_info,
        status,
        location,
        training_cost,
        departure_cost,
        installment_plan,
        bridge_fund,
        timeline_text,
        training_fee_details,
        departure_fee_details,
        requirements_text,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Program created successfully",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const programId = req.params.id;

    const [programs] = await promisePool.query(
      "SELECT id, current_participants FROM programs WHERE id = ?",
      [programId]
    );

    if (programs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    const program = programs[0];

    if (program.current_participants > 0) {
      return res.status(400).json({
        success: false,
        message: `Tidak dapat menghapus program karena masih ada ${program.current_participants} peserta yang terdaftar`,
      });
    }

    await promisePool.query("DELETE FROM programs WHERE id = ?", [programId]);

    res.json({
      success: true,
      message: "Program deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;