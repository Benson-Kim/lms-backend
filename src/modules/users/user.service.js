import bcrypt from "bcryptjs";
import User from "./user.model.js";

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
		// Input validation
		if (userData.firstName && typeof userData.firstName !== "string") {
			throw new Error("First name must be a string");
		}

		if (userData.lastName && typeof userData.lastName !== "string") {
			throw new Error("Last name must be a string");
		}

		if (userData.profileImage && typeof userData.profileImage !== "string") {
			throw new Error("Profile image URL must be a string");
		}

		const updatedUser = await User.update(userId, userData);

		if (!updatedUser) {
			throw new Error("Failed to update user profile");
		}

		return updatedUser;
	}

	static async changePassword(userId, currentPassword, newPassword) {
		// Validate password requirements
		if (!newPassword || newPassword.length < 8) {
			throw new Error("New password must be at least 8 characters long");
		}

		// Get user with password
		const user = await User.findByIdWithPassword(userId);

		if (!user) {
			throw new Error("User not found");
		}

		// Verify current password
		const isPasswordValid = await bcrypt.compare(
			currentPassword,
			user.password,
		);

		if (!isPasswordValid) {
			throw new Error("Current password is incorrect");
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		// Update password
		const result = await User.updatePassword(userId, hashedPassword);

		if (!result) {
			throw new Error("Failed to update password");
		}

		return { success: true };
	}

	static async assignRole(userId, entityType, entityId, role) {
		// Validate entity type
		const validEntityTypes = ["client", "department", "group"];
		if (!validEntityTypes.includes(entityType)) {
			throw new Error(`Invalid entity type: ${entityType}`);
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

		// Check user exists
		const user = await User.findById(userId);
		if (!user) {
			throw new Error(`User with ID ${userId} not found`);
		}

		// Check entity exists
		const entityExists = await User.checkEntityExists(entityType, entityId);
		if (!entityExists) {
			throw new Error(`${entityType} with ID ${entityId} not found`);
		}

		return User.assignRole(userId, entityType, entityId, role);
	}

	static async removeRole(userId, entityType, entityId, role) {
		// Validate entity type
		const validEntityTypes = ["client", "department", "group"];
		if (!validEntityTypes.includes(entityType)) {
			throw new Error(`Invalid entity type: ${entityType}`);
		}

		// Validate role
		const validRoles = ["admin", "instructor", "student", "member"];
		if (!validRoles.includes(role)) {
			throw new Error(`Invalid role: ${role}`);
		}

		const result = await User.removeRole(userId, entityType, entityId, role);

		if (!result) {
			throw new Error(`Role not found or already inactive`);
		}

		return result;
	}

	static async getUsersByEntity(entityType, entityId, role = null) {
		// Validate entity exists
		const entityExists = await User.checkEntityExists(entityType, entityId);
		if (!entityExists) {
			throw new Error(`${entityType} with ID ${entityId} not found`);
		}

		return User.getUsersByEntity(entityType, entityId, role);
	}

	static async searchUsers(searchTerm, limit = 10) {
		if (!searchTerm || typeof searchTerm !== "string") {
			throw new Error("Search term must be a non-empty string");
		}

		if (isNaN(limit) || limit < 1) {
			limit = 10;
		}

		return User.searchUsers(searchTerm, limit);
	}

	static async createUser(userData) {
		// Validate required fields
		const requiredFields = ["email", "password", "firstName", "lastName"];
		for (const field of requiredFields) {
			if (!userData[field]) {
				throw new Error(`${field} is required`);
			}
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(userData.email)) {
			throw new Error("Invalid email format");
		}

		// Validate password length
		if (userData.password.length < 8) {
			throw new Error("Password must be at least 8 characters long");
		}

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

export default UserService;
