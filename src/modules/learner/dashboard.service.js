import Enrollment from "../enrollments/enrollment.model";

class DashboardService {
	// Fetch all enrolled courses with progress
	static async getEnrolledCourses(userId) {
		try {
			const enrollments = await Enrollment.getUserEnrollments(
				userId,
				"enrolled",
			);
			return enrollments || [];
		} catch (error) {
			throw new Error("Failed to fetch enrolled courses: " + error.message);
		}
	}

	// Fetch upcoming tasks (assignments and quizzes with future due dates)
	static async getUpcomingTasks(userId) {
		try {
			return await Enrollment.getUpcomingTasks(userId);
		} catch (error) {
			throw new Error("Failed to fetch upcoming tasks: " + error.message);
		}
	}

	// Fetch recent activity (latest 10 progress records)
	static async getRecentActivity(userId) {
		try {
			return await Enrollment.getRecentActivity(userId);
		} catch (error) {
			throw new Error("Failed to fetch recent activity: " + error.message);
		}
	}

	// Fetch performance metrics (average score and total attempts)
	static async getPerformanceMetrics(userId) {
		try {
			return await Enrollment.getPerformanceMetrics(userId);
		} catch (error) {
			throw new Error("Failed to fetch performance metrics: " + error.message);
		}
	}

	// Get completion statistics
	static async getCompletionStats(userId) {
		try {
			return await Enrollment.getCompletionStats(userId);
		} catch (error) {
			throw new Error(
				"Failed to fetch completion statistics: " + error.message,
			);
		}
	}

	// Get time spent statistics
	static async getTimeSpentStats(userId) {
		try {
			return await Enrollment.getTimeSpentStats(userId);
		} catch (error) {
			throw new Error(
				"Failed to fetch time spent statistics: " + error.message,
			);
		}
	}

	// Aggregate all dashboard data
	static async getDashboardData(userId) {
		try {
			const [
				enrolledCourses,
				upcomingTasks,
				recentActivity,
				performanceMetrics,
				completionStats,
				timeSpentStats,
			] = await Promise.all([
				this.getEnrolledCourses(userId),
				this.getUpcomingTasks(userId),
				this.getRecentActivity(userId),
				this.getPerformanceMetrics(userId),
				this.getCompletionStats(userId),
				this.getTimeSpentStats(userId),
			]);

			// Calculate overall progress
			const overallProgress =
				enrolledCourses.length > 0
					? enrolledCourses.reduce(
							(sum, course) => sum + (course.progress || 0),
							0,
						) / enrolledCourses.length
					: 0;

			// Find courses that need attention (low progress or upcoming deadlines)
			const coursesNeedingAttention = enrolledCourses
				.filter((course) => course.progress < 0.3)
				.slice(0, 3);

			// Add upcoming deadlines info
			const upcomingDeadlines = upcomingTasks
				.filter((task) => {
					const dueDate = new Date(task.due_date);
					const now = new Date();
					const daysUntilDue = Math.ceil(
						(dueDate - now) / (1000 * 60 * 60 * 24),
					);
					return daysUntilDue <= 7; // Within a week
				})
				.slice(0, 5);

			return {
				enrolledCourses,
				overallProgress,
				upcomingTasks,
				upcomingDeadlines,
				recentActivity,
				performanceMetrics,
				completionStats,
				timeSpentStats,
				coursesNeedingAttention,
			};
		} catch (error) {
			throw new Error("Failed to aggregate dashboard data: " + error.message);
		}
	}

	// Get detailed analytics for a specific course enrollment
	static async getCourseEnrollmentAnalytics(userId, courseId) {
		try {
			return await Enrollment.getCourseEnrollmentAnalytics(userId, courseId);
		} catch (error) {
			throw new Error(
				`Failed to fetch course enrollment analytics: ${error.message}`,
			);
		}
	}
}

export default DashboardService;
