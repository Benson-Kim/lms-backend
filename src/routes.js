// src/routes.js
const express = require("express");
const AuthController = require("./controllers/AuthController");
const UserController = require("./controllers/UserController");
const ClientController = require("./controllers/ClientController");
const ContentController = require("./controllers/ContentController");
const EnrollmentController = require("./controllers/EnrollmentController");
const { default: CourseController } = require("./controllers/courseController");
const {
	authenticate,
	isSystemAdmin,
	hasRole,
	canAccessCourse,
	canEditCourse,
} = require("./middleware/AuthMiddleware");

const router = express.Router();

// Auth routes
router.post("/auth/login", AuthController.login);
router.post("/auth/refresh", AuthController.refresh);
router.post("/auth/logout", authenticate, AuthController.logout);
router.post("/auth/forgot-password", AuthController.forgotPassword);
router.post("/auth/reset-password", AuthController.resetPassword);

// User routes
router.get("/users/profile", authenticate, UserController.getProfile);
router.put("/users/profile", authenticate, UserController.updateProfile);
router.post(
	"/users/change-password",
	authenticate,
	UserController.changePassword
);
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
router.get("/courses", authenticate, CourseController.searchCourses);
router.get("/users/courses", authenticate, CourseController.getUserCourses);
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
	CourseController.updateModuleOrder
);

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

// Enrollment routes
router.post(
	"/courses/:courseId/enroll",
	authenticate,
	EnrollmentController.enrollUser
);
router.post(
	"/courses/:courseId/progress",
	authenticate,
	EnrollmentController.updateProgress
);
router.get(
	"/user/enrollments",
	authenticate,
	EnrollmentController.getUserEnrollments
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
	EnrollmentController.getUserProgress
);

module.exports = router;
