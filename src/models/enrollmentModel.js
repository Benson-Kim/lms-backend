import pool from "../config/database.js";

class Enrollment {
	static async findById(id) {
		try {
			const result = await pool.query(
				`SELECT e.*, c.title as course_title, u.first_name, u.last_name, u.email
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         JOIN users u ON e.user_id = u.id
         WHERE e.id = $1`,
				[id]
			);

			return result.rows[0] || null;
		} catch (error) {
			console.error("Error in findById:", error);
			throw new Error(`Failed to find enrollment: ${error.message}`);
		}
	}

	static async findByUserAndCourse(userId, courseId) {
		try {
			const result = await pool.query(
				"SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2",
				[userId, courseId]
			);

			return result.rows[0] || null;
		} catch (error) {
			console.error("Error in findByUserAndCourse:", error);
			throw new Error(`Failed to find enrollment: ${error.message}`);
		}
	}

	static async getUserEnrollments(userId, status = null) {
		try {
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
		} catch (error) {
			console.error("Error in getUserEnrollments:", error);
			throw new Error(`Failed to get user enrollments: ${error.message}`);
		}
	}

	static async create(userId, courseId) {
		try {
			// Check if enrollment already exists
			const existingEnrollment = await this.findByUserAndCourse(
				userId,
				courseId
			);

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
		} catch (error) {
			console.error("Error in create:", error);
			throw new Error(`Failed to create enrollment: ${error.message}`);
		}
	}

	static async update(id, updateData) {
		try {
			const { status, progress } = updateData;
			let query = "UPDATE enrollments SET updated_at = CURRENT_TIMESTAMP";
			const values = [];
			let paramCounter = 1;

			if (status !== undefined) {
				query += `, status = $${paramCounter++}`;
				values.push(status);

				// If status is 'completed', set completed_at timestamp
				if (status === "completed") {
					query += ", completed_at = CURRENT_TIMESTAMP";
				}
			}

			if (progress !== undefined) {
				query += `, progress = $${paramCounter++}`;
				values.push(progress);
			}

			query += ` WHERE id = $${paramCounter} RETURNING *`;
			values.push(id);

			const result = await pool.query(query, values);
			return result.rows[0];
		} catch (error) {
			console.error("Error in update:", error);
			throw new Error(`Failed to update enrollment: ${error.message}`);
		}
	}

	static async updateStatus(id, status) {
		try {
			return this.update(id, { status });
		} catch (error) {
			console.error("Error in updateStatus:", error);
			throw new Error(`Failed to update enrollment status: ${error.message}`);
		}
	}

	static async updateProgress(id, progress) {
		try {
			return this.update(id, { progress });
		} catch (error) {
			console.error("Error in updateProgress:", error);
			throw new Error(`Failed to update enrollment progress: ${error.message}`);
		}
	}

	static async getProgressRecords(enrollmentId) {
		try {
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
		} catch (error) {
			console.error("Error in getProgressRecords:", error);
			throw new Error(`Failed to get progress records: ${error.message}`);
		}
	}

