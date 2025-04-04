import pool from "../config/database.js";

class Enrollment {
	static async findById(id) {
		const result = await pool.query(
			`SELECT e.*, c.title as course_title, u.first_name, u.last_name, u.email
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.user_id = u.id
       WHERE e.id = $1`,
			[id]
		);

		return result.rows[0];
	}

	static async findByUserAndCourse(userId, courseId) {
		const result = await pool.query(
			"SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2",
			[userId, courseId]
		);

		return result.rows[0];
	}

	static async getUserEnrollments(userId, status = null) {
		let query = `
      SELECT e.*, c.title, c.description, c.thumbnail_url
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = $1
    `;

		const queryParams = [userId];

		if (status) {
			query += " AND e.status = $2";
			queryParams.push(status);
		}

		query += " ORDER BY e.enrolled_at DESC";

		const result = await pool.query(query, queryParams);
		return result.rows;
	}

	static async create(userId, courseId) {
		// Check if enrollment already exists
		const existingEnrollment = await this.findByUserAndCourse(userId, courseId);

		if (existingEnrollment) {
			if (existingEnrollment.status === "dropped") {
				// Reactivate dropped enrollment
				return this.updateStatus(existingEnrollment.id, "enrolled");
			}
			return existingEnrollment;
		}

		const result = await pool.query(
			"INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) RETURNING *",
			[userId, courseId]
		);

		return result.rows[0];
	}

	static async updateStatus(id, status) {
		let query =
			"UPDATE enrollments SET status = $1, updated_at = CURRENT_TIMESTAMP";

		// If status is 'completed', set completed_at timestamp
		if (status === "completed") {
			query += ", completed_at = CURRENT_TIMESTAMP";
		}

		query += " WHERE id = $2 RETURNING *";

		const result = await pool.query(query, [status, id]);
		return result.rows[0];
	}

	static async updateProgress(id, progress) {
		const result = await pool.query(
			"UPDATE enrollments SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
			[progress, id]
		);

		return result.rows[0];
	}

	static async getProgressRecords(enrollmentId) {
		const result = await pool.query(
			`SELECT pr.*, ci.title, ci.content_type, m.title as module_title
       FROM progress_records pr
       JOIN content_items ci ON pr.content_item_id = ci.id
       JOIN modules m ON ci.module_id = m.id
       WHERE pr.enrollment_id = $1
       ORDER BY m.position, ci.position`,
			[enrollmentId]
		);

		return result.rows;
	}

	static async createProgressRecord(progressData) {
		const { enrollmentId, contentItemId, status, score, timeSpent } =
			progressData;

		// Check if record already exists
		const existingRecord = await pool.query(
			"SELECT id FROM progress_records WHERE enrollment_id = $1 AND content_item_id = $2",
			[enrollmentId, contentItemId]
		);

		if (existingRecord.rows.length > 0) {
			// Update existing record
			let query = `
        UPDATE progress_records 
        SET status = $1, 
            score = COALESCE($2, score), 
            time_spent = COALESCE($3, time_spent),
            updated_at = CURRENT_TIMESTAMP
      `;

			const queryParams = [status, score, timeSpent];

			// If status is 'completed', set completed_at timestamp
			if (status === "completed") {
				query += ", completed_at = CURRENT_TIMESTAMP";
			}

			query += " WHERE id = $4 RETURNING *";
			queryParams.push(existingRecord.rows[0].id);

			const result = await pool.query(query, queryParams);
			return result.rows[0];
		}

		// Create new record
		let query = `
      INSERT INTO progress_records 
      (enrollment_id, content_item_id, status, score, time_spent
    `;

		const queryParams = [enrollmentId, contentItemId, status, score, timeSpent];

		// If status is 'completed', include completed_at field
		if (status === "completed") {
			query +=
				", completed_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *";
		} else {
			query += ") VALUES ($1, $2, $3, $4, $5) RETURNING *";
		}

		const result = await pool.query(query, queryParams);
		return result.rows[0];
	}

	static async calculateOverallProgress(enrollmentId) {
		// Get content items for the enrollment's course
		const enrollmentQuery = await pool.query(
			"SELECT course_id FROM enrollments WHERE id = $1",
			[enrollmentId]
		);

		if (enrollmentQuery.rows.length === 0) {
			return 0;
		}

		const courseId = enrollmentQuery.rows[0].course_id;

		// Get all content items for the course
		const contentItemsQuery = await pool.query(
			`SELECT ci.id
       FROM content_items ci
       JOIN modules m ON ci.module_id = m.id
       WHERE m.course_id = $1`,
			[courseId]
		);

		const totalItems = contentItemsQuery.rows.length;

		if (totalItems === 0) {
			return 0;
		}

		// Get completed items
		const completedItemsQuery = await pool.query(
			`SELECT COUNT(*) as completed
       FROM progress_records pr
       JOIN content_items ci ON pr.content_item_id = ci.id
       JOIN modules m ON ci.module_id = m.id
       WHERE pr.enrollment_id = $1 AND pr.status = 'completed' AND m.course_id = $2`,
			[enrollmentId, courseId]
		);

		const completedItems = parseInt(completedItemsQuery.rows[0].completed);

		// Calculate progress percentage
		const progress = Math.round((completedItems / totalItems) * 100) / 100;

		// Update enrollment record
		await this.updateProgress(enrollmentId, progress);

		return progress;
	}
}

export default Enrollment;
