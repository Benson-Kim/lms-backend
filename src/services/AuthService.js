import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Auth from "../models/AuthModel.js";

class AuthService {
	static async login(email, password, ipAddress) {
		// Check if account is locked due to too many failed attempts
		const isLocked = await Auth.isAccountLocked(email);
		if (isLocked) {
			// Record the failed login attempt
			await Auth.createLoginAttempt(email, ipAddress, false);
			throw new Error(
				"Account temporarily locked due to too many failed login attempts. Please try again later."
			);
		}

		// Verify credentials
		const user = await Auth.verifyCredentials(email, password);

		// Record login attempt
		await Auth.createLoginAttempt(email, ipAddress, user !== null);

		if (!user) {
			throw new Error("Invalid email or password");
		}

		// Get user roles
		const roles = await Auth.getUserRoles(user.id);

		// Generate tokens
		const accessToken = await this.generateAccessToken(user.id, user, roles);
		const refreshToken = this.generateRefreshToken(user.id);

		// Store refresh token
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
		await Auth.createRefreshToken(user.id, refreshToken, expiresAt);

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
			const tokenRecord = await Auth.findRefreshToken(token);
			if (!tokenRecord) {
				throw new Error("Invalid refresh token");
			}

			// Get user data
			const user = await Auth.getUserById(decoded.userId);
			if (!user) {
				throw new Error("User not found");
			}

			const roles = await Auth.getUserRoles(decoded.userId);

			// Generate new access token with roles
			const accessToken = this.generateAccessToken(decoded.userId, user, roles);

			return { accessToken, user: { ...user, roles } };
		} catch (error) {
			throw new Error("Invalid refresh token");
		}
	}

	static async logout(userId, refreshToken) {
		// Revoke all refresh tokens for the user
		await Auth.revokeAllUserRefreshTokens(userId);

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

		// Store token in database with expiration
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now
		await Auth.createPasswordResetToken(userId, resetToken, expiresAt);

		// In a real app, send email with reset link
		// For this example, we'll just return the token
		return {
			success: true,
			resetToken, // In production, you would not return this
			resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
		};
	}

	static async resetPassword(resetToken, newPassword) {
		try {
			// Verify token
			const decoded = jwt.verify(resetToken, process.env.RESET_TOKEN_SECRET);

			// Check if token is in database and not expired
			const tokenRecord = await Auth.findPasswordResetToken(resetToken);
			if (!tokenRecord) {
				throw new Error("Invalid or expired reset token");
			}

			// Validate password strength
			if (!this.isPasswordStrong(newPassword)) {
				throw new Error(
					"Password must be at least 8 characters long and include numbers, uppercase and lowercase letters"
				);
			}

			// Hash new password
			const hashedPassword = await bcrypt.hash(newPassword, 10);

			// Update password
			await Auth.updatePassword(decoded.userId, hashedPassword);

			// Mark token as used
			await Auth.markResetTokenAsUsed(resetToken);

			// Revoke all refresh tokens for security
			await Auth.revokeAllUserRefreshTokens(decoded.userId);

			return { success: true };
		} catch (error) {
			if (
				error.name === "JsonWebTokenError" ||
				error.name === "TokenExpiredError"
			) {
				throw new Error("Invalid or expired reset token");
			}
			throw error;
		}
	}

	static isPasswordStrong(password) {
		// Password must be at least 8 characters and include numbers, uppercase and lowercase letters
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
		return regex.test(password);
	}

	static generateAccessToken(userId, user = null, roles = null) {
		// If user and roles aren't provided, we'll need to fetch them
		// This makes the function more flexible
		const fetchData = async () => {
			if (!user) {
				user = await Auth.getUserById(userId);
			}
			if (!roles) {
				roles = await Auth.getUserRoles(userId);
			}

			// Create a token payload with all necessary information
			const payload = {
				userId,
				email: user.email,
				is_system_admin: user.is_system_admin,
				roles: roles,
			};

			return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
				expiresIn: "7d", // or whatever expiration time you use
			});
		};

		// If we already have user and roles, create token immediately
		if (user && roles) {
			const payload = {
				userId,
				email: user.email,
				is_system_admin: user.is_system_admin,
				roles: roles,
			};

			return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
				expiresIn: "7d",
			});
		}

		// Otherwise, we need to fetch them first
		return fetchData();
	}

	static generateRefreshToken(userId) {
		return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
			expiresIn: "7d",
		});
	}

	static async verifyAccessToken(token) {
		try {
			const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
			return { valid: true, userId: decoded.userId };
		} catch (error) {
			return { valid: false, error: error.name };
		}
	}
}

export default AuthService;
