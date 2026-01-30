import express from "express";


import UserController from './user.controller.js'
import AuthMiddleware from "../../middleware/AuthMiddleware.js";

const { authenticate, isSystemAdmin } = AuthMiddleware;

const router = express.Router();

// User routes
router.get("/user/profile", authenticate, UserController.getProfile);
router.put("/user/profile", authenticate, UserController.updateProfile);
router.post(
  "/user/change-password",
  authenticate,
  UserController.changePassword,
);

// User management routes (system admin only)
router.post("/users", authenticate, isSystemAdmin, UserController.createUser);
router.post(
  "/users/roles",
  authenticate,
  isSystemAdmin,
  UserController.assignRole,
);
router.delete(
  "/users/roles",
  authenticate,
  isSystemAdmin,
  UserController.removeRole,
);
router.get(
  "/users/search",
  authenticate,
  isSystemAdmin,
  UserController.searchUsers,
);

// Get users by entity (e.g., client, department, group)
router.get("/users/by-entity", authenticate, UserController.getUsersByEntity);

export default router;