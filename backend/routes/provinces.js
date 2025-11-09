import express from "express";
import db from "../config/database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [provinces] = await db.promise().query(`
      SELECT * FROM provinces ORDER BY name
    `);

    res.json({
      success: true,
      data: provinces,
    });
  } catch (error) {
    console.error("Error fetching provinces:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/:provinceId/cities", async (req, res) => {
  try {
    const provinceId = req.params.provinceId;

    const [cities] = await db.promise().query(
      `
      SELECT * FROM cities 
      WHERE province_id = ? 
      ORDER BY name
    `,
      [provinceId]
    );

    res.json({
      success: true,
      data: cities,
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
