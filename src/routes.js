// src/routes.js

import AuthController from "./controllers/AuthController.js";
import UserController from "./controllers/UserController.js";
import ClientController from "./controllers/ClientController.js";
import ContentController from "./controllers/ContentController.js";
import EnrollmentController from "./controllers/EnrollmentController.js";
import CourseController from "./controllers/courseController.js";

import express from "express";

import AuthMiddleware from "./middleware/AuthMiddleware.js";
import DashboardService from "./services/learners/dashboardService.js";
import learnerDashboardController from "./controllers/learners/learnerDashboardController.js";

const { authenticate, isSystemAdmin, hasRole, canAccessCourse, canEditCourse } =
	AuthMiddleware;

const router = express.Router();

// Public routes
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.get("/verify-reset-token/:token", AuthController.verifyResetToken);
router.post("/logout", authenticate, AuthController.logout);
router.post("/logout-all", authenticate, AuthController.logoutAll);

// User routes
router.get("/user/profile", authenticate, UserController.getProfile);
router.put("/user/profile", authenticate, UserController.updateProfile);
router.post(
	"/user/change-password",
	authenticate,
	UserController.changePassword
);

// User management routes (system admin only)
router.post("/users", authenticate, isSystemAdmin, UserController.createUser);
router.post(
	"/users/roles",
	authenticate,
	isSystemAdmin,
	UserController.assignRole
);
router.delete(
	"/users/roles",
	authenticate,
	isSystemAdmin,
	UserController.removeRole
);
router.get(
	"/users/search",
	authenticate,
	isSystemAdmin,
	UserController.searchUsers
);

// Get users by entity (e.g., client, department, group)
router.get("/users/by-entity", authenticate, UserController.getUsersByEntity);

// Client routes
router.post(
	"/clients",
	authenticate,
	isSystemAdmin,
	ClientController.createClient
);

router.get("/clients/:clientId", authenticate, ClientController.getClient);

router.put(
	"/clients/:clientId",
	authenticate,
	hasRole("client", "admin"),
	ClientController.updateClient
);

router.get(
	"/clients",
	authenticate,
	isSystemAdmin,
	ClientController.getAllClients
);

router.post(
	"/clients/:clientId/departments",
	authenticate,
	hasRole("client", "admin"),
	ClientController.createDepartment
);

router.get(
	"/departments/:departmentId",
	authenticate,
	ClientController.getDepartment
);

router.post(
	"/departments/:departmentId/groups",
	authenticate,
	hasRole("department", "admin"),
	ClientController.createGroup
);

router.get("/groups/:groupId", authenticate, ClientController.getGroup);

router.put(
	"/clients/:clientId/deactivate",
	authenticate,
	isSystemAdmin,
	ClientController.deactivateClient
);

router.put(
	"/clients/:clientId/activate",
	authenticate,
	isSystemAdmin,
	ClientController.activateClient
);

router.post(
	"/clients/:clientId/users",
	authenticate,
	hasRole("client", "admin"),
	ClientController.addUserToClient
);

router.post(
	"/departments/:departmentId/users",
	authenticate,
	hasRole("department", "admin"),
	ClientController.addUserToDepartment
);

router.post(
	"/groups/:groupId/users",
	authenticate,
	hasRole("group", "admin"),
	ClientController.addUserToGroup
);

// Course routes
router.post("/courses", authenticate, CourseController.createCourse);
router.get(
	"/courses/:courseId",
	authenticate,
	canAccessCourse,
	CourseController.getCourse
);
router.put(
	"/courses/:courseId",
	authenticate,
	canEditCourse,
	CourseController.updateCourse
);
router.delete(
	"/courses/:courseId",
	authenticate,
	canEditCourse,
	CourseController.deleteCourse
);
router.get("/courses", authenticate, CourseController.getCourses);
router.get(
	"/owners/:owner_type/:owner_id/courses",
	authenticate,
	CourseController.getCoursesByOwner
);
router.post(
	"/courses/:courseId/modules",
	authenticate,
	canEditCourse,
	CourseController.addModule
);
router.put(
	"/courses/:courseId/modules/order",
	authenticate,
	canEditCourse,
	CourseController.reorderModules
);

// Course module content routes
router.post(
	"/modules/:moduleId/content",
	authenticate,
	CourseController.addContent
);
router.put(
	"/content/:contentItemId",
	authenticate,
	CourseController.updateContent
);
router.delete(
	"/content/:contentItemId",
	authenticate,
	CourseController.deleteContent
);

// Course enrollment and progress routes
router.post(
	"/courses/:courseId/enroll",
	authenticate,
	CourseController.enrollInCourse
);
router.put(
	"/courses/:courseId/content/:contentItemId/progress",
	authenticate,
	CourseController.trackProgress
);
router.get(
	"/courses/:courseId/progress",
	authenticate,
	CourseController.getUserProgress
);
router.post(
	"/content/:contentItemId/quiz",
	authenticate,
	CourseController.submitQuiz
);

// Courses statistics routes
router.get(
	"/courses/:courseId/stats",
	authenticate,
	CourseController.getCourseStats
);
router.get("/user/stats", authenticate, CourseController.getUserStats);

// Courses discovery routes
router.get("/courses/popular", CourseController.getPopularCourses);
router.get("/courses/recent", CourseController.getRecentCourses);

// Content routes
router.post(
	"/modules/:moduleId/content",
	authenticate,
	ContentController.createContentItem
);

router.get(
	"/content/:contentId",
	authenticate,
	ContentController.getContentItem
);

router.put(
	"/content/:contentId",
	authenticate,
	ContentController.updateContentItem
);

router.delete(
	"/content/:contentId",
	authenticate,
	ContentController.deleteContentItem
);

router.put(
	"/modules/:moduleId/content/order",
	authenticate,
	ContentController.updateContentOrder
);

router.get(
	"/modules/:moduleId/content",
	authenticate,
	ContentController.getModuleContents
);

router.post(
	"/content/:contentId/quiz-attempt",
	authenticate,
	ContentController.submitQuizAttempt
);

// New routes based on the service file
router.get(
	"/content/:contentId/stats",
	authenticate,
	ContentController.getContentStats
);

router.post(
	"/content/:contentId/assignment-submission",
	authenticate,
	ContentController.submitAssignment
);

router.post(
	"/content/:contentId/grade/:enrollmentId",
	authenticate,
	ContentController.gradeAssignment
);

// Enrollment routes
router.post(
	"/courses/:courseId/enroll",
	authenticate,
	EnrollmentController.enrollUser
);

router.post(
	"/courses/:courseId/content/:contentItemId/progress",
	authenticate,
	canAccessCourse,
	EnrollmentController.updateProgress
);

router.get(
	"/user/enrollments",
	authenticate,
	EnrollmentController.getUserEnrollments
);

router.get(
	"/user/dashboard",
	authenticate,
	learnerDashboardController.getDashboardData
);

router.post(
	"/courses/:courseId/drop",
	authenticate,
	EnrollmentController.dropCourse
);

router.get(
	"/courses/:courseId/stats",
	authenticate,
	canEditCourse,
	EnrollmentController.getCourseStats
);

router.get(
	"/courses/:courseId/progress",
	authenticate,
	canAccessCourse,
	EnrollmentController.getUserProgress
);

router.get(
	"/enrollments/:enrollmentId",
	authenticate,
	EnrollmentController.getEnrollmentById
);

// Administrative route for bulk enrollments
router.post(
	"/courses/:courseId/bulk-enroll",
	authenticate,
	canEditCourse,
	EnrollmentController.bulkEnroll
);

export default router;
