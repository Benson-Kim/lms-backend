// src/db/seeds/run.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
import bcrypt from "bcryptjs";
const { v4: uuidv4 } = require("uuid");

// Create connection pool
const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT || 5432,
	ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function seedDatabase() {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		// Create system admin user
		const hashedPassword = await bcrypt.hash("Admin123!", 10);
		const adminResult = await client.query(
			`INSERT INTO users (email, password, first_name, last_name, is_system_admin)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET is_system_admin = true
       RETURNING id, email`,
			["admin@example.com", hashedPassword, "System", "Admin", true]
		);

		const adminId = adminResult.rows[0].id;
		console.log(`System admin created: ${adminResult.rows[0].email}`);

		// Create test clients
		const clients = [
			{ name: "Acme University", type: "school", domain: "acme.edu" },
			{
				name: "Tech Training Corp",
				type: "organization",
				domain: "techtraining.com",
			},
		];

		const clientIds = [];

		for (const clientData of clients) {
			const clientResult = await pool.query(
				`INSERT INTO clients (name, type, domain, primary_color, secondary_color)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (domain) DO UPDATE
         SET name = $1
         RETURNING id`,
				[
					clientData.name,
					clientData.type,
					clientData.domain,
					"#3366CC",
					"#66CC99",
				]
			);

			const clientId = clientResult.rows[0].id;
			clientIds.push(clientId);
			console.log(`Client created: ${clientData.name}`);

			// Create departments for each client
			const departments = [{ name: "Computer Science" }, { name: "Business" }];

			for (const dept of departments) {
				const deptResult = await client.query(
					`INSERT INTO departments (client_id, name)
           VALUES ($1, $2)
           RETURNING id`,
					[clientId, dept.name]
				);

				const deptId = deptResult.rows[0].id;
				console.log(`Department created: ${dept.name}`);

				// Create groups for each department
				const groups = [{ name: "Section A" }, { name: "Section B" }];

				for (const group of groups) {
					await client.query(
						`INSERT INTO groups (client_id, department_id, name)
             VALUES ($1, $2, $3)`,
						[clientId, deptId, group.name]
					);
					console.log(`Group created: ${group.name}`);
				}
			}
		}

		// Create test courses
		const courses = [
			{
				title: "Introduction to Programming",
				description: "Learn the basics of programming with JavaScript",
				ownerType: "system",
				isPublic: true,
			},
			{
				title: "Web Development Fundamentals",
				description: "HTML, CSS, and JavaScript for beginners",
				ownerType: "client",
				ownerId: clientIds[0],
				isPublic: false,
			},
		];

		for (const course of courses) {
			const courseResult = await client.query(
				`INSERT INTO courses (title, description, owner_type, owner_id, is_public)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
				[
					course.title,
					course.description,
					course.ownerType,
					course.ownerId,
					course.isPublic,
				]
			);

			const courseId = courseResult.rows[0].id;
			console.log(`Course created: ${course.title}`);

			// Create modules for each course
			const modules = [
				{ title: "Getting Started", position: 1 },
				{ title: "Core Concepts", position: 2 },
				{ title: "Advanced Topics", position: 3 },
			];

			for (const module of modules) {
				const moduleResult = await client.query(
					`INSERT INTO modules (course_id, title, position)
           VALUES ($1, $2, $3)
           RETURNING id`,
					[courseId, module.title, module.position]
				);

				const moduleId = moduleResult.rows[0].id;
				console.log(`Module created: ${module.title}`);

				// Create content items for each module
				const contentItems = [
					{
						title: "Introduction",
						contentType: "text",
						content: JSON.stringify({ text: "Welcome to this course!" }),
						position: 1,
					},
					{
						title: "First Steps",
						contentType: "video",
						content: JSON.stringify({
							url: "https://example.com/video1.mp4",
							duration: 600,
						}),
						position: 2,
					},
					{
						title: "Basic Quiz",
						contentType: "quiz",
						content: JSON.stringify({
							questions: [
								{
									text: "What is programming?",
									options: [
										"Writing code",
										"Creating websites",
										"Both A and B",
										"None of the above",
									],
									correctAnswer: 2,
								},
							],
						}),
						position: 3,
					},
				];

				for (const item of contentItems) {
					await client.query(
						`INSERT INTO content_items (module_id, title, content_type, content, position)
             VALUES ($1, $2, $3, $4, $5)`,
						[
							moduleId,
							item.title,
							item.contentType,
							item.content,
							item.position,
						]
					);
					console.log(`Content item created: ${item.title}`);
				}
			}
		}

		// Create test users
		const users = [
			{
				email: "instructor@example.com",
				firstName: "John",
				lastName: "Teacher",
				role: "instructor",
			},
			{
				email: "student@example.com",
				firstName: "Jane",
				lastName: "Student",
				role: "student",
			},
		];

		for (const user of users) {
			const hashedPassword = await bcrypt.hash("Password123!", 10);
			const userResult = await client.query(
				`INSERT INTO users (email, password, first_name, last_name, is_individual_learner)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
				[user.email, hashedPassword, user.firstName, user.lastName, true]
			);

			if (userResult.rows.length > 0) {
				const userId = userResult.rows[0].id;
				console.log(`User created: ${user.email}`);

				// Assign roles
				await client.query(
					`INSERT INTO user_roles (user_id, entity_type, entity_id, role)
           VALUES ($1, $2, $3, $4)`,
					[userId, "client", clientIds[0], user.role]
				);
				console.log(`Role assigned: ${user.role} for ${user.email}`);

				// Enroll student in a course
				if (user.role === "student") {
					const courseResult = await client.query(
						"SELECT id FROM courses LIMIT 1"
					);
					if (courseResult.rows.length > 0) {
						const courseId = courseResult.rows[0].id;
						await client.query(
							`INSERT INTO enrollments (user_id, course_id)
               VALUES ($1, $2)`,
							[userId, courseId]
						);
						console.log(`Student enrolled in course`);
					}
				}
			}
		}

		await client.query("COMMIT");
		console.log("Database seeded successfully");
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Error seeding database:", error);
		process.exit(1);
	} finally {
		client.release();
		await pool.end();
	}
}

seedDatabase().catch((error) => {
	console.error("Seed error:", error);
	process.exit(1);
});
