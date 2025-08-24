process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "dev";
process.env.TEST_BYPASS_AUTH = "true";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgres://localhost/farmpilot_test";

export {};

// If TEST_REAL_DB is enabled, run simple SQL files from /migrations to prepare DB.
if (process.env.TEST_REAL_DB === "true") {
  // run migrations synchronously before tests
  const { Pool } = require("pg");
  const fs = require("fs");
  const path = require("path");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const migrationsDir = path.resolve(__dirname, "..", "..", "migrations");
  if (fs.existsSync(migrationsDir)) {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f: string) => f.endsWith(".sql"));
    (async () => {
      const client = await pool.connect();
      try {
        for (const file of files) {
          const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
          await client.query(sql);
        }
      } finally {
        client.release();
        await pool.end();
      }
    })();
  } else {
    // no migrations found; close pool
    pool.end();
  }
}
