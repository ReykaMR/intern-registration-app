import mysql from "mysql2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
});

const schemaPath = path.join(__dirname, "../../database/schema.sql"); // jka menggunakan versi mysql terbaru harap ganti nama dari ../../database/schema.sql ke ../../database/schema2.sql
const schema = fs.readFileSync(schemaPath, "utf8");

console.log("Setting up database...");

const setupDatabase = async () => {
  try {
    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log("Connected to MySQL server");

    await new Promise((resolve, reject) => {
      connection.query(
        "CREATE DATABASE IF NOT EXISTS intern_registration",
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log("Database created or already exists");

    await new Promise((resolve, reject) => {
      connection.query("USE intern_registration", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log("Using database intern_registration");

    await new Promise((resolve, reject) => {
      connection.query(schema, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log("Database schema created successfully");

    connection.end();

    console.log(
      "Database setup completed. Run 'npm run db:seed' to seed data."
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    connection.end();
    process.exit(1);
  }
};

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  connection.end();
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  connection.end();
  process.exit(1);
});

setupDatabase();
