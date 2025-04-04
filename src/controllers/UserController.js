// src/controllers/UserController.js
import UserService from "../services/userService.js";

class UserController {
	static async getProfile(req, res) {
		try {
			const userId = req.userId;
			const profile = await UserService.getUserProfile(userId);

			return res.json(profile);
		} catch (error) {
			console.error("Get profile error:", error);
			return res.status(404).json({ error: error.message || "User not found" });
		}
	}

	static async updateProfile(req, res) {
		try {
			const userId = req.userId;
			const profileData = req.body;

			// Don't allow updating password or system admin status through this endpoint
			delete profileData.password;
			delete profileData.is_system_admin;
			delete profileData.isSystemAdmin;
			delete profileData.email; // Prevent email changes through this endpoint

			const updatedProfile = await UserService.updateUserProfile(
				userId,
				profileData
			);

			return res.json(updatedProfile);
		} catch (error) {
			console.error("Update profile error:", error);
			return res
				.status(400)
				.json({ error: error.message || "Failed to update profile" });
		}
	}

	static async changePassword(req, res) {
		try {
			const userId = req.userId;
			const { currentPassword, newPassword } = req.body;

			if (!currentPassword || !newPassword) {
				return res
					.status(400)
					.json({ error: "Current password and new password are required" });
			}

			await UserService.changePassword(userId, currentPassword, newPassword);

			return res.json({ message: "Password changed successfully" });
		} catch (error) {
			console.error("Change password error:", error);
			return res
				.status(400)
				.json({ error: error.message || "Failed to change password" });
		}
	}

	static async createUser(req, res) {
		try {
			const userData = req.body;

			// Map from API naming to internal naming if needed
			if (userData.first_name && !userData.firstName) {
				userData.firstName = userData.first_name;
			}

			if (userData.last_name && !userData.lastName) {
				userData.lastName = userData.last_name;
			}

			if (userData.profile_image && !userData.profileImage) {
				userData.profileImage = userData.profile_image;
			}

			const newUser = await UserService.createUser(userData);

			return res.status(201).json(newUser);
		} catch (error) {
			console.error("Create user error:", error);
			return res
				.status(400)
				.json({ error: error.message || "Failed to create user" });
		}
	}

	static async assignRole(req, res) {
		try {
			const { userId, entityType, entityId, role } = req.body;

			if (!userId || !entityType || !entityId || !role) {
				return res.status(400).json({
					error: "User ID, entity type, entity ID, and role are required",
				});
			}

			// Check if the requesting user has permission to assign roles
			// This would typically check if the user is an admin of the entity
			// Implementation depends on your authentication middleware

			const result = await UserService.assignRole(
				userId,
				entityType,
				entityId,
				role
			);

			return res.json({
				message: "Role assigned successfully",
				roleInfo: result,
			});
		} catch (error) {
			console.error("Assign role error:", error);
			return res
				.status(400)
				.json({ error: error.message || "Failed to assign role" });
		}
	}

	static async removeRole(req, res) {
		try {
			const { userId, entityType, entityId, role } = req.body;

			if (!userId || !entityType || !entityId || !role) {
				return res.status(400).json({
					error: "User ID, entity type, entity ID, and role are required",
				});
			}

			// Similar permission check as in assignRole would be needed here

			await UserService.removeRole(userId, entityType, entityId, role);

			return res.json({ message: "Role removed successfully" });
		} catch (error) {
			console.error("Remove role error:", error);
			return res
				.status(400)
				.json({ error: error.message || "Failed to remove role" });
		}
	}

	static async searchUsers(req, res) {
		try {
			const { query, limit = 10 } = req.query;

			if (!query) {
				return res.status(400).json({ error: "Search query is required" });
			}

			const users = await UserService.searchUsers(query, parseInt(limit));

			return res.json(users);
		} catch (error) {
			console.error("Search users error:", error);
			return res.status(500).json({ error: "Failed to search users" });
		}
	}

	static async getUsersByEntity(req, res) {
		try {
			const { entityType, entityId, role } = req.query;

			if (!entityType || !entityId) {
				return res.status(400).json({
					error: "Entity type and entity ID are required",
				});
			}

			const users = await UserService.getUsersByEntity(
				entityType,
				entityId,
				role
			);

			return res.json(users);
		} catch (error) {
			console.error("Get users by entity error:", error);
			return res
				.status(400)
				.json({ error: error.message || "Failed to get users" });
		}
	}
}

export default UserController;
