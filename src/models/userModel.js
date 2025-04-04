import pool from "../config/database.js";

class User {
	static async findById(id) {
		const result = await pool.query(
			"SELECT id, email, first_name, last_name, profile_image, is_system_admin, is_individual_learner FROM users WHERE id = $1",
			[id]
		);
		return result.rows[0];
	}

	static async findByIdWithPassword(id) {
		const result = await pool.query(
			"SELECT id, email, password, first_name, last_name, profile_image, is_system_admin, is_individual_learner FROM users WHERE id = $1",
			[id]
		);
		return result.rows[0];
	}

	static async findByEmail(email) {
		const result = await pool.query(
			"SELECT id, email, password, first_name, last_name, profile_image, is_system_admin, is_individual_learner FROM users WHERE email = $1",
			[email]
		);
		return result.rows[0];
	}

	static async create(userData) {
		const {
			email,
			password,
			firstName,
			lastName,
			profileImage,
			isSystemAdmin,
			isIndividualLearner,
		} = userData;

		const result = await pool.query(
			"INSERT INTO users (email, password, first_name, last_name, profile_image, is_system_admin, is_individual_learner) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name, last_name, profile_image, is_system_admin, is_individual_learner",
			[
				email,
				password,
				firstName,
				lastName,
				profileImage,
				isSystemAdmin || false,
				isIndividualLearner || false,
			]
		);

		return result.rows[0];
	}

	static async update(id, userData) {
		const { firstName, lastName, profileImage } = userData;

		const result = await pool.query(
			`UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           profile_image = COALESCE($3, profile_image),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, first_name, last_name, profile_image, is_system_admin, is_individual_learner`,
			[firstName, lastName, profileImage, id]
		);

		return result.rows[0];
	}

	static async updatePassword(id, hashedPassword) {
		const result = await pool.query(
			"UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id",
			[hashedPassword, id]
		);

		return result.rows[0];
	}

	static async getUserRoles(userId) {
		const result = await pool.query(
			`SELECT ur.entity_type, ur.entity_id, ur.role, 
       CASE 
         WHEN ur.entity_type = 'client' THEN c.name
         WHEN ur.entity_type = 'department' THEN d.name
         WHEN ur.entity_type = 'group' THEN g.name
         ELSE NULL
       END as entity_name
       FROM user_roles ur
       LEFT JOIN clients c ON ur.entity_type = 'client' AND ur.entity_id = c.id
       LEFT JOIN departments d ON ur.entity_type = 'department' AND ur.entity_id = d.id
       LEFT JOIN groups g ON ur.entity_type = 'group' AND ur.entity_id = g.id
       WHERE ur.user_id = $1 AND ur.status = $2`,
			[userId, "active"]
		);

		return result.rows;
	}

	static async assignRole(userId, entityType, entityId, role) {
		// Check if role already exists
		const existingRole = await pool.query(
			"SELECT id, status FROM user_roles WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 AND role = $4",
			[userId, entityType, entityId, role]
		);

		if (existingRole.rows.length > 0) {
			// If role exists but is inactive, reactivate it
			if (existingRole.rows[0].status !== "active") {
				const result = await pool.query(
					"UPDATE user_roles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
					["active", existingRole.rows[0].id]
				);
				return result.rows[0];
			}
			// Role already exists and is active
			return existingRole.rows[0];
		}

		// Create new role
		const result = await pool.query(
			"INSERT INTO user_roles (user_id, entity_type, entity_id, role) VALUES ($1, $2, $3, $4) RETURNING *",
			[userId, entityType, entityId, role]
		);

		return result.rows[0];
	}

	static async removeRole(userId, entityType, entityId, role) {
		const result = await pool.query(
			"UPDATE user_roles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND entity_type = $3 AND entity_id = $4 AND role = $5 RETURNING *",
			["inactive", userId, entityType, entityId, role]
		);

		return result.rows[0];
	}

	static async searchUsers(searchTerm, limit = 10) {
		const query = `
      SELECT id, email, first_name, last_name, profile_image
      FROM users
      WHERE 
        email ILIKE $1 OR
        first_name ILIKE $1 OR
        last_name ILIKE $1
      LIMIT $2
    `;

		const result = await pool.query(query, [`%${searchTerm}%`, limit]);
		return result.rows;
	}

	static async getUsersByEntity(entityType, entityId, role = null) {
		let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.profile_image, ur.role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.entity_type = $1 AND ur.entity_id = $2 AND ur.status = 'active'
    `;

		const params = [entityType, entityId];

		if (role) {
			query += " AND ur.role = $3";
			params.push(role);
		}

		const result = await pool.query(query, params);
		return result.rows;
	}

	static async checkEntityExists(entityType, entityId) {
		let table;
		switch (entityType) {
			case "client":
				table = "clients";
				break;
			case "department":
				table = "departments";
				break;
			case "group":
				table = "groups";
				break;
			default:
				throw new Error(`Invalid entity type: ${entityType}`);
		}

		const result = await pool.query(`SELECT id FROM ${table} WHERE id = $1`, [
			entityId,
		]);
		return result.rows.length > 0;
	}
}

export default User;
