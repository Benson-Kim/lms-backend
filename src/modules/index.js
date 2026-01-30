import express from "express";

import authRoutes from "./auth/auth.route.js";
import userRoutes from "./users/user.route.js";
import clientRoutes from "./clients/client.route.js";
import courseRoutes from "./courses/course.route.js";
import contentRoutes from "./contents/content.route.js";
import enrollmentRoutes from "./enrollments/enrollment.route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use(userRoutes);
router.use(clientRoutes);
router.use(courseRoutes);
router.use(contentRoutes);
router.use(enrollmentRoutes);

export default router;

// Optional
export {
	authRoutes,
	userRoutes,
	clientRoutes,
	courseRoutes,
	contentRoutes,
	enrollmentRoutes,
};
