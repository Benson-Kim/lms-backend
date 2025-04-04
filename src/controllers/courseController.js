import CourseService from "../services/courseService.js";
import enrollmentService from "../services/enrollmentService.js";
import contentService from "../services/contentService.js";

const {
	searchCourses,
	getUserCourses,
	getCourse: _getCourse,
	createCourse: _createCourse,
	updateCourse: _updateCourse,
	deleteCourse: _deleteCourse,
	addModule: _addModule,
	updateModuleOrder,
	getCoursesByOwner,
	getPopularCourses,
	getRecentCourses,
} = CourseService;

const {
	enrollUser,
	updateProgress,
	getCourseStats: _getCourseStats,
	getUserStats,
} = enrollmentService;

const {
	createContentItem,
	updateContentItem,
	deleteContentItem,
	submitQuizAttempt,
} = contentService;

class CourseController {
	/**
	 * Get all courses (with optional filtering)
	 */
	static async getCourses(req, res) {
		try {
			const {
				search,
				owner_type,
				owner_id,
				is_public,
				category,
				sort_by,
				sort_dir,
			} = req.query;
			const limit = parseInt(req.query.limit) || 20;
			const offset = parseInt(req.query.offset) || 0;

			const filters = {};

			if (owner_type && owner_id) {
				filters.ownerType = owner_type;
				filters.ownerId = owner_id;
			}

			if (is_public !== undefined) {
				filters.isPublic = is_public === "true";
			}

			if (category) {
				filters.category = category;
			}

			// Sorting parameters
			if (sort_by) {
				filters.sortBy = sort_by;
				filters.sortDirection =
					sort_dir && sort_dir.toLowerCase() === "desc" ? "DESC" : "ASC";
			}

			// If user is authenticated, include their ID for access control
			if (req.userId) {
				filters.userId = req.userId;
			}

			let courses;

			if (search) {
				courses = await searchCourses(search, filters, limit, offset);
			} else {
				courses = await getUserCourses(req.userId, filters);
			}

			res.json({
				courses,
				pagination: {
					total: courses.length, // This should ideally be a count of all matching courses
					limit,
					offset,
				},
			});
		} catch (error) {
			console.error("Error getting courses:", error);
			res.status(500).json({ error: error.message || "Failed to get courses" });
		}
	}

	/**
	 * Get a single course by ID
	 */
	static async getCourse(req, res) {
		try {
			const { courseId } = req.params;
			const userId = req.userId; // Will be undefined for public access

			const course = await _getCourse(courseId, userId);
			res.json(course);
		} catch (error) {
			console.error("Error getting course:", error);

			if (error.message === "Course not found") {
				return res.status(404).json({ error: "Course not found" });
			}

			if (error.message === "Access denied") {
				return res.status(403).json({ error: "Access denied" });
			}

			res.status(500).json({ error: error.message || "Failed to get course" });
		}
	}

	/**
	 * Create a new course
	 */
	static async createCourse(req, res) {
		try {
			const {
				title,
				description,
				thumbnail_url,
				owner_type,
				owner_id,
				is_public,
			} = req.body;

			// Validate required fields
			if (!title) {
				return res.status(400).json({ error: "Course title is required" });
			}

			if (!owner_type || !owner_id) {
				return res
					.status(400)
					.json({ error: "Course owner information is required" });
			}

			// Validate owner_type
			const validOwnerTypes = ["system", "client", "department", "user"];
			if (!validOwnerTypes.includes(owner_type)) {
				return res.status(400).json({
					error: `Invalid owner type. Must be one of: ${validOwnerTypes.join(
						", "
					)}`,
				});
			}

			// If owner type is user, set owner_id to current user
			const courseData = {
				title,
				description,
				thumbnailUrl: thumbnail_url,
				ownerType: owner_type,
				ownerId: owner_type === "user" ? req.userId : owner_id,
				isPublic: is_public === true,
			};

			const course = await _createCourse(courseData);
			res.status(201).json(course);
		} catch (error) {
			console.error("Error creating course:", error);
			res
				.status(500)
				.json({ error: error.message || "Failed to create course" });
		}
	}

	/**
	 * Update a course
	 */
	static async updateCourse(req, res) {
		try {
			const { courseId } = req.params;
			const { title, description, thumbnail_url, is_public } = req.body;

			const courseData = {
				title,
				description,
				thumbnailUrl: thumbnail_url,
				isPublic: is_public,
			};

			const course = await _updateCourse(courseId, courseData, req.userId);
			res.json(course);
		} catch (error) {
			console.error("Error updating course:", error);

			if (error.message === "Permission denied") {
				return res.status(403).json({ error: "Permission denied" });
			}

			res
				.status(500)
				.json({ error: error.message || "Failed to update course" });
		}
	}

