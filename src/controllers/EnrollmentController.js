const EnrollmentService = require("../services/enrollmentService");

class EnrollmentController {
	static async enrollUser(req, res) {
		try {
			const { courseId } = req.params;
			const userId = req.user.id; // Assuming user ID is set by authentication middleware

			const enrollment = await EnrollmentService.enrollUser(userId, courseId);

			return res.status(201).json({
				success: true,
				data: enrollment,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async updateProgress(req, res) {
		try {
			const { courseId, contentItemId } = req.params;
			const userId = req.user.id;
			const progressData = req.body;

			const progress = await EnrollmentService.updateProgress(
				userId,
				courseId,
				contentItemId,
				progressData
			);

			return res.status(200).json({
				success: true,
				data: progress,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getUserEnrollments(req, res) {
		try {
			const userId = req.user.id;
			const { status } = req.query;

			const enrollments = await EnrollmentService.getUserEnrollments(
				userId,
				status
			);

			return res.status(200).json({
				success: true,
				data: enrollments,
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async dropCourse(req, res) {
		try {
			const { courseId } = req.params;
			const userId = req.user.id;

			await EnrollmentService.dropCourse(userId, courseId);

			return res.status(200).json({
				success: true,
				message: "Course dropped successfully",
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getCourseStats(req, res) {
		try {
			const { courseId } = req.params;
			const stats = await EnrollmentService.getCourseStats(courseId);

			return res.status(200).json({
				success: true,
				data: stats,
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getUserProgress(req, res) {
		try {
			const { courseId } = req.params;
			const userId = req.user.id;

			const progress = await EnrollmentService.getUserProgress(
				userId,
				courseId
			);

			return res.status(200).json({
				success: true,
				data: progress,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getEnrollmentById(req, res) {
		try {
			const { enrollmentId } = req.params;

			// Check if the enrollment belongs to the user or user has admin access
			// This would typically involve checking user permissions

			const enrollment = await EnrollmentService.getEnrollmentById(
				enrollmentId
			);

			return res.status(200).json({
				success: true,
				data: enrollment,
			});
		} catch (error) {
			return res.status(404).json({
				success: false,
				message: error.message,
			});
		}
	}
}

module.exports = EnrollmentController;
