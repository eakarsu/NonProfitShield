import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "../db";

const email = (process.env.PROVISION_ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL)?.trim().toLowerCase();
const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required");
}
if (password.length < 12) {
  throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters");
}

try {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  const passwordHash = await bcrypt.hash(password, 12);
  if (existing.rowCount) {
    await pool.query(
      "UPDATE users SET password = $2, role = 'admin', email_verified = TRUE, updated_at = NOW() WHERE email = $1",
      [email, passwordHash],
    );
    console.log("bootstrap administrator reconciled");
  } else {
    await pool.query(
      `INSERT INTO users
         (id, email, first_name, last_name, password, role, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'admin', TRUE, NOW(), NOW())`,
      [randomUUID(), email, "Runtime", "Administrator", passwordHash],
    );
    console.log("bootstrap administrator created");
  }
} finally {
  await pool.end();
}
