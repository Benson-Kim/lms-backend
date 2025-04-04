import Content from "../models/contentModel.js";
import CourseService from "./courseService.js";

class ContentService {
	static async createContentItem(moduleId, contentData, userId) {
		// Verify module exists and user has edit rights
		const module = await Content.getModuleById(moduleId);

		if (!module) {
			throw new Error("Module not found");
		}

		// Check user permissions
		const canEdit = await CourseService.userCanEdit(module.course_id, userId);

		if (!canEdit) {
			throw new Error("Permission denied");
		}

		// Validate content type
		const validTypes = ["text", "video", "quiz", "assignment"];
		if (!validTypes.includes(contentData.content_type)) {
			throw new Error(
				`Invalid content type. Must be one of: ${validTypes.join(", ")}`
			);
		}

		// Validate content based on type
		switch (contentData.content_type) {
			case "text":
				if (!contentData.content.text) {
					throw new Error("Text content is required");
				}
				break;
			case "video":
				if (!contentData.content.url) {
					throw new Error("Video URL is required");
				}
				break;
			case "quiz":
				if (
					!contentData.content.questions ||
					!Array.isArray(contentData.content.questions) ||
					contentData.content.questions.length === 0
				) {
					throw new Error("Quiz questions are required");
				}
				break;
			case "assignment":
				if (!contentData.content.description) {
					throw new Error("Assignment description is required");
				}
				break;
		}

		// Get next position
		const position = await Content.getNextContentPosition(moduleId);

		contentData.module_id = moduleId;
		contentData.position = position;

		return Content.create(contentData);
	}

	static async getContentItem(contentItemId) {
		const contentItem = await Content.findById(contentItemId);

		if (!contentItem) {
			throw new Error("Content item not found");
		}

		return contentItem;
	}

	static async updateContentItem(contentItemId, contentData, userId) {
		const contentItem = await Content.findById(contentItemId);

		if (!contentItem) {
			throw new Error("Content item not found");
		}

		// Get module and course info
		const module = await Content.getModuleById(contentItem.module_id);

		// Check user permissions
		const canEdit = await CourseService.userCanEdit(module.course_id, userId);

		if (!canEdit) {
			throw new Error("Permission denied");
		}

		return Content.update(contentItemId, contentData);
	}

	static async deleteContentItem(contentItemId, userId) {
		const contentItem = await Content.findById(contentItemId);

		if (!contentItem) {
			throw new Error("Content item not found");
		}

		// Get module and course info
		const module = await Content.getModuleById(contentItem.module_id);

		// Check user permissions
		const canEdit = await CourseService.userCanEdit(module.course_id, userId);

		if (!canEdit) {
			throw new Error("Permission denied");
		}

		// Delete progress records associated with this content item
		await Content.deleteProgressRecords(contentItemId);

		// Delete content item
		return Content.delete(contentItemId);
	}

	static async updateContentOrder(moduleId, orderData, userId) {
		// Get module info
		const module = await Content.getModuleById(moduleId);

		if (!module) {
			throw new Error("Module not found");
		}

		// Check user permissions
		const canEdit = await CourseService.userCanEdit(module.course_id, userId);

		if (!canEdit) {
			throw new Error("Permission denied");
		}

		// orderData should be array of { id, position }
		return Content.updateContentOrder(orderData);
	}

	static async getModuleContents(moduleId) {
		return Content.getByModuleId(moduleId);
	}

	static async submitQuizAttempt(contentItemId, userId, answers) {
		// Get content item to verify it's a quiz
		const contentItem = await Content.findById(contentItemId);

		if (!contentItem || contentItem.content_type !== "quiz") {
			throw new Error("Invalid quiz content");
		}

		const quizQuestions = contentItem.content.questions;

		// Calculate score
		let correctAnswers = 0;
		const gradedAnswers = answers.map((answer) => {
			const question = quizQuestions.find((q) => q.id === answer.questionId);

			if (!question) {
				return { ...answer, isCorrect: false };
			}

			const isCorrect = this._checkQuizAnswer(question, answer.value);

			if (isCorrect) {
				correctAnswers++;
			}

			return { ...answer, isCorrect };
		});

		const score = (correctAnswers / quizQuestions.length) * 100;

		// Record progress
		const progressData = {
			status: "completed",
			score,
			time_spent: answers.time_spent || 0,
			completed_at: new Date(),
		};

		// Get module and course info
		const module = await Content.getModuleById(contentItem.module_id);

		// Update user progress
		await CourseService.updateProgress(
			userId,
			module.course_id,
			contentItemId,
			progressData
		);

		return {
			score,
			gradedAnswers,
			totalQuestions: quizQuestions.length,
			correctAnswers,
		};
	}

	static _checkQuizAnswer(question, userAnswer) {
		switch (question.type) {
			case "multiple_choice":
				return userAnswer === question.correct_answer;
			case "multiple_select":
				// For multiple select, all correct options must be selected and no incorrect ones
				if (!Array.isArray(userAnswer)) return false;
				const correctOptions = new Set(question.correct_answers);
				return (
					userAnswer.length === correctOptions.size &&
					userAnswer.every((option) => correctOptions.has(option))
				);
			case "true_false":
				return userAnswer === question.correct_answer;
			case "text":
				if (question.exact_match) {
					return (
						userAnswer.trim().toLowerCase() ===
						question.correct_answer.trim().toLowerCase()
					);
				} else {
					// Check if answer contains keywords
					const keywords = question.keywords || [];
					return keywords.some((keyword) =>
						userAnswer.toLowerCase().includes(keyword.toLowerCase())
					);
				}
			default:
				return false;
		}
	}
}

export default ContentService;