	/**
	 * Delete a course
	 */
	static async deleteCourse(req, res) {
		try {
			const { courseId } = req.params;

			await _deleteCourse(courseId, req.userId);
			res.json({ success: true });
		} catch (error) {
			console.error("Error deleting course:", error);

			if (error.message === "Permission denied") {
				return res.status(403).json({ error: "Permission denied" });
			}

			res
				.status(500)
				.json({ error: error.message || "Failed to delete course" });
		}
	}

	/**
	 * Add a module to a course
	 */
	static async addModule(req, res) {
		try {
			const { courseId } = req.params;
			const { title } = req.body;

			if (!title) {
				return res.status(400).json({ error: "Module title is required" });
			}

			const moduleData = { title };
			const module = await _addModule(courseId, moduleData, req.userId);

			res.status(201).json(module);
		} catch (error) {
			console.error("Error adding module:", error);

			if (error.message === "Permission denied") {
				return res.status(403).json({ error: "Permission denied" });
			}

			res.status(500).json({ error: error.message || "Failed to add module" });
		}
	}

	/**
	 * Update module order
	 */
	static async reorderModules(req, res) {
		try {
			const { courseId } = req.params;
			const { modules } = req.body;

			if (!Array.isArray(modules)) {
				return res.status(400).json({ error: "Modules must be an array" });
			}

			await updateModuleOrder(courseId, modules, req.userId);
			res.json({ success: true });
		} catch (error) {
			console.error("Error reordering modules:", error);

			if (error.message === "Permission denied") {
				return res.status(403).json({ error: "Permission denied" });
			}

			res
				.status(500)
				.json({ error: error.message || "Failed to reorder modules" });
		}
	}

	/**
	 * Get courses by owner type and ID
	 */
	static async getCoursesByOwner(req, res) {
		try {
			const { owner_type, owner_id } = req.params;
			const includePrivate = req.query.include_private === "true";

			// Validate owner type
			const validOwnerTypes = ["system", "client", "department", "user"];
			if (!validOwnerTypes.includes(owner_type)) {
				return res.status(400).json({
					error: `Invalid owner type. Must be one of: ${validOwnerTypes.join(
						", "
					)}`,
				});
			}

			// Only allow including private courses if the requester has proper permissions
			// For example, users can only see their own private courses
			let authorized = false;
			if (includePrivate) {
				if (owner_type === "user" && owner_id === req.userId) {
					authorized = true;
				} else if (["system", "client", "department"].includes(owner_type)) {
					// Here you would implement additional authorization logic
					// For example, check if user is admin or has rights to this department
					// This is just a placeholder - implement according to your auth model
					authorized = await CourseService.userCanAccessOwnerContent(
						owner_type,
						owner_id,
						req.userId
					);
				}

				if (!authorized) {
					return res
						.status(403)
						.json({ error: "Not authorized to view private courses" });
				}
			}

			const courses = await getCoursesByOwner(
				owner_type,
				owner_id,
				includePrivate && authorized
			);

			res.json({
				owner_type,
				owner_id,
				courses,
				count: courses.length,
			});
		} catch (error) {
			console.error("Error getting courses by owner:", error);
			res
				.status(500)
				.json({ error: error.message || "Failed to get courses by owner" });
		}
	}

	/**
	 * Add content to a module
	 */
	static async addContent(req, res) {
		try {
			const { moduleId } = req.params;
			const { title, content_type, content } = req.body;

			if (!title) {
				return res.status(400).json({ error: "Content title is required" });
			}

			if (!content_type) {
				return res.status(400).json({ error: "Content type is required" });
			}

			// Validate content type
			const validContentTypes = ["text", "video", "quiz", "assignment"];
			if (!validContentTypes.includes(content_type)) {
				return res.status(400).json({
					error: `Invalid content type. Must be one of: ${validContentTypes.join(
						", "
					)}`,
				});
			}

			const contentData = {
				title,
				content_type,
				content,
			};

			const contentItem = await createContentItem(
				moduleId,
				contentData,
				req.userId
			);
			res.status(201).json(contentItem);
		} catch (error) {
			console.error("Error adding content:", error);

			if (error.message === "Permission denied") {
				return res.status(403).json({ error: "Permission denied" });
			}

			res.status(500).json({ error: error.message || "Failed to add content" });
		}
	}

	/**
	 * Update content item
	 */
	static async updateContent(req, res) {
		try {
			const { contentItemId } = req.params;
			const { title, content } = req.body;

			const contentData = {
				title,
				content,
			};

			const contentItem = await updateContentItem(
				contentItemId,
				contentData,
				req.userId
			);
			res.json(contentItem);
		} catch (error) {
			console.error("Error updating content:", error);

			if (error.message === "Permission denied") {
				return res.status(403).json({ error: "Permission denied" });
			}

			res
				.status(500)
				.json({ error: error.message || "Failed to update content" });
		}
	}

