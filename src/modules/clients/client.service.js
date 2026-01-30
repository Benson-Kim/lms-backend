import Client from "./client.model";

class ClientService {
	static async createClient(clientData) {
		// Validate required fields
		if (!clientData.name || !clientData.type) {
			throw new Error("Client name and type are required");
		}

		if (!["school", "organization"].includes(clientData.type)) {
			throw new Error('Client type must be either "school" or "organization"');
		}

		return Client.create(clientData);
	}

	static async getClient(clientId) {
		const client = await Client.findById(clientId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Get departments
		const departments = await Client.getDepartments(clientId);

		// Get admins
		const admins = await Client.getAdminUsers(clientId);

		return {
			...client,
			departments,
			admins,
		};
	}

	static async updateClient(clientId, clientData) {
		// Check if client exists
		const client = await Client.findById(clientId);

		if (!client) {
			throw new Error("Client not found");
		}

		const updatedClient = await Client.update(clientId, clientData);

		if (!updatedClient) {
			throw new Error("Failed to update client");
		}

		return updatedClient;
	}

	static async createDepartment(clientId, departmentData) {
		// Check if client exists
		const client = await Client.findById(clientId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Validate required fields
		if (!departmentData.name) {
			throw new Error("Department name is required");
		}

		// Add client_id to department data
		departmentData.client_id = clientId;

		return Client.createDepartment(departmentData);
	}

	static async getDepartment(departmentId) {
		const department = await Client.getDepartmentById(departmentId);

		if (!department) {
			throw new Error("Department not found");
		}

		// Get groups
		const groups = await Client.getDepartmentGroups(departmentId);

		// Get department admins
		const admins = await Client.getDepartmentAdmins(departmentId);

		return {
			...department,
			groups,
			admins,
		};
	}

	static async createGroup(departmentId, groupData) {
		// Check if department exists
		const department = await Client.getDepartmentById(departmentId);

		if (!department) {
			throw new Error("Department not found");
		}

		// Validate required fields
		if (!groupData.name) {
			throw new Error("Group name is required");
		}

		// Add department_id and client_id to group data
		groupData.department_id = departmentId;
		groupData.client_id = department.client_id;

		return Client.createGroup(groupData);
	}

	static async getGroup(groupId) {
		const group = await Client.getGroupById(groupId);

		if (!group) {
			throw new Error("Group not found");
		}

		// Get members
		const members = await Client.getGroupMembers(groupId);

		return {
			...group,
			members,
		};
	}

	static async getAllClients(includeInactive = false) {
		return Client.getAll(includeInactive);
	}

	static async deactivateClient(clientId) {
		// Check if client exists
		const client = await Client.findById(clientId);

		if (!client) {
			throw new Error("Client not found");
		}

		if (!client.is_active) {
			throw new Error("Client is already inactive");
		}

		return Client.update(clientId, { isActive: false });
	}

	static async activateClient(clientId) {
		// Check if client exists
		const client = await Client.findById(clientId);

		if (!client) {
			throw new Error("Client not found");
		}

		if (client.is_active) {
			throw new Error("Client is already active");
		}

		return Client.update(clientId, { isActive: true });
	}

	static async addUserToClient(clientId, userId, role) {
		// Check if client exists
		const client = await Client.findById(clientId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Validate role
		if (!["admin", "instructor", "student", "member"].includes(role)) {
			throw new Error("Invalid role");
		}

		return Client.addUserRole(userId, "client", clientId, role);
	}

	static async addUserToDepartment(departmentId, userId, role) {
		// Check if department exists
		const department = await Client.getDepartmentById(departmentId);

		if (!department) {
			throw new Error("Department not found");
		}

		// Validate role
		if (!["admin", "instructor", "student", "member"].includes(role)) {
			throw new Error("Invalid role");
		}

		return Client.addUserRole(userId, "department", departmentId, role);
	}

	static async addUserToGroup(groupId, userId, role) {
		// Check if group exists
		const group = await Client.getGroupById(groupId);

		if (!group) {
			throw new Error("Group not found");
		}

		// Validate role
		if (!["admin", "instructor", "student", "member"].includes(role)) {
			throw new Error("Invalid role");
		}

		return Client.addUserRole(userId, "group", groupId, role);
	}
}

export default ClientService;
