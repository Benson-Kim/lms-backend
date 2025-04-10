// utils/redisCache.js
import { createClient } from "redis";

class RedisCache {
	static instance = null;

	constructor() {
		if (RedisCache.instance) {
			return RedisCache.instance;
		}

		const host = process.env.REDIS_HOST || "localhost";
		const port = process.env.REDIS_PORT || "6379";
		const url = process.env.REDIS_URL || `redis://${host}:${port}`;

		this.client = createClient({ url });
		this.client.on("error", (err) => console.error("Redis Client Error", err));
		this.isConnected = false;
		this.connectionPromise = this.connect();
		RedisCache.instance = this;
	}

	async connect() {
		try {
			await this.client.connect();
			this.isConnected = true;
			console.log("✅ Redis connected");
		} catch (error) {
			console.error("❌ Redis connection failed:", error.message);
			// Don't throw here, we'll handle failures in the methods
		}
	}

	async ensureConnection() {
		if (!this.isConnected) {
			try {
				await this.connectionPromise;
			} catch (error) {
				console.error("Failed to connect to Redis:", error);
			}
		}
		return this.isConnected;
	}

	async get(key) {
		const connected = await this.ensureConnection();
		if (!connected) {
			console.warn("Redis not connected, returning null for key:", key);
			return null;
		}

		try {
			const value = await this.client.get(key);
			return value ? JSON.parse(value) : null;
		} catch (error) {
			console.error(`Error getting key ${key}:`, error);
			return null;
		}
	}

	async set(key, value, ttlSeconds = 1800) {
		const connected = await this.ensureConnection();
		if (!connected) {
			console.warn("Redis not connected, skipping set for key:", key);
			return;
		}

		try {
			await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
		} catch (error) {
			console.error(`Error setting key ${key}:`, error);
		}
	}

	async del(key) {
		const connected = await this.ensureConnection();
		if (!connected) {
			console.warn("Redis not connected, skipping delete for key:", key);
			return;
		}

		try {
			await this.client.del(key);
		} catch (error) {
			console.error(`Error deleting key ${key}:`, error);
		}
	}

	async keys(pattern = "*") {
		const connected = await this.ensureConnection();
		if (!connected) {
			console.warn("Redis not connected, returning empty array for keys");
			return [];
		}

		try {
			return await this.client.keys(pattern);
		} catch (error) {
			console.error(`Error getting keys with pattern ${pattern}:`, error);
			return [];
		}
	}

	async flushAll() {
		const connected = await this.ensureConnection();
		if (!connected) {
			console.warn("Redis not connected, skipping flushAll");
			return;
		}

		try {
			await this.client.flushAll();
		} catch (error) {
			console.error("Error flushing cache:", error);
		}
	}
}

// Export a singleton instance
export default new RedisCache();
