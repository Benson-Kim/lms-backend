import ContentService from "../services/contentService.js";

class ContentController {
	static async createContentItem(req, res) {
		try {
			const { moduleId } = req.params;
			const contentData = req.body;
			const userId = req.user.id; // Assuming user ID is set by authentication middleware
			const newContentItem = await ContentService.createContentItem(
				moduleId,
				contentData,
				userId
			);
			return res.status(201).json({
				success: true,
				data: newContentItem,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getContentItem(req, res) {
		try {
			const { contentId } = req.params;
			const userId = req.user?.id; // Optional user ID

			const contentItem = await ContentService.getContentItem(
				contentId,
				userId
			);
			return res.status(200).json({
				success: true,
				data: contentItem,
			});
		} catch (error) {
			// Different error status codes based on error type
			const statusCode =
				error.message === "Content item not found"
					? 404
					: error.message === "Access denied"
					? 403
					: 500;

			return res.status(statusCode).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async updateContentItem(req, res) {
		try {
			const { contentId } = req.params;
			const contentData = req.body;
			const userId = req.user.id;
			const updatedContentItem = await ContentService.updateContentItem(
				contentId,
				contentData,
				userId
			);
			return res.status(200).json({
				success: true,
				data: updatedContentItem,
			});
		} catch (error) {
			// Different error status codes based on error type
			const statusCode =
				error.message === "Content item not found"
					? 404
					: error.message === "Permission denied"
					? 403
					: 400;

			return res.status(statusCode).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async deleteContentItem(req, res) {
		try {
			const { contentId } = req.params;
			const userId = req.user.id;
			await ContentService.deleteContentItem(contentId, userId);
			return res.status(200).json({
				success: true,
				message: "Content item deleted successfully",
			});
		} catch (error) {
			// Different error status codes based on error type
			const statusCode =
				error.message === "Content item not found"
					? 404
					: error.message === "Permission denied"
					? 403
					: 400;

			return res.status(statusCode).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async updateContentOrder(req, res) {
		try {
			const { moduleId } = req.params;
			const orderData = req.body;
			const userId = req.user.id;

			await ContentService.updateContentOrder(moduleId, orderData, userId);

			return res.status(200).json({
				success: true,
				message: "Content order updated successfully",
			});
		} catch (error) {
			const statusCode =
				error.message === "Module not found"
					? 404
					: error.message === "Permission denied"
					? 403
					: 400;

			return res.status(statusCode).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getModuleContents(req, res) {
		try {
			const { moduleId } = req.params;
			const userId = req.user?.id; // Optional user ID

			const contents = await ContentService.getModuleContents(moduleId, userId);

			return res.status(200).json({
				success: true,
				data: contents,
			});
		} catch (error) {
			const statusCode =
				error.message === "Module not found"
					? 404
					: error.message === "Access denied"
					? 403
					: 400;

			return res.status(statusCode).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async submitQuizAttempt(req, res) {
		try {
			const { contentId } = req.params;
			const userId = req.user.id;
			const answers = req.body.answers;

			if (!answers || !Array.isArray(answers)) {
				return res.status(400).json({
					success: false,
					message: "Valid answers array is required",
				});
			}

			const result = await ContentService.submitQuizAttempt(
				contentId,
				userId,
				answers
			);

			return res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getContentStats(req, res) {
		try {
			const { contentId } = req.params;
			const userId = req.user.id;

			const stats = await ContentService.getContentStats(contentId, userId);

			return res.status(200).json({
				success: true,
				data: stats,
			});
		} catch (error) {
			const statusCode =
				error.message === "Content item not found"
					? 404
					: error.message === "Permission denied"
					? 403
					: 400;

			return res.status(statusCode).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async submitAssignment(req, res) {
		try {
			const { contentId } = req.params;
			const userId = req.user.id;
			const submission = req.body;

			if (!submission || !submission.content) {
				return res.status(400).json({
					success: false,
					message: "Valid submission content is required",
				});
			}

			const result = await ContentService.submitAssignment(
				contentId,
				userId,
				submission
			);

			return res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async gradeAssignment(req, res) {
		try {
			const { contentId, enrollmentId } = req.params;
			const graderId = req.user.id;
			const gradeData = req.body;

			if (gradeData.score === undefined) {
				return res.status(400).json({
					success: false,
					message: "Score is required",
				});
			}

			const result = await ContentService.gradeAssignment(
				contentId,
				enrollmentId,
				gradeData,
				graderId
			);

			return res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			const statusCode =
				error.message === "No submission found for this student"
					? 404
					: error.message === "Permission denied"
					? 403
					: 400;

			return res.status(statusCode).json({
				success: false,
				message: error.message,
			});
		}
	}
}

export default ContentController;
