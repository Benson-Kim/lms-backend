// import Enrollment from "../../modules/enrollments/enrollment.model.js";
import CourseService from "../../modules/courses/course.service.js";
import Enrollment from "./enrollment.model.js";

class EnrollmentService {
	static async enrollUser(userId, courseId) {
		try {
			// Verify course exists and user has access
			const course = await CourseService.getCourse(courseId);

			if (!course) {
				throw new Error("Course not found");
			}

			// Check if user has access to this course if it's not public
			if (!course.is_public) {
				const hasAccess = await Enrollment.userHasAccessToCourse(
					userId,
					courseId,
				);
				if (!hasAccess) {
					throw new Error("You do not have access to this course");
				}
			}

			// Create or reactivate enrollment
			const enrollment = await Enrollment.create(userId, courseId);

			return enrollment;
		} catch (error) {
			console.error("Error in enrollUser:", error);
			throw new Error(`Failed to enroll user: ${error.message}`);
		}
	}

	static async updateProgress(userId, courseId, contentItemId, progressData) {
		try {
			// Input validation
			if (!userId || !courseId || !contentItemId) {
				throw new Error("Missing required parameters");
			}

			if (!progressData || !progressData.status) {
				throw new Error("Progress status is required");
			}

			// Validate status value
			const validStatuses = ["not_started", "in_progress", "completed"];
			if (!validStatuses.includes(progressData.status)) {
				throw new Error("Invalid status value");
			}

			// Get enrollment
			const enrollment = await Enrollment.findByUserAndCourse(userId, courseId);

			if (!enrollment) {
				throw new Error("User is not enrolled in this course");
			}

			// Update progress record
			const progressRecord = await Enrollment.updateProgressRecord(
				enrollment.id,
				contentItemId,
				progressData,
			);

			// Recalculate overall course progress
			const overallProgress = await Enrollment.calculateOverallProgress(
				enrollment.id,
			);

			return {
				progressRecord,
				overallProgress,
				isCompleted: enrollment.status === "completed",
			};
		} catch (error) {
			console.error("Error in updateProgress:", error);
			throw new Error(`Failed to update progress: ${error.message}`);
		}
	}

	static async getUserEnrollments(userId, status = null) {
		try {
			if (!userId) {
				throw new Error("User ID is required");
			}

			const enrollments = await Enrollment.getUserEnrollments(userId, status);

			// For each enrollment, get basic course information
			return enrollments.map((enrollment) => ({
				id: enrollment.id,
				courseId: enrollment.course_id,
				courseTitle: enrollment.title,
				courseDescription: enrollment.description,
				courseThumbnail: enrollment.thumbnail_url,
				status: enrollment.status,
				progress: enrollment.progress,
				enrolledAt: enrollment.enrolled_at,
				completedAt: enrollment.completed_at,
			}));
		} catch (error) {
			console.error("Error in getUserEnrollments:", error);
			throw new Error(`Failed to get user enrollments: ${error.message}`);
		}
	}

	static async dropCourse(userId, courseId) {
		try {
			if (!userId || !courseId) {
				throw new Error("User ID and Course ID are required");
			}

			const enrollment = await Enrollment.findByUserAndCourse(userId, courseId);

			if (!enrollment) {
				throw new Error("User is not enrolled in this course");
			}

			return Enrollment.updateStatus(enrollment.id, "dropped");
		} catch (error) {
			console.error("Error in dropCourse:", error);
			throw new Error(`Failed to drop course: ${error.message}`);
		}
	}

	static async getCourseStats(courseId) {
		try {
			if (!courseId) {
				throw new Error("Course ID is required");
			}

			// Verify course exists
			const course = await CourseService.getCourse(courseId);

			if (!course) {
				throw new Error("Course not found");
			}

			return Enrollment.getCourseStats(courseId);
		} catch (error) {
			console.error("Error in getCourseStats:", error);
			throw new Error(`Failed to get course statistics: ${error.message}`);
		}
	}