	static async getDetailedProgress(enrollmentId) {
		try {
			// Get the course ID for this enrollment
			const enrollmentQuery = await pool.query(
				"SELECT course_id FROM enrollments WHERE id = $1",
				[enrollmentId]
			);

			if (enrollmentQuery.rows.length === 0) {
				throw new Error("Enrollment not found");
			}

			const courseId = enrollmentQuery.rows[0].course_id;

			// Get all modules and content items for the course
			const moduleContentQuery = await pool.query(
				`SELECT m.id as module_id, m.title as module_title, m.position as module_position,
                ci.id as content_item_id, ci.title as content_title, 
                ci.content_type, ci.position as content_position
         FROM modules m
         JOIN content_items ci ON m.id = ci.module_id
         WHERE m.course_id = $1
         ORDER BY m.position, ci.position`,
				[courseId]
			);

			// Get progress records for this enrollment
			const progressQuery = await pool.query(
				`SELECT * FROM progress_records 
         WHERE enrollment_id = $1`,
				[enrollmentId]
			);

			// Create a map of content item ID to progress record
			const progressMap = {};
			progressQuery.rows.forEach((record) => {
				progressMap[record.content_item_id] = record;
			});

			// Organize data by modules
			const modules = [];
			let currentModule = null;

			moduleContentQuery.rows.forEach((row) => {
				// If this is a new module or the first row
				if (!currentModule || currentModule.id !== row.module_id) {
					if (currentModule) {
						modules.push(currentModule);
					}

					currentModule = {
						id: row.module_id,
						title: row.module_title,
						position: row.module_position,
						contentItems: [],
						completed: 0,
						total: 0,
					};
				}

				// Get progress for this content item
				const progress = progressMap[row.content_item_id] || {
					status: "not_started",
					score: null,
					time_spent: 0,
				};

				// Add content item with its progress
				currentModule.contentItems.push({
					id: row.content_item_id,
					title: row.content_title,
					type: row.content_type,
					position: row.content_position,
					status: progress.status,
					score: progress.score,
					timeSpent: progress.time_spent,
					completedAt: progress.completed_at,
				});

				// Update module completion stats
				currentModule.total++;
				if (progress.status === "completed") {
					currentModule.completed++;
				}
			});

			// Add the last module
			if (currentModule) {
				modules.push(currentModule);
			}

			// Calculate overall stats
			const totalItems = moduleContentQuery.rows.length;
			const completedItems = progressQuery.rows.filter(
				(r) => r.status === "completed"
			).length;
			const overallProgress = totalItems > 0 ? completedItems / totalItems : 0;

			return {
				modules,
				overallStats: {
					totalModules: modules.length,
					totalItems,
					completedItems,
					overallProgress,
				},
			};
		} catch (error) {
			console.error("Error in getDetailedProgress:", error);
			throw new Error(`Failed to get detailed progress: ${error.message}`);
		}
	}

	static async updateProgressRecord(enrollmentId, contentItemId, progressData) {
		try {
			const { status, score, timeSpent } = progressData;

			// Check if record already exists
			const existingRecord = await pool.query(
				"SELECT id FROM progress_records WHERE enrollment_id = $1 AND content_item_id = $2",
				[enrollmentId, contentItemId]
			);

			if (existingRecord.rows.length > 0) {
				// Update existing record
				let query = `
          UPDATE progress_records 
          SET status = $1, updated_at = CURRENT_TIMESTAMP
        `;

				const queryParams = [status];
				let paramCounter = 2;

				if (score !== undefined) {
					query += `, score = $${paramCounter++}`;
					queryParams.push(score);
				}

				if (timeSpent !== undefined) {
					query += `, time_spent = COALESCE(time_spent, 0) + $${paramCounter++}`;
					queryParams.push(timeSpent);
				}

				// If status is 'completed', set completed_at timestamp
				if (status === "completed") {
					query += ", completed_at = CURRENT_TIMESTAMP";
				}

				query += ` WHERE id = $${paramCounter} RETURNING *`;
				queryParams.push(existingRecord.rows[0].id);

				const result = await pool.query(query, queryParams);
				return result.rows[0];
			}

			// Create new record
			let fields = ["enrollment_id", "content_item_id", "status"];
			let values = [enrollmentId, contentItemId, status];
			let placeholders = ["$1", "$2", "$3"];
			let paramCounter = 4;

			if (score !== undefined) {
				fields.push("score");
				values.push(score);
				placeholders.push(`$${paramCounter++}`);
			}

			if (timeSpent !== undefined) {
				fields.push("time_spent");
				values.push(timeSpent);
				placeholders.push(`$${paramCounter++}`);
			}

			// If status is 'completed', include completed_at field
			if (status === "completed") {
				fields.push("completed_at");
				placeholders.push("CURRENT_TIMESTAMP");
			}

			const query = `
        INSERT INTO progress_records (${fields.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING *
      `;

			const result = await pool.query(query, values);
			return result.rows[0];
		} catch (error) {
			console.error("Error in updateProgressRecord:", error);
			throw new Error(`Failed to update progress record: ${error.message}`);
		}
	}

