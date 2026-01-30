import DashboardService from "../../services/learners/dashboardService";

class DashboardController {
	// Get all dashboard data for a user
	async getDashboardData(req, res) {
		try {
			const userId = req.user.id; // Assuming user ID is available from authentication middleware
			const dashboardData = await DashboardService.getDashboardData(userId);

			return res.status(200).json({
				success: true,
				data: dashboardData,
			});
		} catch (error) {
			console.error("Dashboard data fetch error:", error);
			return res.status(500).json({
				success: false,
				message: error.message || "Failed to fetch dashboard data",
			});
		}
	}

	// Get enrolled courses for a user
	async getEnrolledCourses(req, res) {
		try {
			const userId = req.user.id;
			const enrolledCourses = await DashboardService.getEnrolledCourses(userId);

			return res.status(200).json({
				success: true,
				data: enrolledCourses,
			});
		} catch (error) {
			console.error("Enrolled courses fetch error:", error);
			return res.status(500).json({
				success: false,
				message: error.message || "Failed to fetch enrolled courses",
			});
		}
	}

	// Get upcoming tasks for a user
	async getUpcomingTasks(req, res) {
		try {
			const userId = req.user.id;
			const upcomingTasks = await DashboardService.getUpcomingTasks(userId);

			return res.status(200).json({
				success: true,
				data: upcomingTasks,
			});
		} catch (error) {
			console.error("Upcoming tasks fetch error:", error);
			return res.status(500).json({
				success: false,
				message: error.message || "Failed to fetch upcoming tasks",
			});
		}
	}

	// Get recent activity for a user
	async getRecentActivity(req, res) {
		try {
			const userId = req.user.id;
			const recentActivity = await DashboardService.getRecentActivity(userId);

			return res.status(200).json({
				success: true,
				data: recentActivity,
			});
		} catch (error) {
			console.error("Recent activity fetch error:", error);
			return res.status(500).json({
				success: false,
				message: error.message || "Failed to fetch recent activity",
			});
		}
	}

	// Get performance metrics for a user
	async getPerformanceMetrics(req, res) {
		try {
			const userId = req.user.id;
			const performanceMetrics = await DashboardService.getPerformanceMetrics(
				userId
			);

			return res.status(200).json({
				success: true,
				data: performanceMetrics,
			});
		} catch (error) {
			console.error("Performance metrics fetch error:", error);
			return res.status(500).json({
				success: false,
				message: error.message || "Failed to fetch performance metrics",
			});
		}
	}

	// Get completion stats for a user
	async getCompletionStats(req, res) {
		try {
			const userId = req.user.id;
			const completionStats = await DashboardService.getCompletionStats(userId);

			return res.status(200).json({
				success: true,
				data: completionStats,
			});
		} catch (error) {
			console.error("Completion stats fetch error:", error);
			return res.status(500).json({
				success: false,
				message: error.message || "Failed to fetch completion statistics",
			});
		}
	}

	// Get time spent stats for a user
	async getTimeSpentStats(req, res) {
		try {
			const userId = req.user.id;
			const timeSpentStats = await DashboardService.getTimeSpentStats(userId);

			return res.status(200).json({
				success: true,
				data: timeSpentStats,
			});
		} catch (error) {
			console.error("Time spent stats fetch error:", error);
			return res.status(500).json({
				success: false,
				message: error.message || "Failed to fetch time spent statistics",
			});
		}
	}

	// Get analytics for a specific course enrollment
	async getCourseEnrollmentAnalytics(req, res) {
		try {
			const userId = req.user.id;
			const { courseId } = req.params;

			if (!courseId) {
				return res.status(400).json({
					success: false,
					message: "Course ID is required",
				});
			}

			const courseAnalytics =
				await DashboardService.getCourseEnrollmentAnalytics(userId, courseId);

			return res.status(200).json({
				success: true,
				data: courseAnalytics,
			});
		} catch (error) {
			console.error("Course enrollment analytics fetch error:", error);
			return res.status(500).json({
				success: false,
				message: error.message || "Failed to fetch course enrollment analytics",
			});
		}
	}
}

export default new DashboardController();
