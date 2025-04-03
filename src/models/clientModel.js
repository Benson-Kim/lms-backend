const { pool } = require("../config/database");

class Client {
	static async findById(id) {
		const result = await pool.query("SELECT * FROM clients WHERE id = $1", [
			id,
		]);
		return result.rows[0];
	}

	static async findAll(options = {}) {
		const { isActive = true } = options;

		const result = await pool.query(
			"SELECT * FROM clients WHERE is_active = $1 ORDER BY name",
			[isActive]
		);

		return result.rows;
	}

	static async create(clientData) {
		const { name, type, domain, logoUrl, primaryColor, secondaryColor } =
			clientData;

		const result = await pool.query(
			"INSERT INTO clients (name, type, domain, logo_url, primary_color, secondary_color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
			[name, type, domain, logoUrl, primaryColor, secondaryColor]
		);

		return result.rows[0];
	}

	static async update(id, clientData) {
		const { name, domain, logoUrl, primaryColor, secondaryColor, isActive } =
			clientData;

		const result = await pool.query(
			`UPDATE clients 
       SET name = COALESCE($1, name),
           domain = COALESCE($2, domain),
           logo_url = COALESCE($3, logo_url),
           primary_color = COALESCE($4, primary_color),
           secondary_color = COALESCE($5, secondary_color),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
			[name, domain, logoUrl, primaryColor, secondaryColor, isActive, id]
		);

		return result.rows[0];
	}

	static async getUsers(clientId, options = {}) {
		const { role } = options;

		let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.profile_image, ur.role, ur.status
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.entity_type = $1 AND ur.entity_id = $2
    `;

		const queryParams = ["client", clientId];

		if (role) {
			query += " AND ur.role = $3";
			queryParams.push(role);
		}

		query += " ORDER BY u.last_name, u.first_name";

		const result = await pool.query(query, queryParams);
		return result.rows;
	}

	static async getDepartments(clientId) {
		const result = await pool.query(
			"SELECT * FROM departments WHERE client_id = $1 ORDER BY name",
			[clientId]
		);

		return result.rows;
	}

	static async getGroups(clientId, departmentId = null) {
		let query = "SELECT * FROM groups WHERE client_id = $1";
		const queryParams = [clientId];

		if (departmentId) {
			query += " AND department_id = $2";
			queryParams.push(departmentId);
		}

		query += " ORDER BY name";

		const result = await pool.query(query, queryParams);
		return result.rows;
	}

	static async createDepartment(clientId, name) {
		const result = await pool.query(
			"INSERT INTO departments (client_id, name) VALUES ($1, $2) RETURNING *",
			[clientId, name]
		);

		return result.rows[0];
	}

	static async createGroup(clientId, name, departmentId = null) {
		const result = await pool.query(
			"INSERT INTO groups (client_id, department_id, name) VALUES ($1, $2, $3) RETURNING *",
			[clientId, departmentId, name]
		);

		return result.rows[0];
	}
}

module.exports = Client;
