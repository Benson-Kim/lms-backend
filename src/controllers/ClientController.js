const ClientService = require("../services/clientService");

class ClientController {
	static async createClient(req, res) {
		try {
			const clientData = req.body;
			const newClient = await ClientService.createClient(clientData);

			return res.status(201).json({
				success: true,
				data: newClient,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getClient(req, res) {
		try {
			const { clientId } = req.params;
			const client = await ClientService.getClient(clientId);

			return res.status(200).json({
				success: true,
				data: client,
			});
		} catch (error) {
			return res.status(404).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async updateClient(req, res) {
		try {
			const { clientId } = req.params;
			const clientData = req.body;
			const updatedClient = await ClientService.updateClient(
				clientId,
				clientData
			);

			return res.status(200).json({
				success: true,
				data: updatedClient,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getAllClients(req, res) {
		try {
			const { includeInactive } = req.query;
			const clients = await ClientService.getAllClients(
				includeInactive === "true"
			);

			return res.status(200).json({
				success: true,
				data: clients,
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async createDepartment(req, res) {
		try {
			const { clientId } = req.params;
			const departmentData = req.body;
			const newDepartment = await ClientService.createDepartment(
				clientId,
				departmentData
			);

			return res.status(201).json({
				success: true,
				data: newDepartment,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getDepartment(req, res) {
		try {
			const { departmentId } = req.params;
			const department = await ClientService.getDepartment(departmentId);

			return res.status(200).json({
				success: true,
				data: department,
			});
		} catch (error) {
			return res.status(404).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async createGroup(req, res) {
		try {
			const { departmentId } = req.params;
			const groupData = req.body;
			const newGroup = await ClientService.createGroup(departmentId, groupData);

			return res.status(201).json({
				success: true,
				data: newGroup,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async getGroup(req, res) {
		try {
			const { groupId } = req.params;
			const group = await ClientService.getGroup(groupId);

			return res.status(200).json({
				success: true,
				data: group,
			});
		} catch (error) {
			return res.status(404).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async deactivateClient(req, res) {
		try {
			const { clientId } = req.params;
			const updatedClient = await ClientService.deactivateClient(clientId);

			return res.status(200).json({
				success: true,
				data: updatedClient,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}

	static async activateClient(req, res) {
		try {
			const { clientId } = req.params;
			const updatedClient = await ClientService.activateClient(clientId);

			return res.status(200).json({
				success: true,
				data: updatedClient,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
	}
}

module.exports = ClientController;
