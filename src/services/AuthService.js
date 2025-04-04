import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

class AuthService {
	static async login(email, password) {
		// Find user by email
		const userResult = await global.db.query(
			"SELECT id, email, password, first_name, last_name, profile_image, is_system_admin FROM users WHERE email = $1",
			[email]
		);

		if (userResult.rows.length === 0) {
			throw new Error("Invalid email or password");
		}

		const user = userResult.rows[0];

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			throw new Error("Invalid email or password");
		}

		// Get user roles
		const roles = await User.getUserRoles(user.id);

		// Generate tokens
		const accessToken = this.generateAccessToken(user.id);
		const refreshToken = this.generateRefreshToken(user.id);

		// Store refresh token
		await this.storeRefreshToken(user.id, refreshToken);

		// Remove password from user object
		delete user.password;

		return {
			user: {
				...user,
				roles,
			},
			accessToken,
			refreshToken,
		};
	}

	static async refreshToken(token) {
		try {
			// Verify refresh token
			const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

			// Check if token is in database and not revoked
			const tokenResult = await global.db.query(
				"SELECT * FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND is_revoked = FALSE",
				[decoded.userId, token]
			);

			if (tokenResult.rows.length === 0) {
				throw new Error("Invalid refresh token");
			}

			// Generate new access token
			const accessToken = this.generateAccessToken(decoded.userId);

			return { accessToken };
		} catch (error) {
			throw new Error("Invalid refresh token");
		}
	}

	static async logout(userId, refreshToken) {
		// Revoke refresh token
		await global.db.query(
			"UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1 AND token = $2",
			[userId, refreshToken]
		);

		return { success: true };
	}

	static async forgotPassword(email) {
		// Check if user exists
		const userResult = await global.db.query(
			"SELECT id FROM users WHERE email = $1",
			[email]
		);

		if (userResult.rows.length === 0) {
			// Don't reveal if email exists for security
			return { success: true };
		}

		const userId = userResult.rows[0].id;

		// Generate reset token
		const resetToken = jwt.sign({ userId }, process.env.RESET_TOKEN_SECRET, {
			expiresIn: "1h",
		});

		// Store token in database
		await global.db.query(
			"INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')",
			[userId, resetToken]
		);

		// In a real app, send email with reset link
		// For this example, we'll just return the token
		return {
			success: true,
			resetToken, // In production, you would not return this
		};
	}

	static async resetPassword(resetToken, newPassword) {
		try {
			// Verify token
			const decoded = jwt.verify(resetToken, process.env.RESET_TOKEN_SECRET);

			// Check if token is in database and not expired
			const tokenResult = await global.db.query(
				"SELECT * FROM password_reset_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW() AND is_used = FALSE",
				[decoded.userId, resetToken]
			);

			if (tokenResult.rows.length === 0) {
				throw new Error("Invalid or expired reset token");
			}

			// Hash new password
			const hashedPassword = await bcrypt.hash(newPassword, 10);

			// Update password
			await global.db.query(
				"UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
				[hashedPassword, decoded.userId]
			);

			// Mark token as used
			await global.db.query(
				"UPDATE password_reset_tokens SET is_used = TRUE WHERE user_id = $1 AND token = $2",
				[decoded.userId, resetToken]
			);

			return { success: true };
		} catch (error) {
			throw new Error("Invalid or expired reset token");
		}
	}

	static generateAccessToken(userId) {
		return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
			expiresIn: "15m",
		});
	}

	static generateRefreshToken(userId) {
		return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
			expiresIn: "7d",
		});
	}

	static async storeRefreshToken(userId, token) {
		await global.db.query(
			"INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 day')",
			[userId, token]
		);
	}

	static async verifyAccessToken(token) {
		try {
			const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
			return { valid: true, userId: decoded.userId };
		} catch (error) {
			return { valid: false };
		}
	}
}

export default AuthService;
