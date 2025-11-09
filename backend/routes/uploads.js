import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const ensureUploadsDir = (subdir = "") => {
  const uploadsDir = path.join(__dirname, "../uploads");
  const targetDir = subdir ? path.join(uploadsDir, subdir) : uploadsDir;

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    // console.log("Created uploads directory:", uploadsDir);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    // console.log("Created subdirectory:", targetDir);
  }
};

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsDir("photos");
    cb(null, path.join(__dirname, "../uploads/photos"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = "photo-" + uniqueSuffix + ext;
    // console.log("Saving photo as:", filename);
    cb(null, filename);
  },
});

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsDir("documents");
    cb(null, path.join(__dirname, "../uploads/documents"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const docType = req.body.type || "document";
    const filename = `${docType}-${uniqueSuffix}${ext}`;
    // console.log("Saving document as:", filename);
    cb(null, filename);
  },
});

const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsDir("payments");
    cb(null, path.join(__dirname, "../uploads/payments"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `payment-${uniqueSuffix}${ext}`;
    // console.log("Saving payment proof as:", filename);
    cb(null, filename);
  },
});

const createFileFilter = (allowedTypes, errorMessage) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(errorMessage), false);
    }
  };
};

const uploadPhoto = multer({
  storage: photoStorage,
  fileFilter: createFileFilter(
    ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    "Hanya file gambar (JPEG, JPG, PNG, GIF, WebP) yang diizinkan untuk foto!"
  ),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: createFileFilter(
    [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    "Hanya file JPG, PNG, PDF, atau DOC/DOCX yang diizinkan!"
  ),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const uploadPayment = multer({
  storage: paymentStorage,
  fileFilter: createFileFilter(
    ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    "Hanya file gambar yang diizinkan untuk bukti pembayaran!"
  ),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/photo", uploadPhoto.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada file foto yang diupload",
      });
    }

    const filePath = `/uploads/photos/${req.file.filename}`;

    res.json({
      success: true,
      message: "Foto berhasil diupload",
      data: {
        file_path: filePath,
        file_name: req.file.filename,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        full_url: `http://localhost:5000${filePath}`
      },
    });
  } catch (error) {
    console.error("❌ Error uploading photo:", error);

    if (req.file) {
      fs.unlink(req.file.path, (unlinkError) => {
        if (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Gagal mengupload foto",
    });
  }
});

router.post("/document", uploadDocument.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada file yang diupload",
      });
    }

    const docType = req.body.type || "document";
    const filePath = `/uploads/documents/${req.file.filename}`;

    res.json({
      success: true,
      message: "Dokumen berhasil diupload",
      data: {
        file_path: filePath,
        file_name: req.file.filename,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        document_type: docType,
        full_url: `http://localhost:5000${filePath}`
      },
    });
  } catch (error) {
    console.error("❌ Error uploading document:", error);

    if (req.file) {
      fs.unlink(req.file.path, (unlinkError) => {
        if (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Gagal mengupload dokumen",
    });
  }
});

router.post("/payment", uploadPayment.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada file bukti pembayaran yang diupload",
      });
    }

    const filePath = `/uploads/payments/${req.file.filename}`;

    res.json({
      success: true,
      message: "Bukti pembayaran berhasil diupload",
      data: {
        file_path: filePath,
        file_name: req.file.filename,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        full_url: `http://localhost:5000${filePath}`
      },
    });
  } catch (error) {
    console.error("❌ Error uploading payment proof:", error);

    if (req.file) {
      fs.unlink(req.file.path, (unlinkError) => {
        if (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Gagal mengupload bukti pembayaran",
    });
  }
});

router.post("/multiple", uploadDocument.array("files", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada file yang diupload",
      });
    }

    const uploadedFiles = req.files.map(file => {
      const filePath = `/uploads/documents/${file.filename}`;
      return {
        file_path: filePath,
        file_name: file.filename,
        original_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        full_url: `http://localhost:5000${filePath}`
      };
    });

    // console.log(`${uploadedFiles.length} files uploaded successfully`);

    res.json({
      success: true,
      message: `${uploadedFiles.length} file berhasil diupload`,
      data: {
        files: uploadedFiles
      },
    });
  } catch (error) {
    console.error("❌ Error uploading multiple files:", error);

    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (unlinkError) => {
          if (unlinkError) {
            console.error("Error deleting uploaded file:", unlinkError);
          }
        });
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Gagal mengupload file",
    });
  }
});

router.delete("/file", async (req, res) => {
  try {
    const { file_path } = req.body;

    if (!file_path) {
      return res.status(400).json({
        success: false,
        message: "File path diperlukan",
      });
    }

    if (!file_path.startsWith('/uploads/')) {
      return res.status(400).json({
        success: false,
        message: "Path file tidak valid",
      });
    }

    const fullPath = path.join(__dirname, '..', file_path);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: "File tidak ditemukan",
      });
    }

    fs.unlinkSync(fullPath);

    // console.log("File deleted successfully:", file_path);

    res.json({
      success: true,
      message: "File berhasil dihapus",
    });
  } catch (error) {
    console.error("❌ Error deleting file:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal menghapus file",
    });
  }
});

router.get("/health", async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, "../uploads");
    const subdirs = ["photos", "documents", "payments"];

    const healthStatus = {
      uploads_dir: fs.existsSync(uploadsDir),
      subdirectories: {}
    };

    subdirs.forEach(subdir => {
      const subdirPath = path.join(uploadsDir, subdir);
      healthStatus.subdirectories[subdir] = {
        exists: fs.existsSync(subdirPath),
        writable: false
      };

      if (healthStatus.subdirectories[subdir].exists) {
        try {
          const testFile = path.join(subdirPath, `test-${Date.now()}.tmp`);
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          healthStatus.subdirectories[subdir].writable = true;
        } catch (error) {
          healthStatus.subdirectories[subdir].writable = false;
        }
      }
    });

    const allHealthy = healthStatus.uploads_dir &&
      Object.values(healthStatus.subdirectories).every(dir => dir.exists && dir.writable);

    res.json({
      success: true,
      data: {
        healthy: allHealthy,
        ...healthStatus,
        total_space: await getDiskSpace(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("❌ Error checking upload health:", error);
    res.status(500).json({
      success: false,
      message: "Error checking upload health",
    });
  }
});

async function getDiskSpace() {
  try {
    const fsPromises = await import('fs/promises');
    const stats = await fsPromises.statfs(path.join(__dirname, "../uploads"));

    return {
      free: (stats.bfree * stats.bsize) / (1024 * 1024 * 1024),
      total: (stats.blocks * stats.bsize) / (1024 * 1024 * 1024),
      available: (stats.bavail * stats.bsize) / (1024 * 1024 * 1024)
    };
  } catch (error) {
    console.error("Error getting disk space:", error);
    return null;
  }
}

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = "Error upload file";

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "File terlalu besar. Maksimal 5MB untuk foto dan 10MB untuk dokumen.";
    } else if (error.code === "LIMIT_FILE_COUNT") {
      message = "Terlalu banyak file diupload";
    } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Field file tidak sesuai";
    }

    return res.status(400).json({
      success: false,
      message
    });
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

export default router;