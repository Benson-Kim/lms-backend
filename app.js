// src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const db = require("./config/database");

const app = express();

// Make database connection available globally
global.db = db;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // Request logging

// Routes
app.use("/api", routes);

// Error handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		error: "Internal Server Error",
		message: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

module.exports = app;
