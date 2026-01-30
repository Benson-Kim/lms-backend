// src/controllers/AuthController.js
// import AuthService from "../services/AuthService.js";

import AuthService from "./auth.service";

class AuthController {
	static async login(req, res) {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				return res
					.status(400)
					.json({ error: "Email and password are required" });
			}

			const ipAddress = req.ip || req.connection.remoteAddress;

			const result = await AuthService.login(email, password, ipAddress);

			return res.json(result);
		} catch (error) {
			console.error("Login error:", error);

			// Special handling for account lockout
			if (error.message.includes("Account temporarily locked")) {
				return res.status(429).json({
					error: error.message,
					lockout: true,
				});
			}

			return res
				.status(401)
				.json({ error: error.message || "Invalid credentials" });
		}
	}

	static async refresh(req, res) {
		try {
			const { refreshToken } = req.body;

			if (!refreshToken) {
				return res.status(400).json({ error: "Refresh token is required" });
			}

			const result = await AuthService.refreshToken(refreshToken);

			return res.json(result);
		} catch (error) {
			console.error("Token refresh error:", error);
			return res.status(401).json({ error: "Invalid refresh token" });
		}
	}

	static async logout(req, res) {
		try {
			const userId = req.user.id;
			const { refreshToken } = req.body;

			if (!refreshToken) {
				return res.status(400).json({ error: "Refresh token is required" });
			}

			await AuthService.logout(userId, refreshToken);

			return res.json({ message: "Logged out successfully" });
		} catch (error) {
			console.error("Logout error:", error);
			return res.status(500).json({ error: "Failed to logout" });
		}
	}

	static async logoutAll(req, res) {
		try {
			const userId = req.user.id;

			await AuthService.logoutFromAllDevices(userId);

			return res.json({ message: "Logged out from all devices successfully" });
		} catch (error) {
			console.error("Logout all error:", error);
			return res
				.status(500)
				.json({ error: "Failed to logout from all devices" });
		}
	}

	static async forgotPassword(req, res) {
		try {
			const { email } = req.body;

			if (!email) {
				return res.status(400).json({ error: "Email is required" });
			}

			const result = await AuthService.forgotPassword(email);

			// In production, you would not return the token
			// Here we're returning it for demonstration purposes
			return res.json({
				message:
					"If your email is registered, you will receive a password reset link",
				...result,
			});
		} catch (error) {
			console.error("Forgot password error:", error);
			// Return success to prevent email enumeration
			return res.json({
				message:
					"If your email is registered, you will receive a password reset link",
				success: true,
			});
		}
	}

	static async resetPassword(req, res) {
		try {
			const { token, newPassword } = req.body;

			if (!token || !newPassword) {
				return res
					.status(400)
					.json({ error: "Token and new password are required" });
			}

			await AuthService.resetPassword(token, newPassword);

			return res.json({ message: "Password reset successfully" });
		} catch (error) {
			console.error("Reset password error:", error);
			// Different error message for password strength issues
			if (error.message.includes("Password must be")) {
				return res.status(400).json({
					error: error.message,
					passwordRequirements: true,
				});
			}
			return res
				.status(400)
				.json({ error: error.message || "Failed to reset password" });
		}
	}

	static async verifyResetToken(req, res) {
		try {
			const { token } = req.params;

			if (!token) {
				return res.status(400).json({ error: "Token is required" });
			}

			// Just verify the token is valid, we don't need to do anything with it
			await AuthService.verifyResetToken(token);

			return res.json({ valid: true });
		} catch (error) {
			console.error("Token verification error:", error);
			return res.status(400).json({ valid: false });
		}
	}
}

export default AuthController;
