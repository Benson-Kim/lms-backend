import pool from "../../config/database";

class Content {
	static async findById(contentItemId) {
		const result = await pool.query(
			"SELECT * FROM content_items WHERE id = $1",
			[contentItemId],
		);
		return result.rows[0];
	}

	static async getByModuleId(moduleId) {
		const result = await pool.query(
			"SELECT * FROM content_items WHERE module_id = $1 ORDER BY position",
			[moduleId],
		);
		return result.rows;
	}

	static async getModuleById(moduleId) {
		const result = await pool.query(
			`SELECT m.*, c.id as course_id, c.title as course_title, 
			c.owner_type, c.owner_id, c.is_public 
			FROM modules m 
			JOIN courses c ON m.course_id = c.id 
			WHERE m.id = $1`,
			[moduleId],
		);
		return result.rows[0];
	}

	static async create(contentData) {
		const { module_id, title, content_type, content, position } = contentData;

		// Validate content JSON based on content_type
		this.validateContentFormat(content_type, content);

		const result = await pool.query(
			"INSERT INTO content_items (module_id, title, content_type, content, position) VALUES ($1, $2, $3, $4, $5) RETURNING *",
			[module_id, title, content_type, content, position],
		);

		return result.rows[0];
	}

	static validateContentFormat(contentType, content) {
		// Basic validation of content format
		switch (contentType) {
			case "text":
				if (!content.text) {
					throw new Error("Text content is required");
				}
				break;
			case "video":
				if (!content.url) {
					throw new Error("Video URL is required");
				}
				break;
			case "quiz":
				if (
					!content.questions ||
					!Array.isArray(content.questions) ||
					content.questions.length === 0
				) {
					throw new Error("Quiz must contain at least one question");
				}
				break;
			case "assignment":
				if (!content.description) {
					throw new Error("Assignment description is required");
				}
				break;
			default:
				throw new Error(`Unsupported content type: ${contentType}`);
		}
	}

	static async update(contentItemId, contentData) {
		const { title, content_type, content } = contentData;

		// Get current content item to check if content_type is changing
		const currentItem = await this.findById(contentItemId);
		if (!currentItem) {
			throw new Error("Content item not found");
		}

		// If content type is changing or content is provided, validate new content
		if (
			(content_type && content_type !== currentItem.content_type) ||
			content
		) {
			this.validateContentFormat(
				content_type || currentItem.content_type,
				content || currentItem.content,
			);
		}

		const result = await pool.query(
			`UPDATE content_items 
       SET title = COALESCE($1, title),
           content_type = COALESCE($2, content_type),
           content = COALESCE($3, content),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
			[title, content_type, content, contentItemId],
		);

		return result.rows[0];
	}

	static async delete(contentItemId) {
		// First delete related progress records
		await this.deleteProgressRecords(contentItemId);

		// Then delete the content item
		const result = await pool.query(
			"DELETE FROM content_items WHERE id = $1 RETURNING *",
			[contentItemId],
		);

		return result.rows[0];
	}

	static async deleteProgressRecords(contentItemId) {
		await pool.query(
			"DELETE FROM progress_records WHERE content_item_id = $1",
			[contentItemId],
		);
		return true;
	}

	static async getNextContentPosition(moduleId) {
		const result = await pool.query(
			"SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM content_items WHERE module_id = $1",
			[moduleId],
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
					[item.position, item.id],
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
			[courseId],
		);

		return result.rows;
	}

	static async getContentStats(contentItemId) {
		const result = await pool.query(
			`SELECT 
         COUNT(pr.id) as total_attempts,
         AVG(pr.score) as average_score,
         AVG(pr.time_spent) as average_time_spent,
         COUNT(CASE WHEN pr.status = 'completed' THEN 1 END) as completed_count,
         COUNT(DISTINCT pr.enrollment_id) as unique_students
       FROM progress_records pr
       WHERE pr.content_item_id = $1`,
			[contentItemId],
		);

		return result.rows[0];
	}

	static async getUserContentProgress(contentItemId, userId) {
		const result = await pool.query(
			`SELECT pr.* 
			FROM progress_records pr
			JOIN enrollments e ON pr.enrollment_id = e.id
			WHERE pr.content_item_id = $1 AND e.user_id = $2
			ORDER BY pr.created_at DESC
			LIMIT 1`,
			[contentItemId, userId],
		);

		return result.rows[0];
	}

	static async getModuleProgress(moduleId, userId) {
		const result = await pool.query(
			`SELECT 
				ci.id as content_item_id,
				ci.title,
				ci.content_type,
				pr.status,
				pr.score,
				pr.time_spent,
				pr.completed_at
			FROM content_items ci
			LEFT JOIN (
				SELECT pr.*
				FROM progress_records pr
				JOIN enrollments e ON pr.enrollment_id = e.id
				WHERE e.user_id = $2
			) pr ON ci.id = pr.content_item_id
			WHERE ci.module_id = $1
			ORDER BY ci.position`,
			[moduleId, userId],
		);

		return result.rows;
	}

	static async updateProgressRecord(
		enrollmentId,
		contentItemId,
		gradeData,
		graderId,
	) {
		const progressRecord = await pool.query(
			"SELECT * FROM progress_records WHERE enrollment_id = $1 AND content_item_id = $2",
			[enrollmentId, contentItemId],
		);

		if (progressRecord.rows.length === 0) {
			throw new Error("No submission found for this student");
		}

		// Update the progress record with grade
		const result = await pool.query(
			`UPDATE progress_records 
             SET status = 'completed', 
                 score = $1, 
                 completed_at = CURRENT_TIMESTAMP,
                 data = jsonb_set(
                     COALESCE(data, '{}'::jsonb), 
                     '{feedback}', 
                     $2::jsonb
                 ),
                 updated_at = CURRENT_TIMESTAMP
             WHERE enrollment_id = $3 AND content_item_id = $4
             RETURNING *`,
			[
				gradeData.score,
				JSON.stringify({
					feedback: gradeData.feedback,
					gradedBy: graderId,
					gradedAt: new Date(),
				}),
				enrollmentId,
				contentItemId,
			],
		);

		return result.rows[0];
	}
}

export default Content;
