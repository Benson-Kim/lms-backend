import pool from "../../config/database";

class Client {
	static async findById(id) {
		const result = await pool.query("SELECT * FROM clients WHERE id = $1", [
			id,
		]);
		return result.rows[0];
	}

	static async findAll(includeInactive = false) {
		let query = "SELECT * FROM clients";

		if (!includeInactive) {
			query += " WHERE is_active = true";
		}

		query += " ORDER BY name";

		const result = await pool.query(query);
		return result.rows;
	}

	static async create(clientData) {
		const { name, type, domain, logoUrl, primaryColor, secondaryColor } =
			clientData;

		const result = await pool.query(
			"INSERT INTO clients (name, type, domain, logo_url, primary_color, secondary_color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
			[name, type, domain, logoUrl, primaryColor, secondaryColor],
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
			[name, domain, logoUrl, primaryColor, secondaryColor, isActive, id],
		);

		return result.rows[0];
	}

	static async getUsers(clientId, options = {}) {
		const { role, status = "active" } = options;

		let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.profile_image, ur.role, ur.status
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.entity_type = $1 AND ur.entity_id = $2
    `;

		const queryParams = ["client", clientId];
		let paramIndex = 3;

		if (role) {
			query += ` AND ur.role = $${paramIndex}`;
			queryParams.push(role);
			paramIndex++;
		}

		if (status) {
			query += ` AND ur.status = $${paramIndex}`;
			queryParams.push(status);
		}

		query += " ORDER BY u.last_name, u.first_name";

		const result = await pool.query(query, queryParams);
		return result.rows;
	}

	static async getAdminUsers(clientId) {
		return this.getUsers(clientId, { role: "admin" });
	}

	static async getDepartments(clientId) {
		const result = await pool.query(
			"SELECT * FROM departments WHERE client_id = $1 ORDER BY name",
			[clientId],
		);

		return result.rows;
	}

	static async getDepartmentById(departmentId) {
		const result = await pool.query("SELECT * FROM departments WHERE id = $1", [
			departmentId,
		]);

		return result.rows[0];
	}

	static async getDepartmentGroups(departmentId) {
		const result = await pool.query(
			"SELECT * FROM groups WHERE department_id = $1 ORDER BY name",
			[departmentId],
		);

		return result.rows;
	}

	static async getDepartmentAdmins(departmentId) {
		const query = `
			SELECT u.id, u.email, u.first_name, u.last_name, u.profile_image
			FROM users u
			JOIN user_roles ur ON u.id = ur.user_id
			WHERE ur.entity_type = 'department' AND ur.entity_id = $1 AND ur.role = 'admin' AND ur.status = 'active'
			ORDER BY u.last_name, u.first_name
		`;

		const result = await pool.query(query, [departmentId]);
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

	static async getGroupById(groupId) {
		const result = await pool.query("SELECT * FROM groups WHERE id = $1", [
			groupId,
		]);

		return result.rows[0];
	}

	static async getGroupMembers(groupId) {
		const query = `
			SELECT u.id, u.email, u.first_name, u.last_name, u.profile_image, ur.role
			FROM users u
			JOIN user_roles ur ON u.id = ur.user_id
			WHERE ur.entity_type = 'group' AND ur.entity_id = $1 AND ur.status = 'active'
			ORDER BY ur.role, u.last_name, u.first_name
		`;

		const result = await pool.query(query, [groupId]);
		return result.rows;
	}

	static async createDepartment(departmentData) {
		const { client_id, name } = departmentData;

		const result = await pool.query(
			"INSERT INTO departments (client_id, name) VALUES ($1, $2) RETURNING *",
			[client_id, name],
		);

		return result.rows[0];
	}

	static async createGroup(groupData) {
		const { client_id, department_id, name } = groupData;

		const result = await pool.query(
			"INSERT INTO groups (client_id, department_id, name) VALUES ($1, $2, $3) RETURNING *",
			[client_id, department_id, name],
		);

		return result.rows[0];
	}

	static async addUserRole(userId, entityType, entityId, role) {
		const result = await pool.query(
			`INSERT INTO user_roles (user_id, entity_type, entity_id, role)
			VALUES ($1, $2, $3, $4)
			RETURNING *`,
			[userId, entityType, entityId, role],
		);

		return result.rows[0];
	}

	static async updateUserRole(id, status) {
		const result = await pool.query(
			`UPDATE user_roles
			SET status = $1, updated_at = CURRENT_TIMESTAMP
			WHERE id = $2
			RETURNING *`,
			[status, id],
		);

		return result.rows[0];
	}

	static async getAll(includeInactive = false) {
		return this.findAll(includeInactive);
	}
}

export default Client;
