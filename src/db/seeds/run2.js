// src/db/seeds/run.js
import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

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
		console.log("Starting database seed process...");

		// Create system admin user
		const hashedPassword = await bcrypt.hash("SecurePass123!", 10);
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

		// Create test individual learner
		const individualLearnerResult = await client.query(
			`INSERT INTO users (email, password, first_name, last_name, is_individual_learner)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET is_individual_learner = true
       RETURNING id, email`,
			["learner@example.com", hashedPassword, "Individual", "Learner", true]
		);

		console.log(
			`Individual learner created: ${individualLearnerResult.rows[0].email}`
		);

		// Create test clients
		const clients = [
			{
				name: "Tech University",
				type: "school",
				domain: "techu.edu",
				logo_url: "https://storage.example.com/logos/techu.png",
				primary_color: "#4285F4",
				secondary_color: "#34A853",
			},
			{
				name: "Corporate Learning Inc",
				type: "organization",
				domain: "corplearn.com",
				logo_url: "https://storage.example.com/logos/corplearn.png",
				primary_color: "#EA4335",
				secondary_color: "#FBBC05",
			},
			{
				name: "Public School District",
				type: "school",
				domain: "psd.edu",
				logo_url: "https://storage.example.com/logos/psd.png",
				primary_color: "#673AB7",
				secondary_color: "#3F51B5",
			},
		];

		const clientIds = {};

		for (const clientData of clients) {
			const clientResult = await client.query(
				`INSERT INTO clients (name, type, domain, logo_url, primary_color, secondary_color)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (domain) DO UPDATE
         SET name = $1
         RETURNING id, name`,
				[
					clientData.name,
					clientData.type,
					clientData.domain,
					clientData.logo_url,
					clientData.primary_color,
					clientData.secondary_color,
				]
			);

			const clientId = clientResult.rows[0].id;
			const clientName = clientResult.rows[0].name;
			clientIds[clientName] = clientId;
			console.log(`Client created: ${clientName}`);

			// Create departments for each client
			const departments = [
				{ name: "Computer Science", client: "Tech University" },
				{ name: "Mathematics", client: "Tech University" },
				{ name: "Sales", client: "Corporate Learning Inc" },
				{ name: "Product Development", client: "Corporate Learning Inc" },
				{ name: "Elementary Education", client: "Public School District" },
				{ name: "Secondary Education", client: "Public School District" },
			].filter((dept) => dept.client === clientName);

			const departmentIds = {};

			for (const dept of departments) {
				const deptResult = await client.query(
					`INSERT INTO departments (client_id, name)
           VALUES ($1, $2)
           RETURNING id, name`,
					[clientId, dept.name]
				);

				const deptId = deptResult.rows[0].id;
				const deptName = deptResult.rows[0].name;
				departmentIds[deptName] = deptId;
				console.log(`Department created: ${deptName} for ${clientName}`);

				// Create groups for each department
				const groups = [
					{ name: "Freshmen", department: "Computer Science" },
					{ name: "Sophomore", department: "Computer Science" },
					{ name: "Algebra Group", department: "Mathematics" },
					{ name: "Team North", department: "Sales" },
					{ name: "Team East", department: "Sales" },
					{ name: "Mobile Team", department: "Product Development" },
					{ name: "Grade 3", department: "Elementary Education" },
					{ name: "Grade 4", department: "Elementary Education" },
					{ name: "Physics Class", department: "Secondary Education" },
				].filter((group) => group.department === deptName);

				for (const group of groups) {
					const groupResult = await client.query(
						`INSERT INTO groups (client_id, department_id, name)
             VALUES ($1, $2, $3)
             RETURNING id, name`,
						[clientId, deptId, group.name]
					);

					console.log(
						`Group created: ${groupResult.rows[0].name} in ${deptName}`
					);
				}
			}
		}

		// Create test users for each client
		const users = [
			{
				email: "cs.admin@techu.edu",
				firstName: "Thomas",
				lastName: "Johnson",
				client: "Tech University",
				department: "Computer Science",
				role: "admin",
			},
			{
				email: "math.admin@techu.edu",
				firstName: "Lisa",
				lastName: "Wong",
				client: "Tech University",
				department: "Mathematics",
				role: "admin",
			},
			{
				email: "professor@techu.edu",
				firstName: "Robert",
				lastName: "Smith",
				client: "Tech University",
				department: "Computer Science",
				role: "instructor",
			},
			{
				email: "student1@techu.edu",
				firstName: "Emma",
				lastName: "Davis",
				client: "Tech University",
				department: "Computer Science",
				role: "student",
			},
			{
				email: "student2@techu.edu",
				firstName: "James",
				lastName: "Wilson",
				client: "Tech University",
				department: "Mathematics",
				role: "student",
			},
			{
				email: "hr.manager@corplearn.com",
				firstName: "Patricia",
				lastName: "Miller",
				client: "Corporate Learning Inc",
				department: "Sales",
				role: "admin",
			},
			{
				email: "trainer@corplearn.com",
				firstName: "Michael",
				lastName: "Brown",
				client: "Corporate Learning Inc",
				department: "Sales",
				role: "instructor",
			},
			{
				email: "employee@corplearn.com",
				firstName: "Sarah",
				lastName: "Taylor",
				client: "Corporate Learning Inc",
				department: "Product Development",
				role: "student",
			},
			{
				email: "teacher@psd.edu",
				firstName: "David",
				lastName: "Anderson",
				client: "Public School District",
				department: "Elementary Education",
				role: "instructor",
			},
			{
				email: "highschool.teacher@psd.edu",
				firstName: "Jennifer",
				lastName: "Martinez",
				client: "Public School District",
				department: "Secondary Education",
				role: "instructor",
			},
		];

		for (const user of users) {
			const hashedPassword = await bcrypt.hash("Password123!", 10);
			const userResult = await client.query(
				`INSERT INTO users (email, password, first_name, last_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
				[user.email, hashedPassword, user.firstName, user.lastName]
			);

			if (userResult.rows.length > 0) {
				const userId = userResult.rows[0].id;
				console.log(`User created: ${user.email}`);

				// Get the department ID
				const departmentResult = await client.query(
					`SELECT id FROM departments WHERE client_id = $1 AND name = $2`,
					[clientIds[user.client], user.department]
				);

				if (departmentResult.rows.length > 0) {
					const departmentId = departmentResult.rows[0].id;

					// Assign roles
					await client.query(
						`INSERT INTO user_roles (user_id, entity_type, entity_id, role)
             VALUES ($1, $2, $3, $4)`,
						[userId, "department", departmentId, user.role]
					);
					console.log(
						`Role assigned: ${user.role} for ${user.email} in ${user.department}`
					);
				}
			}
		}

		// Create system courses
		const systemCourses = [
			{
				title: "Introduction to Programming",
				description: "Learn the fundamentals of programming with Python",
				thumbnail_url:
					"https://storage.example.com/thumbnails/intro_programming.jpg",
				owner_type: "system",
				is_public: true,
			},
			{
				title: "Web Development Bootcamp",
				description: "Complete guide to modern web development",
				thumbnail_url: "https://storage.example.com/thumbnails/web_dev.jpg",
				owner_type: "system",
				is_public: true,
			},
			{
				title: "Data Science Essentials",
				description: "Learn data analysis and visualization techniques",
				thumbnail_url:
					"https://storage.example.com/thumbnails/data_science.jpg",
				owner_type: "system",
				is_public: true,
			},
		];

		for (const course of systemCourses) {
			const courseResult = await client.query(
				`INSERT INTO courses (title, description, thumbnail_url, owner_type, is_public)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
				[
					course.title,
					course.description,
					course.thumbnail_url,
					course.owner_type,
					course.is_public,
				]
			);

			const courseId = courseResult.rows[0].id;
			console.log(`System course created: ${course.title}`);

			await createModulesAndContent(client, courseId);
		}

		// Create client-owned courses
		const clientCourses = [
			{
				title: "Computer Science 101",
				description: "Introduction to computer science concepts",
				thumbnail_url: "https://storage.example.com/thumbnails/cs101.jpg",
				owner_type: "client",
				owner: "Tech University",
				is_public: false,
			},
			{
				title: "Sales Techniques",
				description: "Modern sales strategies and techniques",
				thumbnail_url: "https://storage.example.com/thumbnails/sales.jpg",
				owner_type: "client",
				owner: "Corporate Learning Inc",
				is_public: false,
			},
			{
				title: "Elementary Science",
				description: "Science curriculum for elementary students",
				thumbnail_url:
					"https://storage.example.com/thumbnails/elem_science.jpg",
				owner_type: "client",
				owner: "Public School District",
				is_public: false,
			},
		];

		for (const course of clientCourses) {
			const courseResult = await client.query(
				`INSERT INTO courses (title, description, thumbnail_url, owner_type, owner_id, is_public)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
				[
					course.title,
					course.description,
					course.thumbnail_url,
					course.owner_type,
					clientIds[course.owner],
					course.is_public,
				]
			);

			const courseId = courseResult.rows[0].id;
			console.log(`Client course created: ${course.title} for ${course.owner}`);

			await createModulesAndContent(client, courseId);
		}

		// Enroll students in courses
		const enrollments = [
			{
				studentEmail: "student1@techu.edu",
				courseTitle: "Introduction to Programming",
			},
			{
				studentEmail: "student1@techu.edu",
				courseTitle: "Computer Science 101",
			},
			{
				studentEmail: "student2@techu.edu",
				courseTitle: "Web Development Bootcamp",
			},
			{
				studentEmail: "employee@corplearn.com",
				courseTitle: "Sales Techniques",
			},
			{
				studentEmail: "learner@example.com",
				courseTitle: "Data Science Essentials",
			},
		];

		for (const enrollment of enrollments) {
			// Get student ID
			const studentResult = await client.query(
				`SELECT id FROM users WHERE email = $1`,
				[enrollment.studentEmail]
			);

			if (studentResult.rows.length > 0) {
				const studentId = studentResult.rows[0].id;

				// Get course ID
				const courseResult = await client.query(
					`SELECT id FROM courses WHERE title = $1`,
					[enrollment.courseTitle]
				);

				if (courseResult.rows.length > 0) {
					const courseId = courseResult.rows[0].id;

					// Create enrollment
					const enrollmentResult = await client.query(
						`INSERT INTO enrollments (user_id, course_id, status, progress)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
						[studentId, courseId, "enrolled", 0.0]
					);

					console.log(
						`Student ${enrollment.studentEmail} enrolled in ${enrollment.courseTitle}`
					);

					// Add some progress for first student
					if (enrollment.studentEmail === "student1@techu.edu") {
						const enrollmentId = enrollmentResult.rows[0].id;

						// Get content items for the course
						const contentResult = await client.query(
							`SELECT ci.id 
               FROM content_items ci
               JOIN modules m ON ci.module_id = m.id
               WHERE m.course_id = $1
               ORDER BY m.position, ci.position
               LIMIT 3`,
							[courseId]
						);

						if (contentResult.rows.length > 0) {
							// Complete first item
							await client.query(
								`INSERT INTO progress_records (enrollment_id, content_item_id, status, time_spent, completed_at)
                 VALUES ($1, $2, $3, $4, $5)`,
								[
									enrollmentId,
									contentResult.rows[0].id,
									"completed",
									450,
									"NOW()",
								]
							);

							// Start second item
							if (contentResult.rows.length > 1) {
								await client.query(
									`INSERT INTO progress_records (enrollment_id, content_item_id, status, time_spent)
                   VALUES ($1, $2, $3, $4)`,
									[enrollmentId, contentResult.rows[1].id, "in_progress", 200]
								);
							}

							// Update overall progress
							await client.query(
								`UPDATE enrollments SET progress = $1 WHERE id = $2`,
								[0.33, enrollmentId]
							);

							console.log(
								`Added progress records for ${enrollment.studentEmail}`
							);
						}
					}
				}
			}
		}

		// Add some refresh tokens
		const tokens = [
			{
				email: "admin@example.com",
				token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.adminRefreshToken",
				days: 30,
			},
			{
				email: "student1@techu.edu",
				token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.studentRefreshToken",
				days: 15,
			},
		];

		for (const token of tokens) {
			const userResult = await client.query(
				`SELECT id FROM users WHERE email = $1`,
				[token.email]
			);

			if (userResult.rows.length > 0) {
				const userId = userResult.rows[0].id;

				await client.query(
					`INSERT INTO refresh_tokens (user_id, token, expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '${token.days} days')`,
					[userId, token.token]
				);

				console.log(`Added refresh token for ${token.email}`);
			}
		}

		// Add a password reset token
		const resetUser = await client.query(
			`SELECT id FROM users WHERE email = $1`,
			["learner@example.com"]
		);

		if (resetUser.rows.length > 0) {
			await client.query(
				`INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
				[resetUser.rows[0].id, "reset-token-" + uuidv4().substring(0, 8)]
			);

			console.log("Added password reset token for learner@example.com");
		}

		// Add login attempts
		const loginAttempts = [
			{ email: "admin@example.com", ipAddress: "192.168.1.1", success: true },
			{
				email: "student1@techu.edu",
				ipAddress: "192.168.1.100",
				success: true,
			},
			{
				email: "unknown@example.com",
				ipAddress: "192.168.1.200",
				success: false,
			},
			{
				email: "unknown@example.com",
				ipAddress: "192.168.1.200",
				success: false,
			},
			{
				email: "learner@example.com",
				ipAddress: "192.168.1.150",
				success: false,
			},
			{
				email: "learner@example.com",
				ipAddress: "192.168.1.150",
				success: true,
			},
		];

		for (const attempt of loginAttempts) {
			await client.query(
				`INSERT INTO login_attempts (email, ip_address, success)
         VALUES ($1, $2, $3)`,
				[attempt.email, attempt.ipAddress, attempt.success]
			);
		}

		console.log(`Added ${loginAttempts.length} login attempt records`);

		await client.query("COMMIT");
		console.log("Database seeded successfully");
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Error seeding database:", error);
		throw error;
	} finally {
		client.release();
		await pool.end();
	}
}

// Helper function to create modules and content for a course
async function createModulesAndContent(client, courseId) {
	// Create modules
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
				content: JSON.stringify({
					text: "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.",
				}),
				position: 1,
			},
			{
				title: "Video Overview",
				contentType: "video",
				content: JSON.stringify({
					url: "https://example.com/videos/overview.mp4",
					duration: 720,
				}),
				position: 2,
			},
			{
				title: "Knowledge Check",
				contentType: "quiz",
				content: JSON.stringify({
					questions: [
						{
							text: "Which of the following is correct?",
							options: ["Option A", "Option B", "Option C", "Option D"],
							correctAnswer: 2,
						},
						{
							text: "What is the primary purpose of this module?",
							options: [
								"Entertainment",
								"Learning fundamentals",
								"Advanced concepts",
								"Project work",
							],
							correctAnswer: 1,
						},
					],
				}),
				position: 3,
			},
			{
				title: "Practical Exercise",
				contentType: "assignment",
				content: JSON.stringify({
					instructions:
						"Complete the following exercises and submit your work.",
					dueDate: null,
					points: 100,
				}),
				position: 4,
			},
		];

		for (const item of contentItems) {
			await client.query(
				`INSERT INTO content_items (module_id, title, content_type, content, position)
         VALUES ($1, $2, $3, $4, $5)`,
				[moduleId, item.title, item.contentType, item.content, item.position]
			);
			console.log(`Content item created: ${item.title}`);
		}
	}
}

// Run the seed function
seedDatabase()
	.then(() => {
		console.log("Seed completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exit(1);
	});
