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

	static async getModules(courseId) {
		const result = await pool.query(
			"SELECT * FROM modules WHERE course_id = $1 ORDER BY position",
			[courseId]
		);

		return result.rows;
	}

	static async createModule(courseId, title, position) {
		const result = await pool.query(
			"INSERT INTO modules (course_id, title, position) VALUES ($1, $2, $3) RETURNING *",
			[courseId, title, position]
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
}

export default Course;
