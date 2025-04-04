// src/db/migrations/run.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Create connection pool
const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT || 5432,
	ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
	// Create migrations table if it doesn't exist
	await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Get all migration files
	const migrationsDir = path.join(__dirname, "files");
	const migrationFiles = fs
		.readdirSync(migrationsDir)
		.filter((file) => file.endsWith(".sql"))
		.sort(); // Ensure migrations run in alphabetical order

	// Get already applied migrations
	const result = await pool.query("SELECT name FROM migrations");
	const appliedMigrations = result.rows.map((row) => row.name);

	// Run pending migrations
	for (const file of migrationFiles) {
		if (!appliedMigrations.includes(file)) {
			console.log(`Running migration: ${file}`);

			const migration = fs.readFileSync(path.join(migrationsDir, file), "utf8");
			const client = await pool.connect();

			try {
				await client.query("BEGIN");
				await client.query(migration);
				await client.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
				await client.query("COMMIT");
				console.log(`Migration ${file} completed successfully`);
			} catch (error) {
				await client.query("ROLLBACK");
				console.error(`Migration ${file} failed:`, error);
				process.exit(1);
			} finally {
				client.release();
			}
		}
	}

	console.log("All migrations completed successfully");
	await pool.end();
}

runMigrations().catch((error) => {
	console.error("Migration error:", error);
	process.exit(1);
});
