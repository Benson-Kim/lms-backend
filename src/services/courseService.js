import Course from "../models/courseModel.js";

class CourseService {
	static async createCourse(courseData) {
		// Validate required fields
		if (!courseData.title) {
			throw new Error("Course title is required");
		}

		// Validate owner info
		if (!courseData.ownerType || !courseData.ownerId) {
			throw new Error("Course owner information is required");
		}

		return Course.create(courseData);
	}

	static async getCourse(courseId, userId = null) {
		console.log(`Looking for course with ID: ${courseId}`);

		const course = await Course.findById(courseId);

		if (!course) {
			console.log(`Course with ID ${courseId} not found in database`);
			throw new Error("Course not found");
		}

		console.log(`Found course: ${course.title}`);

		// Check if user has access to this course if not public
		if (!course.is_public && userId) {
			console.log(
				`Course is not public, checking if user ${userId} has access`
			);
			const hasAccess = await Course.userHasAccess(courseId, userId);
			if (!hasAccess) {
				console.log(
					`User ${userId} does not have access to course ${courseId}`
				);
				throw new Error("Access denied");
			}
			console.log(`User ${userId} has access to course ${courseId}`);
		} else if (!course.is_public && !userId) {
			// Non-public course and no user ID provided
			console.log(`Course is not public and no user ID provided`);
			throw new Error("Access denied");
		}

		// Get modules and content items
		console.log(`Getting modules for course ${courseId}`);
		const modules = await Course.getModulesWithContent(courseId);

		// Get enrollment status if userId provided
		let enrollment = null;
		if (userId) {
			console.log(`Getting enrollment status for user ${userId}`);
			enrollment = await Course.getUserEnrollment(courseId, userId);
		}

		return {
			...course,
			modules,
			enrollment,
		};
	}

	static async updateCourse(courseId, courseData, userId) {
		// Check if user has permission to update the course
		const canUpdate = await Course.userCanEdit(courseId, userId);

		if (!canUpdate) {
			throw new Error("Permission denied");
		}

		return Course.update(courseId, courseData);
	}

	static async deleteCourse(courseId, userId) {
		// Check if user has permission to delete the course
		const canDelete = await Course.userCanEdit(courseId, userId);

		if (!canDelete) {
			throw new Error("Permission denied");
		}

		// Delete all related data (modules, content, enrollments)
		await Course.deleteAllRelated(courseId);

		return Course.delete(courseId);
	}

	static async getUserCourses(userId, filters = {}) {
		// Get courses where user is enrolled or owner
		return Course.getUserCourses(userId, filters);
	}

	static async searchCourses(searchTerm, filters = {}, limit = 20, offset = 0) {
		return Course.search(searchTerm, filters, limit, offset);
	}

	static async addModule(courseId, moduleData, userId) {
		// Check if user can edit the course
		const canEdit = await Course.userCanEdit(courseId, userId);

		if (!canEdit) {
			throw new Error("Permission denied");
		}

		// Get max position to append at the end
		const position = await Course.getNextModulePosition(courseId);

		return Course.createModule({
			course_id: courseId,
			title: moduleData.title,
			position: position,
		});
	}

	static async updateModuleOrder(courseId, moduleOrderData, userId) {
		// Check if user can edit the course
		const canEdit = await Course.userCanEdit(courseId, userId);

		if (!canEdit) {
			throw new Error("Permission denied");
		}

		// moduleOrderData should be array of { id, position }
		return Course.updateModuleOrder(moduleOrderData);
	}

	static async getCoursesByOwner(ownerType, ownerId, includePrivate = false) {
		const filters = {
			ownerType: ownerType,
			ownerId: ownerId,
		};

		if (!includePrivate) {
			filters.isPublic = true;
		}

		return Course.findAll(filters);
	}

	static async getPopularCourses(limit = 5) {
		// Course popularity:  based on enrollment count
		return Course.getMostEnrolledCourses(limit);
	}

	static async getRecentCourses(limit = 5) {
		// Get most recently created courses
		return Course.getRecentCourses(limit);
	}

	static async userCanAccessOwnerContent(ownerType, ownerId, userId) {
		return Course.userCanAccessOwnerContent(ownerType, ownerId, userId);
	}
}

export default CourseService;
