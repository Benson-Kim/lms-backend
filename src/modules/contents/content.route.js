import express from "express";

import ContentController from "./content.controller.js";

import authMiddleware from "../../common/middlewares/auth.middleware";

const { authenticate } = authMiddleware;

const router = express.Router();

router.post(
	"/modules/:moduleId/content",
	authenticate,
	ContentController.createContentItem,
);

router.get(
	"/content/:contentId",
	authenticate,
	ContentController.getContentItem,
);

router.put(
	"/content/:contentId",
	authenticate,
	ContentController.updateContentItem,
);

router.delete(
	"/content/:contentId",
	authenticate,
	ContentController.deleteContentItem,
);

router.put(
	"/modules/:moduleId/content/order",
	authenticate,
	ContentController.updateContentOrder,
);

router.get(
	"/modules/:moduleId/content",
	authenticate,
	ContentController.getModuleContents,
);

router.post(
	"/content/:contentId/quiz-attempt",
	authenticate,
	ContentController.submitQuizAttempt,
);

// New routes based on the service file
router.get(
	"/content/:contentId/stats",
	authenticate,
	ContentController.getContentStats,
);

router.post(
	"/content/:contentId/assignment-submission",
	authenticate,
	ContentController.submitAssignment,
);

router.post(
	"/content/:contentId/grade/:enrollmentId",
	authenticate,
	ContentController.gradeAssignment,
);

export default router;
