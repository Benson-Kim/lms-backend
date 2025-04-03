const { pool } = require("../config/database");

class Content {
	static async findById(contentItemId) {
		const result = await pool.query(
			"SELECT * FROM content_items WHERE id = $1",
			[contentItemId]
		);
		return result.rows[0];
	}

	static async getByModuleId(moduleId) {
		const result = await pool.query(
			"SELECT * FROM content_items WHERE module_id = $1 ORDER BY position",
			[moduleId]
		);
		return result.rows;
	}

	static async getModuleById(moduleId) {
		const result = await pool.query(
			"SELECT m.*, c.id as course_id, c.title as course_title FROM modules m JOIN courses c ON m.course_id = c.id WHERE m.id = $1",
			[moduleId]
		);
		return result.rows[0];
	}

	static async create(contentData) {
		const { module_id, title, content_type, content, position } = contentData;

		const result = await pool.query(
			"INSERT INTO content_items (module_id, title, content_type, content, position) VALUES ($1, $2, $3, $4, $5) RETURNING *",
			[module_id, title, content_type, content, position]
		);

		return result.rows[0];
	}

	static async update(contentItemId, contentData) {
		const { title, content } = contentData;

		const result = await pool.query(
			`UPDATE content_items 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
			[title, content, contentItemId]
		);

		return result.rows[0];
	}

	static async delete(contentItemId) {
		// First delete related progress records
		await this.deleteProgressRecords(contentItemId);

		// Then delete the content item
		const result = await pool.query(
			"DELETE FROM content_items WHERE id = $1 RETURNING *",
			[contentItemId]
		);

		return result.rows[0];
	}

	static async deleteProgressRecords(contentItemId) {
		await pool.query(
			"DELETE FROM progress_records WHERE content_item_id = $1",
			[contentItemId]
		);
		return true;
	}

	static async getNextContentPosition(moduleId) {
		const result = await pool.query(
			"SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM content_items WHERE module_id = $1",
			[moduleId]
		);
		return result.rows[0].next_position;
	}

	static async updateContentOrder(orderData) {
		// Using a transaction to ensure all updates happen together
		const client = await pool.connect();

		try {
			await client.query("BEGIN");

			for (const item of orderData) {
				await client.query(
					"UPDATE content_items SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
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

	static async getCourseContentItems(courseId) {
		const result = await pool.query(
			`SELECT ci.* 
       FROM content_items ci
       JOIN modules m ON ci.module_id = m.id
       WHERE m.course_id = $1
       ORDER BY m.position, ci.position`,
			[courseId]
		);

		return result.rows;
	}

	static async getContentStats(contentItemId) {
		const result = await pool.query(
			`SELECT 
         COUNT(pr.id) as total_attempts,
         AVG(pr.score) as average_score,
         AVG(pr.time_spent) as average_time_spent,
         COUNT(CASE WHEN pr.status = 'completed' THEN 1 END) as completed_count
       FROM progress_records pr
       WHERE pr.content_item_id = $1`,
			[contentItemId]
		);

		return result.rows[0];
	}
}

module.exports = Content;