	static async getUserProgress(userId, courseId) {
		try {
			if (!userId || !courseId) {
				throw new Error("User ID and Course ID are required");
			}

			const enrollment = await Enrollment.findByUserAndCourse(userId, courseId);

			if (!enrollment) {
				throw new Error("User is not enrolled in this course");
			}

			const detailedProgress = await Enrollment.getDetailedProgress(
				enrollment.id,
			);

			return {
				enrollment: {
					id: enrollment.id,
					status: enrollment.status,
					progress: enrollment.progress,
					enrolledAt: enrollment.enrolled_at,
					completedAt: enrollment.completed_at,
				},
				detailedProgress,
			};
		} catch (error) {
			console.error("Error in getUserProgress:", error);
			throw new Error(`Failed to get user progress: ${error.message}`);
		}
	}

	static async getEnrollmentById(enrollmentId, requestingUserId) {
		try {
			if (!enrollmentId) {
				throw new Error("Enrollment ID is required");
			}

			const enrollment = await Enrollment.findById(enrollmentId);

			if (!enrollment) {
				throw new Error("Enrollment not found");
			}

			// Security check: User should only access their own enrollments unless they are an admin
			if (enrollment.user_id !== requestingUserId) {
				// The following would need to be implemented based on your user_roles table
				const isAdmin = await this.userHasAdminAccess(
					requestingUserId,
					enrollment.course_id,
				);
				if (!isAdmin) {
					throw new Error("Access denied");
				}
			}

			// Get detailed progress
			const detailedProgress =
				await Enrollment.getDetailedProgress(enrollmentId);

			return {
				enrollment,
				detailedProgress,
			};
		} catch (error) {
			console.error("Error in getEnrollmentById:", error);
			throw new Error(`Failed to get enrollment: ${error.message}`);
		}
	}

	static async userHasAdminAccess(userId, courseId) {
		try {
			// Get course owner info
			const courseQuery = await CourseService.getCourse(courseId);

			if (!courseQuery) {
				return false;
			}

			// Check if user is a system admin
			const userQuery = await pool.query(
				"SELECT is_system_admin FROM users WHERE id = $1",
				[userId],
			);

			if (userQuery.rows.length > 0 && userQuery.rows[0].is_system_admin) {
				return true;
			}

			// Check if user has admin role for this course's owner
			const adminRoleQuery = await pool.query(
				`SELECT COUNT(*) as is_admin FROM user_roles 
         WHERE user_id = $1 
         AND role = 'admin'
         AND ((entity_type = $2 AND entity_id = $3) OR entity_type = 'client')`,
				[userId, courseQuery.owner_type, courseQuery.owner_id],
			);

			return parseInt(adminRoleQuery.rows[0].is_admin) > 0;
		} catch (error) {
			console.error("Error in userHasAdminAccess:", error);
			return false;
		}
	}

	static async bulkEnroll(courseId, userIds) {
		try {
			if (!courseId || !Array.isArray(userIds) || userIds.length === 0) {
				throw new Error("Course ID and user IDs array are required");
			}

			// Verify course exists
			const course = await CourseService.getCourse(courseId);

			if (!course) {
				throw new Error("Course not found");
			}

			const results = {
				successful: [],
				failed: [],
			};

			// Process enrollments
			for (const userId of userIds) {
				try {
					// Check if user has access to course
					const hasAccess =
						course.is_public ||
						(await Enrollment.userHasAccessToCourse(userId, courseId));

					if (!hasAccess) {
						results.failed.push({
							userId,
							reason: "Access denied",
						});
						continue;
					}

					const enrollment = await Enrollment.create(userId, courseId);
					results.successful.push({
						userId,
						enrollmentId: enrollment.id,
					});
				} catch (error) {
					results.failed.push({
						userId,
						reason: error.message,
					});
				}
			}

			return results;
		} catch (error) {
			console.error("Error in bulkEnroll:", error);
			throw new Error(`Failed to process bulk enrollment: ${error.message}`);
		}
	}
}

export default EnrollmentService;
