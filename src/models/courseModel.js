import pool from "../config/database.js";

import courseCache from "../../utils/courseCache.js";

class Course {
	static async findById(id) {
		const cachedCourse = courseCache.getCachedCourse(id);
		if (cachedCourse) {
			return cachedCourse;
		}

		const result = await pool.query(
			`SELECT c.id, c.title, c.description, c.thumbnail_url, c.owner_type, c.owner_id, c.is_public,
			CASE 
				WHEN c.owner_type = 'client' THEN cl.name
				WHEN c.owner_type = 'department' THEN d.name
				WHEN c.owner_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
				ELSE 'System'
			END as owner_name
			FROM courses c
			LEFT JOIN clients cl ON c.owner_type = 'client' AND c.owner_id = cl.id
			LEFT JOIN departments d ON c.owner_type = 'department' AND c.owner_id = d.id
			LEFT JOIN users u ON c.owner_type = 'user' AND c.owner_id = u.id
			WHERE c.id = $1`,
			[id]
		);

		const course = result.rows[0];
		if (course) {
			courseCache.cacheCourse(id, course);
		}

		return course;
	}

	static async findAll(filters = {}) {
		const { userId, ownerType, ownerId, isPublic } = filters;

		let query = `
			SELECT c.*, 
				CASE 
				WHEN c.owner_type = 'client' THEN cl.name
				WHEN c.owner_type = 'department' THEN d.name
				WHEN c.owner_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
				ELSE 'System'
				END as owner_name
			FROM courses c
			LEFT JOIN clients cl ON c.owner_type = 'client' AND c.owner_id = cl.id
			LEFT JOIN departments d ON c.owner_type = 'department' AND c.owner_id = d.id
			LEFT JOIN users u ON c.owner_type = 'user' AND c.owner_id = u.id
			WHERE 1=1
			`;

		const queryParams = [];
		let paramIndex = 1;

		if (ownerType && ownerId) {
			query += ` AND c.owner_type = $${paramIndex} AND c.owner_id = $${
				paramIndex + 1
			}`;
			queryParams.push(ownerType, ownerId);
			paramIndex += 2;
		}

		if (isPublic !== undefined) {
			query += ` AND c.is_public = $${paramIndex}`;
			queryParams.push(isPublic);
			paramIndex += 1;
		}

		// If user ID is provided, find courses the user has access to
		if (userId) {
			query += `
				AND (
				c.is_public = true
				OR (c.owner_type = 'user' AND c.owner_id = $${paramIndex})
				OR EXISTS (
					SELECT 1 FROM enrollments e
					WHERE e.course_id = c.id AND e.user_id = $${paramIndex} AND e.status != 'dropped'
				)
				OR EXISTS (
					SELECT 1 FROM user_roles ur
					WHERE ur.user_id = $${paramIndex}
					AND ur.status = 'active'
					AND (
						(ur.role = 'admin' AND ur.entity_type = c.owner_type AND ur.entity_id = c.owner_id)
						OR (ur.role = 'instructor' AND ur.entity_type = c.owner_type AND ur.entity_id = c.owner_id)
					)
				)
				)
			`;
			queryParams.push(userId);
		}

		query += " ORDER BY c.title";

		const result = await pool.query(query, queryParams);
		return result.rows;
	}

	static async create(courseData) {
		const { title, description, thumbnailUrl, ownerType, ownerId, isPublic } =
			courseData;

		const result = await pool.query(
			"INSERT INTO courses (title, description, thumbnail_url, owner_type, owner_id, is_public) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
			[title, description, thumbnailUrl, ownerType, ownerId, isPublic]
		);

		return result.rows[0];
	}

	static async update(id, courseData) {
		const { title, description, thumbnailUrl, isPublic } = courseData;

		const result = await pool.query(
			`UPDATE courses 
			SET title = COALESCE($1, title),
				description = COALESCE($2, description),
				thumbnail_url = COALESCE($3, thumbnail_url),
				is_public = COALESCE($4, is_public),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $5
			RETURNING *`,
			[title, description, thumbnailUrl, isPublic, id]
		);

		courseCache.invalidateCourseCache(id);

		return result.rows[0];
	}

