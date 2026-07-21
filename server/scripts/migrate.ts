import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const client = await pool.connect();
try {
  await client.query("CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
  for (const name of fs.readdirSync(path.join(root, "migrations")).filter((entry) => entry.endsWith(".sql")).sort()) {
    if ((await client.query("SELECT 1 FROM schema_migrations WHERE name=$1", [name])).rowCount) continue;
    const sql = fs.readFileSync(path.join(root, "migrations", name), "utf8").trim().replace(/^BEGIN;\s*/, "").replace(/\s*COMMIT;$/, "");
    await client.query("BEGIN");
    try { await client.query(sql); await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [name]); await client.query("COMMIT"); }
    catch (error) { await client.query("ROLLBACK"); throw error; }
    console.log(`applied ${name}`);
  }
} finally { client.release(); await pool.end(); }
