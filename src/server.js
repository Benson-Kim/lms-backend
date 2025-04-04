// server.js
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import router from "./routes.js";
import pool from "./config/database.js";

const app = express();

// Make database connection available globally
global.db = pool;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // Request logging

// Routes
app.use("/api", router);

// Error handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		error: "Internal Server Error",
		message: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

export default app;