	static async delete(id) {
		const result = await pool.query(
			"DELETE FROM courses WHERE id = $1 RETURNING *",
			[id]
		);
		return result.rows[0];
	}

	static async getModules(courseId) {
		const cachedModules = courseCache.getCachedModules(courseId);
		if (cachedModules) {
			return cachedModules;
		}

		const result = await pool.query(
			"SELECT * FROM modules WHERE course_id = $1 ORDER BY position",
			[courseId]
		);

		const modules = result.rows;
		courseCache.cacheModules(courseId, modules);

		return modules;
	}

	static async getModulesWithContent(courseId) {
		// First get all modules
		const modules = await this.getModules(courseId);

		// For each module, get content items
		const contentPromises = modules.map((module) =>
			this.getContentItems(module.id)
		);

		const contentResults = await Promise.all(contentPromises);

		modules.forEach((module, index) => {
			module.content_items = contentResults[index];
		});

		return modules;
	}

	static async createModule(moduleData) {
		const { course_id, title, position } = moduleData;

		const result = await pool.query(
			"INSERT INTO modules (course_id, title, position) VALUES ($1, $2, $3) RETURNING *",
			[course_id, title, position]
		);

		return result.rows[0];
	}

	static async getContentItems(moduleId) {
		const result = await pool.query(
			"SELECT * FROM content_items WHERE module_id = $1 ORDER BY position",
			[moduleId]
		);

		return result.rows;
	}

	static async createContentItem(moduleId, contentItemData) {
		const { title, contentType, content, position } = contentItemData;

		const result = await pool.query(
			"INSERT INTO content_items (module_id, title, content_type, content, position) VALUES ($1, $2, $3, $4, $5) RETURNING *",
			[moduleId, title, contentType, content, position]
		);

		return result.rows[0];
	}

	static async getEnrollments(courseId, status = null) {
		const cachedCourseEnrollments =
			courseCache.getCachedCourseEnrollments(courseId);
		if (cachedCourseEnrollments) {
			const enrollment = cachedCourseEnrollments.find(
				(e) => e.course_id === courseId
			);
			if (enrollment) return enrollment;
		}
		let query = `
			SELECT e.*, u.first_name, u.last_name, u.email
			FROM enrollments e
			JOIN users u ON e.user_id = u.id
			WHERE e.course_id = $1
			`;

		const queryParams = [courseId];

		if (status) {
			query += " AND e.status = $2";
			queryParams.push(status);
		}

		query += " ORDER BY u.last_name, u.first_name";

		const result = await pool.query(query, queryParams);
		const courseEnrollments = result.rows;
		courseCache.cacheCourseEnrollments(courseId, courseEnrollments);

		return courseEnrollments;
	}

	static async getUserEnrollment(courseId, userId) {
		const cachedUserEnrollments = courseCache.getCachedUserEnrollments(userId);
		if (cachedUserEnrollments) {
			const enrollment = cachedUserEnrollments.find(
				(e) => e.course_id === courseId
			);
			if (enrollment) return enrollment;
		}

		const result = await pool.query(
			"SELECT * FROM enrollments WHERE course_id = $1 AND user_id = $2",
			[courseId, userId]
		);

		const userEnrollments = result.rows;
		courseCache.cacheUserEnrollments(userId, userEnrollments);

		return userEnrollments;
	}

