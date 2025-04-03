const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

class UserService {
	static async getUserProfile(userId) {
		const user = await User.findById(userId);

		if (!user) {
			throw new Error("User not found");
		}

		// Get user roles
		const roles = await User.getUserRoles(userId);

		return {
			...user,
			roles,
		};
	}

	static async updateUserProfile(userId, userData) {
		const updatedUser = await User.update(userId, userData);

		if (!updatedUser) {
			throw new Error("Failed to update user profile");
		}

		return updatedUser;
	}

	static async changePassword(userId, currentPassword, newPassword) {
		// Get user with password
		const userResult = await global.db.query(
			"SELECT id, password FROM users WHERE id = $1",
			[userId]
		);

		if (userResult.rows.length === 0) {
			throw new Error("User not found");
		}

		const user = userResult.rows[0];

		// Verify current password
		const isPasswordValid = await bcrypt.compare(
			currentPassword,
			user.password
		);

		if (!isPasswordValid) {
			throw new Error("Current password is incorrect");
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		// Update password
		await global.db.query(
			"UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
			[hashedPassword, userId]
		);

		return { success: true };
	}

	static async assignRole(userId, entityType, entityId, role) {
		// Validate entity exists
		let entityExists = false;

		if (entityType === "client") {
			const clientResult = await global.db.query(
				"SELECT id FROM clients WHERE id = $1",
				[entityId]
			);
			entityExists = clientResult.rows.length > 0;
		} else if (entityType === "department") {
			const deptResult = await global.db.query(
				"SELECT id FROM departments WHERE id = $1",
				[entityId]
			);
			entityExists = deptResult.rows.length > 0;
		} else if (entityType === "group") {
			const groupResult = await global.db.query(
				"SELECT id FROM groups WHERE id = $1",
				[entityId]
			);
			entityExists = groupResult.rows.length > 0;
		}

		if (!entityExists) {
			throw new Error(`${entityType} with ID ${entityId} not found`);
		}

		// Validate role for entity type
		const validRoles = {
			client: ["admin", "instructor", "student", "member"],
			department: ["admin", "instructor", "student", "member"],
			group: ["admin", "instructor", "student", "member"],
		};

		if (!validRoles[entityType] || !validRoles[entityType].includes(role)) {
			throw new Error(`Invalid role "${role}" for entity type "${entityType}"`);
		}

		return User.assignRole(userId, entityType, entityId, role);
	}

	static async removeRole(userId, entityType, entityId, role) {
		return User.removeRole(userId, entityType, entityId, role);
	}

	static async getUsersByEntity(entityType, entityId, role = null) {
		let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.profile_image, ur.role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.entity_type = $1 AND ur.entity_id = $2
    `;

		const params = [entityType, entityId];

		if (role) {
			query += " AND ur.role = $3";
			params.push(role);
		}

		const result = await global.db.query(query, params);
		return result.rows;
	}

	static async searchUsers(searchTerm, limit = 10) {
		const query = `
      SELECT id, email, first_name, last_name, profile_image
      FROM users
      WHERE 
        email ILIKE $1 OR
        first_name ILIKE $1 OR
        last_name ILIKE $1
      LIMIT $2
    `;

		const result = await global.db.query(query, [`%${searchTerm}%`, limit]);
		return result.rows;
	}

	static async createUser(userData) {
		// Check if email already exists
		const existingUser = await User.findByEmail(userData.email);

		if (existingUser) {
			throw new Error("Email already in use");
		}

		// Hash password
		userData.password = await bcrypt.hash(userData.password, 10);

		// Create user
		const newUser = await User.create(userData);

		// Remove password from returned user object
		delete newUser.password;

		return newUser;
	}
}

module.exports = UserService;
