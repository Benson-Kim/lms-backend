import userCache from "../../../utils/userCache.js";
import pool from "../../config/database.js";

class User {
	static async findById(id) {
		const cachedUser = userCache.getCachedUser(id);
		if (cachedUser) {
			return cachedUser;
		}

		const result = await pool.query(
			"SELECT id, email, first_name, last_name, profile_image, is_system_admin, is_individual_learner FROM users WHERE id = $1",
			[id]
		);
		const user = result.rows[0];

		if (user) {
			userCache.cacheUser(id, user);
		}

		return user;
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

		userCache.invalidateUserCache(id);

		return result.rows[0];
	}

	static async updatePassword(id, hashedPassword) {
		const result = await pool.query(
			"UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id",
			[hashedPassword, id]
		);

		userCache.invalidateUserCache(id);

		return result.rows[0];
	}

	static async getUserRoles(userId) {
		const cachedRoles = userCache.getCachedUserRoles(userId);
		if (cachedRoles) {
			return cachedRoles;
		}

		const result = await pool.query(
			`WITH user_role_data AS (
				SELECT ur.entity_type, ur.entity_id, ur.role
				FROM user_roles ur
				WHERE ur.user_id = $1 AND ur.status = $2
			)
			SELECT 
				urd.entity_type, 
				urd.entity_id, 
				urd.role,
				CASE 
					WHEN urd.entity_type = 'client' THEN c.name
					WHEN urd.entity_type = 'department' THEN d.name
					WHEN urd.entity_type = 'group' THEN g.name
					ELSE NULL
				END as entity_name
			FROM user_role_data urd
			LEFT JOIN clients c ON urd.entity_type = 'client' AND urd.entity_id = c.id
			LEFT JOIN departments d ON urd.entity_type = 'department' AND urd.entity_id = d.id
			LEFT JOIN groups g ON urd.entity_type = 'group' AND urd.entity_id = g.id`,
			[userId, "active"]
		);

		const roles = result.rows;
		console.log("Fetched roles:", roles);

		userCache.cacheUserRoles(userId, roles);

		return roles;
	}

	static async assignRole(userId, entityType, entityId, role) {
		const client = await pool.connect();

		try {
			await client.query("BEGIN");

			// Check if role already exists
			const existingRole = await client.query(
				"SELECT id, status FROM user_roles WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 AND role = $4",
				[userId, entityType, entityId, role]
			);

			let result;

			if (existingRole.rows.length > 0) {
				// If role exists but is inactive, reactivate it
				if (existingRole.rows[0].status !== "active") {
					result = await client.query(
						"UPDATE user_roles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
						["active", existingRole.rows[0].id]
					);
				} else {
					// Role already exists and is active
					result = { rows: [existingRole.rows[0]] };
				}
			} else {
				// Create new role
				result = await client.query(
					"INSERT INTO user_roles (user_id, entity_type, entity_id, role) VALUES ($1, $2, $3, $4) RETURNING *",
					[userId, entityType, entityId, role]
				);
			}

			await client.query("COMMIT");

			// Invalidate roles cache
			userCache.invalidateUserCache(userId);

			return result.rows[0];
		} catch (e) {
			await client.query("ROLLBACK");
			throw e;
		} finally {
			client.release();
		}
	}

	static async removeRole(userId, entityType, entityId, role) {
		const result = await pool.query(
			"UPDATE user_roles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND entity_type = $3 AND entity_id = $4 AND role = $5 RETURNING *",
			["inactive", userId, entityType, entityId, role]
		);

		userCache.invalidateUserCache(userId);

		return result.rows[0];
	}

	static async searchUsers(searchTerm, limit = 10) {
		// Implement pagination
		const offset = (page - 1) * pageSize;

		const query = `
			SELECT id, email, first_name, last_name, profile_image
			FROM users
			WHERE 
				email ILIKE $1 OR
				first_name ILIKE $1 OR
				last_name ILIKE $1
			ORDER BY last_name, first_name
			LIMIT $2 OFFSET $3
		`;

		const countQuery = `
			SELECT COUNT(*) as total
			FROM users
			WHERE 
				email ILIKE $1 OR
				first_name ILIKE $1 OR
				last_name ILIKE $1
		`;

		const [usersResult, countResult] = await Promise.all([
			pool.query(query, [`%${searchTerm}%`, pageSize, offset]),
			pool.query(countQuery, [`%${searchTerm}%`]),
		]);

		return {
			users: usersResult.rows,
			pagination: {
				total: parseInt(countResult.rows[0].total),
				page,
				pageSize,
				pages: Math.ceil(parseInt(countResult.rows[0].total) / pageSize),
			},
		};
	}

	static async getUsersByEntity(entityType, entityId, role = null) {
		const offset = (page - 1) * pageSize;

		let query = `
			SELECT u.id, u.email, u.first_name, u.last_name, u.profile_image, ur.role
			FROM users u
			JOIN user_roles ur ON u.id = ur.user_id
			WHERE ur.entity_type = $1 AND ur.entity_id = $2 AND ur.status = 'active'
		`;

		let countQuery = `
			SELECT COUNT(*) as total
			FROM users u
			JOIN user_roles ur ON u.id = ur.user_id
			WHERE ur.entity_type = $1 AND ur.entity_id = $2 AND ur.status = 'active'
		`;

		const params = [entityType, entityId];
		const countParams = [entityType, entityId];

		if (role) {
			query += " AND ur.role = $3";
			countQuery += " AND ur.role = $3";
			params.push(role);
			countParams.push(role);
		}

		query +=
			" ORDER BY u.last_name, u.first_name LIMIT $" +
			(params.length + 1) +
			" OFFSET $" +
			(params.length + 2);
		params.push(pageSize, offset);

		const [usersResult, countResult] = await Promise.all([
			pool.query(query, params),
			pool.query(countQuery, countParams),
		]);

		return {
			users: usersResult.rows,
			pagination: {
				total: parseInt(countResult.rows[0].total),
				page,
				pageSize,
				pages: Math.ceil(parseInt(countResult.rows[0].total) / pageSize),
			},
		};
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

		const cacheKey = `entity:${entityType}:${entityId}`;
		const cachedResult = userCache.getCachedUser(cacheKey);
		if (cachedResult !== undefined) {
			return cachedResult;
		}

		const result = await pool.query(
			`SELECT 1 FROM ${table} WHERE id = $1 LIMIT 1`,
			[entityId]
		);
		const exists = result.rows.length > 0;

		userCache.cacheUser(cacheKey, exists);

		return exists;
	}
}

export default User;
