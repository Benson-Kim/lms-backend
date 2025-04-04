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
			const { contentItemId } = req.params;
			const contentItem = await ContentService.getContentItem(contentItemId);

			return res.status(200).json({
				success: true,
				data: contentItem,
			});
		} catch (error) {
			return res.status(404).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async updateContentItem(req, res) {
		try {
			const { contentItemId } = req.params;
			const contentData = req.body;
			const userId = req.user.id;

			const updatedContentItem = await ContentService.updateContentItem(
				contentItemId,
				contentData,
				userId
			);

			return res.status(200).json({
				success: true,
				data: updatedContentItem,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async deleteContentItem(req, res) {
		try {
			const { contentItemId } = req.params;
			const userId = req.user.id;

			await ContentService.deleteContentItem(contentItemId, userId);

			return res.status(200).json({
				success: true,
				message: "Content item deleted successfully",
			});
		} catch (error) {
			return res.status(400).json({
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
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getModuleContents(req, res) {
		try {
			const { moduleId } = req.params;
			const contents = await ContentService.getModuleContents(moduleId);

			return res.status(200).json({
				success: true,
				data: contents,
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async submitQuizAttempt(req, res) {
		try {
			const { contentItemId } = req.params;
			const userId = req.user.id;
			const { answers } = req.body;

			const result = await ContentService.submitQuizAttempt(
				contentItemId,
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
			const { contentItemId } = req.params;
			const stats = await ContentService.getContentStats(contentItemId);

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
}

export default ContentController;
