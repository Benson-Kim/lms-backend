const jwt = require("jsonwebtoken");
const AuthService = require("../services/AuthService");

/**
 * Middleware to protect routes that require authentication
 */
const authenticate = async (req, res, next) => {
	try {
		// Get the token from the Authorization header
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const token = authHeader.split(" ")[1];

		// Verify the token
		const result = await AuthService.verifyAccessToken(token);

		if (!result.valid) {
			return res.status(401).json({ error: "Invalid or expired token" });
		}

		// Set the user ID in the request object
		req.userId = result.userId;

		// Continue to the next middleware or route handler
		next();
	} catch (error) {
		console.error("Authentication error:", error);
		res.status(401).json({ error: "Authentication failed" });
	}
};

/**
 * Middleware to check if the user has specific role
 * @param {string} entityType - 'client', 'department', or 'group'
 * @param {string} role - 'admin', 'instructor', etc.
 */
const hasRole = (entityType, role) => {
	return async (req, res, next) => {
		try {
			// First authenticate the user
			if (!req.userId) {
				return res.status(401).json({ error: "Authentication required" });
			}

			// Get the entity ID from the request parameters
			const entityId =
				req.params.clientId || req.params.departmentId || req.params.groupId;

			if (!entityId) {
				return res.status(400).json({ error: "Entity ID is required" });
			}

			// Get user roles
			const userRoles = await global.db.query(
				"SELECT * FROM user_roles WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 AND role = $4 AND status = 'active'",
				[req.userId, entityType, entityId, role]
			);

			if (userRoles.rows.length === 0) {
				return res.status(403).json({ error: "Permission denied" });
			}

			// User has the required role, proceed to the next middleware
			next();
		} catch (error) {
			console.error("Role check error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	};
};

/**
 * Middleware to check if the user is a system admin
 */
const isSystemAdmin = async (req, res, next) => {
	try {
		// First authenticate the user
		if (!req.userId) {
			return res.status(401).json({ error: "Authentication required" });
		}

		// Check if user is a system admin
		const userResult = await global.db.query(
			"SELECT is_system_admin FROM users WHERE id = $1",
			[req.userId]
		);

		if (userResult.rows.length === 0 || !userResult.rows[0].is_system_admin) {
			return res.status(403).json({ error: "Permission denied" });
		}

		// User is a system admin, proceed to the next middleware
		next();
	} catch (error) {
		console.error("System admin check error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Middleware to check if the user can access a course
 */
const canAccessCourse = async (req, res, next) => {
	try {
		// First authenticate the user
		if (!req.userId) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const courseId = req.params.courseId;

		if (!courseId) {
			return res.status(400).json({ error: "Course ID is required" });
		}

		// Get course info
		const courseResult = await global.db.query(
			"SELECT owner_type, owner_id, is_public FROM courses WHERE id = $1",
			[courseId]
		);

		if (courseResult.rows.length === 0) {
			return res.status(404).json({ error: "Course not found" });
		}

		const course = courseResult.rows[0];

		// If course is public, allow access
		if (course.is_public) {
			return next();
		}

		// Check if user is enrolled in the course
		const enrollmentResult = await global.db.query(
			"SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status != 'dropped'",
			[req.userId, courseId]
		);

		if (enrollmentResult.rows.length > 0) {
			return next();
		}

		// Check if user is an admin/instructor of the entity that owns the course
		const roleResult = await global.db.query(
			"SELECT id FROM user_roles WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 AND role IN ('admin', 'instructor') AND status = 'active'",
			[req.userId, course.owner_type, course.owner_id]
		);

		if (roleResult.rows.length > 0) {
			return next();
		}

		// Check if user is a system admin
		const adminResult = await global.db.query(
			"SELECT is_system_admin FROM users WHERE id = $1",
			[req.userId]
		);

		if (adminResult.rows.length > 0 && adminResult.rows[0].is_system_admin) {
			return next();
		}

		// User doesn't have access to the course
		return res.status(403).json({ error: "Access denied" });
	} catch (error) {
		console.error("Course access check error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Middleware to check if the user can edit a course
 */
const canEditCourse = async (req, res, next) => {
	try {
		// First authenticate the user
		if (!req.userId) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const courseId = req.params.courseId;

		if (!courseId) {
			return res.status(400).json({ error: "Course ID is required" });
		}

		// Get course info
		const courseResult = await global.db.query(
			"SELECT owner_type, owner_id FROM courses WHERE id = $1",
			[courseId]
		);

		if (courseResult.rows.length === 0) {
			return res.status(404).json({ error: "Course not found" });
		}

		const course = courseResult.rows[0];

		// If user is the owner (for user-owned courses)
		if (course.owner_type === "user" && course.owner_id === req.userId) {
			return next();
		}

		// Check if user is an admin/instructor of the entity that owns the course
		const roleResult = await global.db.query(
			"SELECT id FROM user_roles WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 AND role IN ('admin', 'instructor') AND status = 'active'",
			[req.userId, course.owner_type, course.owner_id]
		);

		if (roleResult.rows.length > 0) {
			return next();
		}

		// Check if user is a system admin
		const adminResult = await global.db.query(
			"SELECT is_system_admin FROM users WHERE id = $1",
			[req.userId]
		);

		if (adminResult.rows.length > 0 && adminResult.rows[0].is_system_admin) {
			return next();
		}

		// User doesn't have edit permissions
		return res.status(403).json({ error: "Permission denied" });
	} catch (error) {
		console.error("Course edit check error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

module.exports = {
	authenticate,
	hasRole,
	isSystemAdmin,
	canAccessCourse,
	canEditCourse,
};
