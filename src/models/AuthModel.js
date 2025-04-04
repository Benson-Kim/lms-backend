import pool from "../config/database.js";
import bcrypt from "bcryptjs";

class Auth {
	static async verifyCredentials(email, password) {
		const result = await pool.query(
			"SELECT id, email, password, first_name, last_name, profile_image, is_system_admin, is_individual_learner FROM users WHERE email = $1",
			[email]
		);

		if (result.rows.length === 0) {
			return null;
		}

		const user = result.rows[0];
		const isValid = await bcrypt.compare(password, user.password);

		if (!isValid) {
			return null;
		}

		// Remove password from user object
		delete user.password;

		return user;
	}

	static async getUserById(userId) {
		const result = await pool.query(
			"SELECT id, email, first_name, last_name, profile_image, is_system_admin, is_individual_learner FROM users WHERE id = $1",
			[userId]
		);

		return result.rows[0] || null;
	}

	static async getUserRoles(userId) {
		const result = await pool.query(
			`SELECT ur.role, ur.entity_type, ur.entity_id, 
			  CASE 
				WHEN ur.entity_type = 'client' THEN c.name
				WHEN ur.entity_type = 'department' THEN d.name
				WHEN ur.entity_type = 'group' THEN g.name
				ELSE NULL
			  END AS entity_name
			FROM user_roles ur
			LEFT JOIN clients c ON ur.entity_type = 'client' AND ur.entity_id = c.id
			LEFT JOIN departments d ON ur.entity_type = 'department' AND ur.entity_id = d.id
			LEFT JOIN groups g ON ur.entity_type = 'group' AND ur.entity_id = g.id
			WHERE ur.user_id = $1 AND ur.status = 'active'`,
			[userId]
		);

		return result.rows;
	}

	static async createRefreshToken(userId, token, expiresAt) {
		const result = await pool.query(
			"INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *",
			[userId, token, expiresAt]
		);

		return result.rows[0];
	}

	static async findRefreshToken(token) {
		const result = await pool.query(
			"SELECT * FROM refresh_tokens WHERE token = $1 AND is_revoked = FALSE AND expires_at > CURRENT_TIMESTAMP",
			[token]
		);

		return result.rows[0];
	}

	static async revokeRefreshToken(token) {
		const result = await pool.query(
			"UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = $1 RETURNING *",
			[token]
		);

		return result.rows[0];
	}

	static async revokeAllUserRefreshTokens(userId) {
		const result = await pool.query(
			"UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE RETURNING *",
			[userId]
		);

		return result.rows;
	}

	static async createPasswordResetToken(userId, token, expiresAt) {
		// First, invalidate any existing reset tokens
		await pool.query(
			"UPDATE password_reset_tokens SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE",
			[userId]
		);

		const result = await pool.query(
			"INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *",
			[userId, token, expiresAt]
		);

		return result.rows[0];
	}

	static async findPasswordResetToken(token) {
		const result = await pool.query(
			"SELECT * FROM password_reset_tokens WHERE token = $1 AND is_used = FALSE AND expires_at > CURRENT_TIMESTAMP",
			[token]
		);

		return result.rows[0];
	}

	static async markResetTokenAsUsed(token) {
		const result = await pool.query(
			"UPDATE password_reset_tokens SET is_used = TRUE WHERE token = $1 RETURNING *",
			[token]
		);

		return result.rows[0];
	}

	static async createLoginAttempt(email, ip, success) {
		const result = await pool.query(
			"INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, $3) RETURNING *",
			[email, ip, success]
		);

		return result.rows[0];
	}

	static async getLoginAttempts(email, minutes = 30) {
		const result = await pool.query(
			`SELECT * FROM login_attempts 
		 WHERE email = $1 
		 AND created_at > NOW() - INTERVAL '${minutes} minutes'
		 ORDER BY created_at DESC`,
			[email]
		);

		return result.rows;
	}

	static async getFailedLoginAttempts(email, minutes = 30) {
		const result = await pool.query(
			`SELECT COUNT(*) as failed_attempts 
		 FROM login_attempts 
		 WHERE email = $1 
		 AND success = FALSE 
		 AND created_at > NOW() - INTERVAL '${minutes} minutes'`,
			[email]
		);

		return parseInt(result.rows[0].failed_attempts);
	}

	static async isAccountLocked(email) {
		const failedAttempts = await this.getFailedLoginAttempts(email);

		// Account is locked if there are 5 or more failed attempts in the last 30 minutes
		return failedAttempts >= 5;
	}

	static async updatePassword(userId, hashedPassword) {
		const result = await pool.query(
			"UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id",
			[hashedPassword, userId]
		);

		return result.rows[0];
	}
}

export default Auth;
