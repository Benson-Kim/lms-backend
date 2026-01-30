import express from "express";

import CourseController from "./course.controller";
import authMiddleware from "../../common/middlewares/auth.middleware";

const { authenticate, canAccessCourse, canEditCourse } = authMiddleware;

const router = express.Router();

// Courses discovery routes
router.get("/courses/popular", CourseController.getPopularCourses);
router.get("/courses/recent", CourseController.getRecentCourses);

router.post("/courses", authenticate, CourseController.createCourse);
router.get("/courses", authenticate, CourseController.getCourses);
router.get(
	"/courses/:courseId",
	authenticate,
	canAccessCourse,
	CourseController.getCourse,
);
router.put(
	"/courses/:courseId",
	authenticate,
	canEditCourse,
	CourseController.updateCourse,
);
router.delete(
	"/courses/:courseId",
	authenticate,
	canEditCourse,
	CourseController.deleteCourse,
);

router.get(
	"/owners/:owner_type/:owner_id/courses",
	authenticate,
	CourseController.getCoursesByOwner,
);

router.get(
	"/courses/:courseId/modules",
	authenticate,
	canAccessCourse,
	CourseController.getModules,
);

router.post(
	"/courses/:courseId/modules",
	authenticate,
	canEditCourse,
	CourseController.addModule,
);

router.put(
	"/courses/:courseId/modules/order",
	authenticate,
	canEditCourse,
	CourseController.reorderModules,
);

// Course module content routes
router.post(
	"/modules/:moduleId/content",
	authenticate,
	CourseController.addContent,
);
router.put(
	"/content/:contentItemId",
	authenticate,
	CourseController.updateContent,
);
router.delete(
	"/content/:contentItemId",
	authenticate,
	CourseController.deleteContent,
);

// Course enrollment and progress routes
router.post(
	"/courses/:courseId/enroll",
	authenticate,
	CourseController.enrollInCourse,
);
router.put(
	"/courses/:courseId/content/:contentItemId/progress",
	authenticate,
	CourseController.trackProgress,
);
router.get(
	"/courses/:courseId/progress",
	authenticate,
	CourseController.getUserProgress,
);
router.post(
	"/content/:contentItemId/quiz",
	authenticate,
	CourseController.submitQuiz,
);

// Courses statistics routes
router.get(
	"/courses/:courseId/stats",
	authenticate,
	CourseController.getCourseStats,
);
router.get("/user/stats", authenticate, CourseController.getUserStats);

export default router;