	static async userHasAccess(courseId, userId) {
		const cachedAccess = courseCache.getCachedAccess(userId, courseId);
		if (cachedAccess !== undefined) {
			return cachedAccess;
		}

		const result = await pool.query(
			`
			SELECT EXISTS (
				SELECT 1 FROM users WHERE id = $1 AND is_system_admin = true
			) OR EXISTS (
				SELECT 1 FROM enrollments WHERE course_id = $2 AND user_id = $1 AND status != 'dropped'
			) OR EXISTS (
				SELECT 1 FROM courses c
				JOIN user_roles ur ON 
				(ur.entity_type = c.owner_type AND ur.entity_id = c.owner_id AND ur.user_id = $1
					AND ur.status = 'active' AND (ur.role = 'admin' OR ur.role = 'instructor'))
				WHERE c.id = $2
			) OR EXISTS (
				SELECT 1 FROM courses WHERE id = $2 AND owner_type = 'user' AND owner_id = $1
			) as has_access`,
			[userId, courseId]
		);

		const hasAccess = result.rows[0].has_access;

		courseCache.cacheAccess(userId, courseId, hasAccess);

		return hasAccess;
	}

	static async userCanAccessOwnerContent(ownerType, ownerId, userId) {
		const adminCheck = await pool.query(
			"SELECT 1 FROM users WHERE id = $1 AND is_system_admin = true",
			[userId]
		);

		if (adminCheck.rows.length > 0) {
			return true;
		}

		const roleCheck = await pool.query(
			"SELECT 1 FROM user_roles WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 AND status = 'active' AND role IN ('admin', 'instructor')",
			[userId, ownerType, ownerId]
		);

		return roleCheck.rows.length > 0;
	}

	static async userCanEdit(courseId, userId) {
		// Check if user is system admin
		const adminCheck = await pool.query(
			"SELECT 1 FROM users WHERE id = $1 AND is_system_admin = true",
			[userId]
		);

		if (adminCheck.rows.length > 0) {
			return true;
		}

		// Check if user is course owner or has admin role
		const courseCheck = await pool.query(
			`SELECT 1 
			FROM courses c
			LEFT JOIN user_roles ur ON 
				(ur.entity_type = c.owner_type AND ur.entity_id = c.owner_id AND ur.user_id = $2 AND ur.status = 'active' AND ur.role = 'admin')
			WHERE c.id = $1 AND (c.owner_type = 'user' AND c.owner_id = $2 OR ur.id IS NOT NULL)`,
			[courseId, userId]
		);

		return courseCheck.rows.length > 0;
	}

	static async getNextModulePosition(courseId) {
		const result = await pool.query(
			"SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM modules WHERE course_id = $1",
			[courseId]
		);

		return result.rows[0].next_position;
	}

