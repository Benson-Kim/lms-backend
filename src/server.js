// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import pool from "./config/database.js";
import redisCache from "../utils/redisCache.js";
import router from "./modules/index.js";

const app = express();

// Make database connection and redis available globally
global.db = pool;
global.cache = redisCache; // This will use the singleton instance

// Middleware
app.use(helmet());
app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	}),
);
app.use(express.json());
app.use(morgan("dev"));
app.use(compression());

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

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

export default app;
