import Content from "../models/contentModel.js";
import CourseService from "./courseService.js";
import pool from "../../config/database.js";

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
				// Add video duration if provided
				if (contentData.content.duration) {
					contentData.content.duration = parseInt(contentData.content.duration);
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
				// Validate each quiz question
				this._validateQuizQuestions(contentData.content.questions);
				break;
			case "assignment":
				if (!contentData.content.description) {
					throw new Error("Assignment description is required");
				}
				// Set due date if provided
				if (contentData.content.due_date) {
					contentData.content.due_date = new Date(contentData.content.due_date);
				}
				break;
		}

		// Get next position
		const position = await Content.getNextContentPosition(moduleId);

		contentData.module_id = moduleId;
		contentData.position = position;

		return Content.create(contentData);
	}

	static _validateQuizQuestions(questions) {
		// Ensure all questions have required fields
		for (let i = 0; i < questions.length; i++) {
			const q = questions[i];

			// Assign an ID to each question if not provided
			if (!q.id) {
				q.id = `q_${Date.now()}_${i}`;
			}

			if (!q.text) {
				throw new Error(`Question ${i + 1} is missing text`);
			}

			if (!q.type) {
				throw new Error(`Question ${i + 1} is missing type`);
			}

			// Validate based on question type
			switch (q.type) {
				case "multiple_choice":
					if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
						throw new Error(`Question ${i + 1} must have at least 2 options`);
					}
					if (q.correct_answer === undefined) {
						throw new Error(`Question ${i + 1} is missing a correct answer`);
					}
					break;
				case "multiple_select":
					if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
						throw new Error(`Question ${i + 1} must have at least 2 options`);
					}
					if (
						!q.correct_answers ||
						!Array.isArray(q.correct_answers) ||
						q.correct_answers.length === 0
					) {
						throw new Error(`Question ${i + 1} is missing correct answers`);
					}
					break;
				case "true_false":
					if (q.correct_answer === undefined) {
						throw new Error(`Question ${i + 1} is missing a correct answer`);
					}
					break;
				case "text":
					if (q.exact_match && !q.correct_answer) {
						throw new Error(
							`Question ${i + 1} with exact matching requires a correct answer`
						);
					}
					if (
						!q.exact_match &&
						(!q.keywords ||
							!Array.isArray(q.keywords) ||
							q.keywords.length === 0)
					) {
						throw new Error(
							`Question ${i + 1} without exact matching requires keywords`
						);
					}
					break;
				default:
					throw new Error(`Question ${i + 1} has an invalid type: ${q.type}`);
			}
		}
	}

	static async getContentItem(contentItemId, userId = null) {
		const contentItem = await Content.findById(contentItemId);

		if (!contentItem) {
			throw new Error("Content item not found");
		}

		// Get module and course info to check access permissions
		const module = await Content.getModuleById(contentItem.module_id);

		if (userId) {
			// Check if user has access to this content
			const canAccess = await CourseService.userCanAccess(
				module.course_id,
				userId
			);

			if (!canAccess && !module.is_public) {
				throw new Error("Access denied");
			}

			// If user has access, get their progress for this content item
			const progress = await Content.getUserContentProgress(
				contentItemId,
				userId
			);

			return {
				...contentItem,
				module: {
					id: module.id,
					title: module.title,
					course_id: module.course_id,
					course_title: module.course_title,
				},
				progress,
			};
		}

		// If no user ID or public course, return content without progress
		if (module.is_public) {
			return {
				...contentItem,
				module: {
					id: module.id,
					title: module.title,
					course_id: module.course_id,
					course_title: module.course_title,
				},
			};
		}

		throw new Error("Access denied");
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

		// If content type is changing, validate new content structure
		if (
			contentData.content_type &&
			contentData.content_type !== contentItem.content_type
		) {
			// Validate content based on new type
			const validTypes = ["text", "video", "quiz", "assignment"];
			if (!validTypes.includes(contentData.content_type)) {
				throw new Error(
					`Invalid content type. Must be one of: ${validTypes.join(", ")}`
				);
			}

			// Ensure content field is provided when changing content type
			if (!contentData.content) {
				throw new Error("Content data is required when changing content type");
			}

			// Validate content for the new type
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
					// Validate each quiz question
					this._validateQuizQuestions(contentData.content.questions);
					break;
				case "assignment":
					if (!contentData.content.description) {
						throw new Error("Assignment description is required");
					}
					break;
			}
		} else if (contentData.content && contentItem.content_type === "quiz") {
			// If updating quiz content, validate questions
			if (contentData.content.questions) {
				this._validateQuizQuestions(contentData.content.questions);
			}
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

		// Delete content item (will also delete progress records)
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

		// Verify that all content IDs belong to this module
		const moduleContents = await Content.getByModuleId(moduleId);
		const moduleContentIds = new Set(moduleContents.map((item) => item.id));

		for (const item of orderData) {
			if (!moduleContentIds.has(item.id)) {
				throw new Error(
					`Content item ${item.id} does not belong to module ${moduleId}`
				);
			}
		}

		// orderData should be array of { id, position }
		return Content.updateContentOrder(orderData);
	}

	static async getModuleContents(moduleId, userId = null) {
		// Verify module exists
		const module = await Content.getModuleById(moduleId);

		if (!module) {
			throw new Error("Module not found");
		}

		// If user ID is provided, check access and get progress data
		if (userId) {
			const canAccess = await CourseService.userCanAccess(
				module.course_id,
				userId
			);

			if (!canAccess && !module.is_public) {
				throw new Error("Access denied");
			}

			// Get content items with user progress
			const contentItems = await Content.getByModuleId(moduleId);
			const progressData = await Content.getModuleProgress(moduleId, userId);

			// Create a map of content item IDs to progress data
			const progressMap = {};
			for (const progress of progressData) {
				progressMap[progress.content_item_id] = {
					status: progress.status,
					score: progress.score,
					time_spent: progress.time_spent,
					completed_at: progress.completed_at,
				};
			}

			// Add progress data to content items
			return contentItems.map((item) => ({
				...item,
				progress: progressMap[item.id] || null,
			}));
		}

		// If public course or no user ID, return content items without progress
		if (module.is_public) {
			return Content.getByModuleId(moduleId);
		}

		throw new Error("Access denied");
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
			feedback: this._generateQuizFeedback(score, quizQuestions.length),
		};
	}

	static _generateQuizFeedback(score, totalQuestions) {
		const percentage = score;

		if (percentage >= 90) {
			return "Excellent! You've mastered this material.";
		} else if (percentage >= 80) {
			return "Great job! You have a strong understanding of this content.";
		} else if (percentage >= 70) {
			return "Good work! You understand most of the key concepts.";
		} else if (percentage >= 60) {
			return "You're making progress. Review the material to strengthen your understanding.";
		} else {
			return "You might need more practice with this content. Consider reviewing the material again.";
		}
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

	static async getContentStats(contentItemId, userId) {
		const contentItem = await Content.findById(contentItemId);

		if (!contentItem) {
			throw new Error("Content item not found");
		}

		// Get module and course info
		const module = await Content.getModuleById(contentItem.module_id);

		// Check user permissions - only course instructors/admins should see stats
		const canViewStats = await CourseService.userCanEdit(
			module.course_id,
			userId
		);

		if (!canViewStats) {
			throw new Error("Permission denied");
		}

		const stats = await Content.getContentStats(contentItemId);

		// Add additional analytics based on content type
		if (contentItem.content_type === "quiz") {
			// Get detailed question performance
			const questionPerformance = await this._getQuizQuestionPerformance(
				contentItemId
			);
			stats.questionPerformance = questionPerformance;
		}

		return stats;
	}

	static async _getQuizQuestionPerformance(contentItemId) {
		// This would need a new database query to get question-level performance
		// Example implementation - in a real system, you'd need to store answer data
		try {
			const result = await pool.query(
				`SELECT 
					pr.enrollment_id,
					pr.content_item_id,
					pr.score,
					pr.data->>'answers' as answers
				 FROM progress_records pr
				 WHERE pr.content_item_id = $1 AND pr.data->>'answers' IS NOT NULL`,
				[contentItemId]
			);

			// This is a simplified example - in reality, you'd need to parse and analyze answers
			return {
				correctAnswerRates: [
					{ questionId: "q1", correctRate: 85.5 },
					{ questionId: "q2", correctRate: 67.2 },
				],
				averageAttemptTime: 120, // seconds
			};
		} catch (error) {
			console.error("Error getting quiz performance data:", error);
			return null;
		}
	}

	static async submitAssignment(contentItemId, userId, submission) {
		const contentItem = await Content.findById(contentItemId);

		if (!contentItem || contentItem.content_type !== "assignment") {
			throw new Error("Invalid assignment content");
		}

		// Get module and course info
		const module = await Content.getModuleById(contentItem.module_id);

		// Check if user is enrolled in the course
		const canAccess = await CourseService.userCanAccess(
			module.course_id,
			userId
		);

		if (!canAccess) {
			throw new Error(
				"You must be enrolled in this course to submit assignments"
			);
		}

		// Check if assignment has a due date and if it's passed
		if (contentItem.content.due_date) {
			const dueDate = new Date(contentItem.content.due_date);
			const now = new Date();

			if (now > dueDate) {
				// You might want to allow late submissions with a penalty, or reject them
				submission.isLate = true;
			}
		}

		// Record the submission with status "submitted" (needs review)
		const progressData = {
			status: "submitted",
			score: null, // Will be graded later
			time_spent: submission.time_spent || 0,
			completed_at: null, // Will be set when graded
			data: {
				submission: submission.content,
				submittedAt: new Date(),
				isLate: submission.isLate || false,
			},
		};

		// Update user progress
		await CourseService.updateProgress(
			userId,
			module.course_id,
			contentItemId,
			progressData
		);

		return {
			success: true,
			message: "Assignment submitted successfully",
			isLate: submission.isLate || false,
		};
	}

	static async gradeAssignment(
		contentItemId,
		enrollmentId,
		gradeData,
		graderId
	) {
		// Check if grader has permission
		const contentItem = await Content.findById(contentItemId);
		if (!contentItem || contentItem.content_type !== "assignment") {
			throw new Error("Invalid assignment content");
		}

		// Get module and course info
		const module = await Content.getModuleById(contentItem.module_id);

		// Check if user has grading rights
		const canEdit = await CourseService.userCanEdit(module.course_id, graderId);
		if (!canEdit) {
			throw new Error("Permission denied");
		}

		// Validate grade data
		if (
			gradeData.score === undefined ||
			gradeData.score < 0 ||
			gradeData.score > 100
		) {
			throw new Error("Valid score between 0-100 is required");
		}

		await Content.updateProgressRecord(
			enrollmentId,
			contentItemId,
			gradeData,
			graderId
		);

		return result.rows[0];
	}
}

export default ContentService;
