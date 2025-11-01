import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "./database.ts";

interface Migration {
  id: number;
  name: string;
  applied_at: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigrations() {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = path.join(__dirname, "migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.log("No migrations directory found");
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort(); // Ensure order

  const applied = db
    .prepare("SELECT name FROM _migrations")
    .all() as unknown as Migration[];
  const appliedNames = new Set(applied.map((m) => m.name));

  files.forEach((file) => {
    if (appliedNames.has(file)) {
      console.log(`⏭️  Skipping ${file} (already applied)`);
      return;
    }

    console.log(`🔄 Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

    try {
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
      console.log(`✅ Applied ${file}`);
    } catch (error) {
      console.error(`❌ Failed to apply ${file}:`, error);
      throw error;
    }
  });

  console.log("✨ All migrations completed");
}
