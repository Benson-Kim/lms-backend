import express from "express";

import EnrollmentController from './enrollment.controller.js'
import DashboardController from "../learner/dashboard.controller.js";

import AuthMiddleware from "../../middleware/AuthMiddleware.js";

const { authenticate, canAccessCourse, canEditCourse } = AuthMiddleware;

const router = express.Router();

// Enrollment routes
router.post(
  "/courses/:courseId/enroll",
  authenticate,
  EnrollmentController.enrollUser,
);

router.post(
  "/courses/:courseId/content/:contentItemId/progress",
  authenticate,
  canAccessCourse,
  EnrollmentController.updateProgress,
);

router.get(
  "/user/enrollments",
  authenticate,
  EnrollmentController.getUserEnrollments,
);

router.get(
  "/user/dashboard",
  authenticate,
  DashboardController.getDashboardData,
);

router.post(
  "/courses/:courseId/drop",
  authenticate,
  EnrollmentController.dropCourse,
);

router.get(
  "/courses/:courseId/stats",
  authenticate,
  canEditCourse,
  EnrollmentController.getCourseStats,
);

router.get(
  "/courses/:courseId/progress",
  authenticate,
  canAccessCourse,
  EnrollmentController.getUserProgress,
);

router.get(
  "/enrollments/:enrollmentId",
  authenticate,
  EnrollmentController.getEnrollmentById,
);

// Administrative route for bulk enrollments
router.post(
  "/courses/:courseId/bulk-enroll",
  authenticate,
  canEditCourse,
  EnrollmentController.bulkEnroll,
);

export default router;
