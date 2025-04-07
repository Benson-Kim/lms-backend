// src/config/database.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT || 5432,
	ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,

	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
	maxUses: 7500,

	// Query timeout settings: Terminate queries running longer than 10 seconds
	statement_timeout: 10000,

	// Keep connections alive with keepalive queries
	keepAlive: true,
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