	/**
	 * Delete content item
	 */
	static async deleteContent(req, res) {
		try {
			const { contentItemId } = req.params;

			await deleteContentItem(contentItemId, req.userId);
			res.json({ success: true });
		} catch (error) {
			console.error("Error deleting content:", error);

			if (error.message === "Permission denied") {
				return res.status(403).json({ error: "Permission denied" });
			}

			res
				.status(500)
				.json({ error: error.message || "Failed to delete content" });
		}
	}

	/**
	 * Enroll in a course
	 */
	static async enrollInCourse(req, res) {
		try {
			const { courseId } = req.params;

			const enrollment = await enrollUser(req.userId, courseId);
			res.status(201).json(enrollment);
		} catch (error) {
			console.error("Error enrolling in course:", error);

			if (error.message === "You do not have access to this course") {
				return res
					.status(403)
					.json({ error: "You do not have access to this course" });
			}

			res
				.status(500)
				.json({ error: error.message || "Failed to enroll in course" });
		}
	}

	/**
	 * Track progress in a course
	 */
	static async trackProgress(req, res) {
		try {
			const { courseId, contentItemId } = req.params;
			const { status, score, time_spent } = req.body;

			const progressData = {
				status,
				time_spent,
				score,
				completed_at: status === "completed" ? new Date() : null,
			};

			const progress = await updateProgress(
				req.userId,
				courseId,
				contentItemId,
				progressData
			);
			res.json(progress);
		} catch (error) {
			console.error("Error tracking progress:", error);

			if (error.message === "User is not enrolled in this course") {
				return res
					.status(403)
					.json({ error: "You are not enrolled in this course" });
			}

			res
				.status(500)
				.json({ error: error.message || "Failed to track progress" });
		}
	}

	/**
	 * Get user progress in a course
	 */
	static async getUserProgress(req, res) {
		try {
			const { courseId } = req.params;

			const progress = await enrollmentService.getUserProgress(
				req.userId,
				courseId
			);
			res.json(progress);
		} catch (error) {
			console.error("Error getting progress:", error);

			if (error.message === "User is not enrolled in this course") {
				return res
					.status(400)
					.json({ error: "You are not enrolled in this course" });
			}

			res
				.status(500)
				.json({ error: error.message || "Failed to get progress" });
		}
	}

	/**
	 * Get course statistics
	 */
	static async getCourseStats(req, res) {
		try {
			const { courseId } = req.params;

			const canView = await CourseService.userCanEdit(courseId, req.userId);

			if (!canView) {
				return res.status(403).json({ error: "Permission denied" });
			}

			const stats = await _getCourseStats(courseId);
			res.json(stats);
		} catch (error) {
			console.error("Error getting course stats:", error);
			res
				.status(500)
				.json({ error: error.message || "Failed to get course statistics" });
		}
	}

	/**
	 * Submit a quiz
	 */
	static async submitQuiz(req, res) {
		try {
			const { contentItemId } = req.params;
			const { answers, time_spent } = req.body;

			if (!Array.isArray(answers)) {
				return res.status(400).json({ error: "Answers must be an array" });
			}

			// Add time spent to answers object
			const answersWithTime = {
				...answers,
				time_spent,
			};

			const result = await submitQuizAttempt(
				contentItemId,
				req.userId,
				answersWithTime
			);
			res.json(result);
		} catch (error) {
			console.error("Error submitting quiz:", error);

			if (error.message === "Invalid quiz content") {
				return res.status(400).json({ error: "Invalid quiz content" });
			}

			res.status(500).json({ error: error.message || "Failed to submit quiz" });
		}
	}

	/**
	 * Get user statistics
	 */
	static async getUserStats(req, res) {
		try {
			const stats = await enrollmentService.getUserStats(req.userId);
			res.json(stats);
		} catch (error) {
			console.error("Error getting user stats:", error);
			res
				.status(500)
				.json({ error: error.message || "Failed to get user statistics" });
		}
	}

	/**
	 * Get popular courses
	 */
	static async getPopularCourses(req, res) {
		try {
			const limit = parseInt(req.query.limit) || 5;

			const courses = await getPopularCourses(limit);
			res.json(courses);
		} catch (error) {
			console.error("Error getting popular courses:", error);
			res
				.status(500)
				.json({ error: error.message || "Failed to get popular courses" });
		}
	}

	/**
	 * Get recent courses
	 */
	static async getRecentCourses(req, res) {
		try {
			const limit = parseInt(req.query.limit) || 5;

			const courses = await getRecentCourses(limit);
			res.json(courses);
		} catch (error) {
			console.error("Error getting recent courses:", error);
			res
				.status(500)
				.json({ error: error.message || "Failed to get recent courses" });
		}
	}
}

export default CourseController;
