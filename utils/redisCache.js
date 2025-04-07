import { createClient } from "redis";

class RedisCache {
	constructor() {
		const host = process.env.REDIS_HOST || "localhost";
		const port = process.env.REDIS_PORT || "6379";
		const url = process.env.REDIS_URL || `redis://${host}:${port}`;

		this.client = createClient({ url });

		this.client.on("error", (err) => console.error("Redis Client Error", err));
		this.connect();
	}

	async connect() {
		try {
			await this.client.connect();
			console.log("✅ Redis connected");
		} catch (error) {
			console.error("❌ Redis connection failed:", error.message);
		}
	}

	async get(key) {
		const value = await this.client.get(key);
		return value ? JSON.parse(value) : null;
	}

	async set(key, value, ttlSeconds = 1800) {
		await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
	}

	async del(key) {
		await this.client.del(key);
	}

	async keys(pattern) {
		return await this.client.keys(pattern);
	}

	async flushAll() {
		await this.client.flushAll();
	}
}

export default RedisCache;
