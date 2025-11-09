import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/database.js";

const router = express.Router();

const checkAlreadyLoggedIn = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return res.status(403).json({
        success: false,
        message: "Anda sudah login, tidak dapat mengakses halaman ini"
      });
    } catch (error) {
      next();
    }
  } else {
    next();
  }
};

router.post("/register", checkAlreadyLoggedIn, async (req, res) => {
  try {
    const { email, password, full_name, phone, address } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and full name are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const [existingUsers] = await db
      .promise()
      .query("SELECT id FROM users WHERE email = ?", [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db
      .promise()
      .query(
        "INSERT INTO users (email, password, full_name, phone, address, user_type) VALUES (?, ?, ?, ?, ?, 'participant')",
        [email, hashedPassword, full_name, phone, address]
      );

    const token = jwt.sign(
      { userId: result.insertId, email, userType: "participant" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: result.insertId,
          email,
          full_name,
          phone,
          address,
          user_type: "participant",
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
});

router.post("/login", checkAlreadyLoggedIn, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const [users] = await db
      .promise()
      .query(
        'SELECT * FROM users WHERE email = ? AND user_type = "participant"',
        [email]
      );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: "participant" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          address: user.address,
          user_type: user.user_type,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
});

router.post("/admin/login", checkAlreadyLoggedIn, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const [admins] = await db
      .promise()
      .query('SELECT * FROM users WHERE email = ? AND user_type = "admin"', [
        username,
      ]);

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const admin = admins[0];
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = jwt.sign(
      { userId: admin.id, username: admin.email, userType: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      data: {
        token,
        user: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          user_type: admin.user_type,
          role: "admin",
        },
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during admin login",
    });
  }
});

router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logout successful"
  });
});

router.get("/check", (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.json({
      success: false,
      message: "No token provided"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      success: true,
      data: {
        user: decoded
      }
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Invalid token"
    });
  }
});

export default router;