	static async calculateOverallProgress(enrollmentId) {
		try {
			// Get the course for this enrollment
			const enrollmentQuery = await pool.query(
				"SELECT course_id FROM enrollments WHERE id = $1",
				[enrollmentId]
			);

			if (enrollmentQuery.rows.length === 0) {
				throw new Error("Enrollment not found");
			}

			const courseId = enrollmentQuery.rows[0].course_id;

			// Get total content items for the course
			const contentItemsQuery = await pool.query(
				`SELECT COUNT(*) as total
         FROM content_items ci
         JOIN modules m ON ci.module_id = m.id
         WHERE m.course_id = $1`,
				[courseId]
			);

			const totalItems = parseInt(contentItemsQuery.rows[0].total);

			if (totalItems === 0) {
				// No content items, so progress is 0
				await this.updateProgress(enrollmentId, 0);
				return 0;
			}

			// Get completed items
			const completedItemsQuery = await pool.query(
				`SELECT COUNT(*) as completed
         FROM progress_records pr
         JOIN content_items ci ON pr.content_item_id = ci.id
         JOIN modules m ON ci.module_id = m.id
         WHERE pr.enrollment_id = $1 
         AND pr.status = 'completed' 
         AND m.course_id = $2`,
				[enrollmentId, courseId]
			);

			const completedItems = parseInt(completedItemsQuery.rows[0].completed);

			// Calculate progress percentage (0 to 1)
			const progress = totalItems > 0 ? completedItems / totalItems : 0;

			// Update enrollment record
			await this.updateProgress(enrollmentId, progress);

			// Check if the course is now complete
			if (completedItems === totalItems) {
				await this.updateStatus(enrollmentId, "completed");
			}

			return progress;
		} catch (error) {
			console.error("Error in calculateOverallProgress:", error);
			throw new Error(`Failed to calculate progress: ${error.message}`);
		}
	}

	static async getCourseStats(courseId) {
		try {
			// Get enrollment stats
			const statsQuery = await pool.query(
				`SELECT 
           COUNT(*) as total_enrollments,
           COUNT(CASE WHEN status = 'enrolled' THEN 1 END) as active_enrollments,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_enrollments,
           COUNT(CASE WHEN status = 'dropped' THEN 1 END) as dropped_enrollments,
           AVG(progress) as average_progress
         FROM enrollments 
         WHERE course_id = $1`,
				[courseId]
			);

			// Get completion rate (people who started vs completed)
			const completionRateQuery = await pool.query(
				`SELECT 
           CASE 
             WHEN COUNT(*) > 0 THEN 
               ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / COUNT(*)::float) * 100, 2)
             ELSE 0
           END as completion_rate
         FROM enrollments 
         WHERE course_id = $1 AND status != 'dropped'`,
				[courseId]
			);

			// Get average time to completion
			const avgTimeQuery = await pool.query(
				`SELECT 
           AVG(EXTRACT(EPOCH FROM (completed_at - enrolled_at)) / 86400) as avg_days_to_complete
         FROM enrollments 
         WHERE course_id = $1 AND status = 'completed' AND completed_at IS NOT NULL`,
				[courseId]
			);

			return {
				...statsQuery.rows[0],
				completion_rate: completionRateQuery.rows[0].completion_rate,
				avg_days_to_complete: avgTimeQuery.rows[0].avg_days_to_complete || null,
			};
		} catch (error) {
			console.error("Error in getCourseStats:", error);
			throw new Error(`Failed to get course stats: ${error.message}`);
		}
	}

	static async userHasAccessToCourse(userId, courseId) {
		try {
			// Check course visibility
			const courseQuery = await pool.query(
				"SELECT is_public, owner_type, owner_id FROM courses WHERE id = $1",
				[courseId]
			);

			if (courseQuery.rows.length === 0) {
				throw new Error("Course not found");
			}

			const course = courseQuery.rows[0];

			// If course is public, user has access
			if (course.is_public) {
				return true;
			}

			// Check if user has direct role for this entity
			const roleCheckQuery = `
        SELECT COUNT(*) as has_access FROM user_roles
        WHERE user_id = $1 AND (
          (entity_type = $2 AND entity_id = $3) OR
          (entity_type = 'client' AND entity_id IN (
            SELECT client_id FROM departments WHERE id = $3
          )) OR
          (entity_type = 'client' AND entity_id IN (
            SELECT c.id FROM clients c
            JOIN departments d ON c.id = d.client_id
            JOIN groups g ON d.id = g.department_id
            WHERE g.id = $3
          ))
        )`;

			const roleParams = [userId, course.owner_type, course.owner_id];
			const roleResult = await pool.query(roleCheckQuery, roleParams);

			return parseInt(roleResult.rows[0].has_access) > 0;
		} catch (error) {
			console.error("Error in userHasAccessToCourse:", error);
			throw new Error(`Failed to check course access: ${error.message}`);
		}
	}
}

export default Enrollment;
