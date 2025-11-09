import express from "express";
import db from "../config/database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [categories] = await db.promise().query(`
      SELECT * FROM program_categories 
      ORDER BY name
    `);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching program categories:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
