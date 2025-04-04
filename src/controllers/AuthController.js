// src/controllers/AuthController.js
import AuthService from "../services/AuthService.js";

class AuthController {
	static async login(req, res) {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				return res
					.status(400)
					.json({ error: "Email and password are required" });
			}

			const result = await AuthService.login(email, password);

			return res.json(result);
		} catch (error) {
			console.error("Login error:", error);
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
			const userId = req.userId;
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
			return res.status(500).json({ error: "Failed to process request" });
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
			return res
				.status(400)
				.json({ error: error.message || "Failed to reset password" });
		}
	}
}

export default AuthController;
