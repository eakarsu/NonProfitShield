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
  const existing = await pool.query("SELECT id,password,role,email_verified FROM users WHERE email = $1", [email]);
  if (existing.rowCount) {
    const account = existing.rows[0];
    if (!account.password || !(await bcrypt.compare(password, account.password))) {
      throw new Error("bootstrap administrator exists with different credentials; refusing to overwrite it");
    }
    console.log("bootstrap administrator already exists; account preserved");
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
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
