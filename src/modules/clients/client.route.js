import express from "express";

import ClientController from "./Client.controller";

import authMiddleware from "../../common/middlewares/auth.middleware";

const { authenticate, hasRole, isSystemAdmin } = authMiddleware;

const router = express.Router();

router.post(
	"/clients",
	authenticate,
	isSystemAdmin,
	ClientController.createClient,
);

router.get("/clients/:clientId", authenticate, ClientController.getClient);

router.put(
	"/clients/:clientId",
	authenticate,
	hasRole("client", "admin"),
	ClientController.updateClient,
);

router.get(
	"/clients",
	authenticate,
	isSystemAdmin,
	ClientController.getAllClients,
);

router.post(
	"/clients/:clientId/departments",
	authenticate,
	hasRole("client", "admin"),
	ClientController.createDepartment,
);

router.get(
	"/departments/:departmentId",
	authenticate,
	ClientController.getDepartment,
);

router.post(
	"/departments/:departmentId/groups",
	authenticate,
	hasRole("department", "admin"),
	ClientController.createGroup,
);

router.get("/groups/:groupId", authenticate, ClientController.getGroup);

router.put(
	"/clients/:clientId/deactivate",
	authenticate,
	isSystemAdmin,
	ClientController.deactivateClient,
);

router.put(
	"/clients/:clientId/activate",
	authenticate,
	isSystemAdmin,
	ClientController.activateClient,
);

router.post(
	"/clients/:clientId/users",
	authenticate,
	hasRole("client", "admin"),
	ClientController.addUserToClient,
);

router.post(
	"/departments/:departmentId/users",
	authenticate,
	hasRole("department", "admin"),
	ClientController.addUserToDepartment,
);

router.post(
	"/groups/:groupId/users",
	authenticate,
	hasRole("group", "admin"),
	ClientController.addUserToGroup,
);

export default router;
