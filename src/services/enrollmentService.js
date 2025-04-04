import Enrollment from "../models/enrollmentModel.js";
import CourseService from "./courseService.js";

class EnrollmentService {
	static async enrollUser(userId, courseId) {
		// Check if user is already enrolled
		const existingEnrollment = await Enrollment.findByUserAndCourse(
			userId,
			courseId
		);

		if (existingEnrollment) {
			// If dropped, reactivate
			if (existingEnrollment.status === "dropped") {
				return Enrollment.update(existingEnrollment.id, {
					status: "enrolled",
					updated_at: new Date(),
				});
			}

			return existingEnrollment;
		}

		// Verify course exists
		const course = await CourseService.getCourse(courseId);

		if (!course) {
			throw new Error("Course not found");
		}

		// Check if the course is public or user has access
		if (!course.is_public) {
			const hasAccess = await Enrollment.userHasAccessToCourse(
				userId,
				courseId
			);

			if (!hasAccess) {
				throw new Error("You do not have access to this course");
			}
		}

		// Create enrollment
		return Enrollment.create({
			user_id: userId,
			course_id: courseId,
			status: "enrolled",
			progress: 0,
		});
	}

	static async updateProgress(userId, courseId, contentItemId, progressData) {
		// Get enrollment
		const enrollment = await Enrollment.findByUserAndCourse(userId, courseId);

		if (!enrollment) {
			throw new Error("User is not enrolled in this course");
		}

		// Update or create progress record
		const progressRecord = await Enrollment.updateProgressRecord(
			enrollment.id,
			contentItemId,
			progressData
		);

		// Recalculate overall course progress
		const overallProgress = await Enrollment.calculateOverallProgress(
			enrollment.id
		);

		// Update enrollment with new progress
		await Enrollment.update(enrollment.id, {
			progress: overallProgress,
			updated_at: new Date(),
			// If progress is 100%, mark as completed
			...(overallProgress === 100
				? {
						status: "completed",
						completed_at: new Date(),
				  }
				: {}),
		});

		return progressRecord;
	}

	static async getUserEnrollments(userId, status = null) {
		return Enrollment.getUserEnrollments(userId, status);
	}

	static async dropCourse(userId, courseId) {
		const enrollment = await Enrollment.findByUserAndCourse(userId, courseId);

		if (!enrollment) {
			throw new Error("User is not enrolled in this course");
		}

		return Enrollment.update(enrollment.id, {
			status: "dropped",
			updated_at: new Date(),
		});
	}

	static async getCourseStats(courseId) {
		return Enrollment.getCourseStats(courseId);
	}

	static async getUserProgress(userId, courseId) {
		const enrollment = await Enrollment.findByUserAndCourse(userId, courseId);

		if (!enrollment) {
			throw new Error("User is not enrolled in this course");
		}

		const progressRecords = await Enrollment.getDetailedProgress(enrollment.id);

		return {
			enrollment,
			progressRecords,
		};
	}
}

export default EnrollmentService;
