import express from "express";

import AuthController from "./auth.controller";
import authMiddleware from "../../common/middlewares/auth.middleware";

const { authenticate } = authMiddleware;

const router = express.Router();

// Public routes
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.get("/verify-reset-token/:token", AuthController.verifyResetToken);
router.post("/logout", authenticate, AuthController.logout);
router.post("/logout-all", authenticate, AuthController.logoutAll);

export default router;
