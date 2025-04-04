import pool from "../config/database.js";

class Course {
	static async findById(id) {
		const result = await pool.query(
			`SELECT c.*, 
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

		return result.rows[0];
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
		const result = await pool.query(
			"SELECT * FROM modules WHERE course_id = $1 ORDER BY position",
			[courseId]
		);

		return result.rows;
	}

	static async getModulesWithContent(courseId) {
		// First get all modules
		const modules = await this.getModules(courseId);

		// For each module, get content items
		for (const module of modules) {
			module.content_items = await this.getContentItems(module.id);
		}

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
		return result.rows;
	}

	static async getUserEnrollment(courseId, userId) {
		const result = await pool.query(
			"SELECT * FROM enrollments WHERE course_id = $1 AND user_id = $2",
			[courseId, userId]
		);

		return result.rows[0] || null;
	}

	static async userHasAccess(courseId, userId) {
		// Check if user is system admin
		const adminCheck = await pool.query(
			"SELECT 1 FROM users WHERE id = $1 AND is_system_admin = true",
			[userId]
		);

		if (adminCheck.rows.length > 0) {
			return true;
		}

		// Check if user is enrolled
		const enrollmentCheck = await pool.query(
			"SELECT 1 FROM enrollments WHERE course_id = $1 AND user_id = $2 AND status != 'dropped'",
			[courseId, userId]
		);

		if (enrollmentCheck.rows.length > 0) {
			return true;
		}

		// Check if user is course owner or has admin/instructor role
		const courseCheck = await pool.query(
			`SELECT 1 
			FROM courses c
			LEFT JOIN user_roles ur ON 
				(ur.entity_type = c.owner_type AND ur.entity_id = c.owner_id AND ur.user_id = $2 AND ur.status = 'active' AND (ur.role = 'admin' OR ur.role = 'instructor'))
			WHERE c.id = $1 AND (c.owner_type = 'user' AND c.owner_id = $2 OR ur.id IS NOT NULL)`,
			[courseId, userId]
		);

		return courseCheck.rows.length > 0;
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

	// Add these methods to the Course class in src/models/courseModel.js

	static async getMostEnrolledCourses(limit = 5) {
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
		return result.rows;
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
