// src/config/database.js
import pkg from "pg";
const { Pool } = pkg;

// Create pool with connection details from environment variables
const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT || 5432,
	ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Test the connection
pool.connect((err, client, release) => {
	if (err) {
		console.error("Error connecting to the database:", err);
	} else {
		console.log("Connected to the database successfully");
		release();
	}
});

// Handle unexpected errors
pool.on("error", (err) => {
	console.error("Unexpected database error:", err);
	process.exit(-1);
});

export default pool;