	static async updateModuleOrder(moduleOrderData) {
		const client = await pool.connect();

		try {
			await client.query("BEGIN");

			for (const item of moduleOrderData) {
				await client.query(
					"UPDATE modules SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
					[item.position, item.id]
				);
			}

			await client.query("COMMIT");
			return true;
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	}

	static async deleteAllRelated(courseId) {
		const client = await pool.connect();

		try {
			await client.query("BEGIN");

			// Delete progress records related to enrollments in this course
			await client.query(
				`
				DELETE FROM progress_records 
				WHERE enrollment_id IN (
					SELECT id FROM enrollments WHERE course_id = $1
				)`,
				[courseId]
			);

			// Delete enrollments
			await client.query("DELETE FROM enrollments WHERE course_id = $1", [
				courseId,
			]);

			// Delete content items in all modules
			await client.query(
				`
				DELETE FROM content_items 
				WHERE module_id IN (
					SELECT id FROM modules WHERE course_id = $1
				)`,
				[courseId]
			);

			// Delete modules
			await client.query("DELETE FROM modules WHERE course_id = $1", [
				courseId,
			]);

			await client.query("COMMIT");
			return true;
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	}

	static async search(searchTerm, filters = {}, limit = 20, offset = 0) {
		const { userId, ownerType, ownerId, isPublic } = filters;

		let query = `
			SELECT c.*, 
				CASE 
					WHEN c.owner_type = 'client' THEN cl.name
					WHEN c.owner_type = 'department' THEN d.name
					WHEN c.owner_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
					ELSE 'System'
				END as owner_name
			FROM courses c
			LEFT JOIN clients cl ON c.owner_type = 'client' AND c.owner_id = cl.id
			LEFT JOIN departments d ON c.owner_type = 'department' AND c.owner_id = d.id
			LEFT JOIN users u ON c.owner_type = 'user' AND c.owner_id = u.id
			WHERE (c.title ILIKE $1 OR c.description ILIKE $1)
		`;

		const queryParams = [`%${searchTerm}%`];
		let paramIndex = 2;

		if (ownerType && ownerId) {
			query += ` AND c.owner_type = $${paramIndex} AND c.owner_id = $${
				paramIndex + 1
			}`;
			queryParams.push(ownerType, ownerId);
			paramIndex += 2;
		}

		if (isPublic !== undefined) {
			query += ` AND c.is_public = $${paramIndex}`;
			queryParams.push(isPublic);
			paramIndex += 1;
		}

		// If user ID is provided, find courses the user has access to
		if (userId) {
			query += `
				AND (
					c.is_public = true
					OR (c.owner_type = 'user' AND c.owner_id = $${paramIndex})
					OR EXISTS (
						SELECT 1 FROM enrollments e
						WHERE e.course_id = c.id AND e.user_id = $${paramIndex} AND e.status != 'dropped'
					)
					OR EXISTS (
						SELECT 1 FROM user_roles ur
						WHERE ur.user_id = $${paramIndex}
							AND ur.status = 'active'
							AND (
								(ur.role = 'admin' AND ur.entity_type = c.owner_type AND ur.entity_id = c.owner_id)
								OR (ur.role = 'instructor' AND ur.entity_type = c.owner_type AND ur.entity_id = c.owner_id)
							)
					)
				)
			`;
			queryParams.push(userId);
			paramIndex += 1;
		}

		query += ` ORDER BY c.title LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
		queryParams.push(limit, offset);

		const result = await pool.query(query, queryParams);
		return result.rows;
	}

	static async getUserCourses(userId, filters = {}) {
		// Add userId to filters
		filters.userId = userId;

		return this.findAll(filters);
	}

	static async getMostEnrolledCourses(limit = 5) {
		const cacheKey = `popular:${limit}`;
		const cachedCourses = courseCache.get(cacheKey);
		if (cachedCourses) {
			return cachedCourses;
		}

		const query = `
			SELECT c.*, 
				CASE 
				WHEN c.owner_type = 'client' THEN cl.name
				WHEN c.owner_type = 'department' THEN d.name
				WHEN c.owner_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
				ELSE 'System'
				END as owner_name,
				COUNT(e.id) as enrollment_count
			FROM courses c
			LEFT JOIN clients cl ON c.owner_type = 'client' AND c.owner_id = cl.id
			LEFT JOIN departments d ON c.owner_type = 'department' AND c.owner_id = d.id
			LEFT JOIN users u ON c.owner_type = 'user' AND c.owner_id = u.id
			LEFT JOIN enrollments e ON c.id = e.course_id AND e.status != 'dropped'
			WHERE c.is_public = true
			GROUP BY c.id, cl.name, d.name, u.first_name, u.last_name
			ORDER BY enrollment_count DESC
			LIMIT $1
			`;

		const result = await pool.query(query, [limit]);
		const courses = result.rows;

		// Cache with longer TTL (1 hour)
		courseCache.set(cacheKey, courses, 3600);

		return courses;
	}

	static async getRecentCourses(limit = 5) {
		const query = `
			SELECT c.*, 
			CASE 
				WHEN c.owner_type = 'client' THEN cl.name
				WHEN c.owner_type = 'department' THEN d.name
				WHEN c.owner_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
				ELSE 'System'
			END as owner_name
			FROM courses c
			LEFT JOIN clients cl ON c.owner_type = 'client' AND c.owner_id = cl.id
			LEFT JOIN departments d ON c.owner_type = 'department' AND c.owner_id = d.id
			LEFT JOIN users u ON c.owner_type = 'user' AND c.owner_id = u.id
			WHERE c.is_public = true
			ORDER BY c.created_at DESC
			LIMIT $1
		`;

		const result = await pool.query(query, [limit]);
		return result.rows;
	}
}

export default Course;
