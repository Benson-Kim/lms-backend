// utils/courseCache.js
import redisCache from "./redisCache.js";

// Cache key prefixes
const COURSE_CACHE_PREFIX = "course:";
const COURSE_MODULES_PREFIX = "course:modules:";
const USER_ACCESS_PREFIX = "access:";
const USER_ENROLLMENTS_PREFIX = "enrollments:user:";
const COURSE_ENROLLMENTS_PREFIX = "enrollments:course:";

// Course caching
export const cacheCourse = async (courseId, courseData) => {
	await redisCache.set(`${COURSE_CACHE_PREFIX}${courseId}`, courseData);
};

export const getCachedCourse = async (courseId) => {
	return await redisCache.get(`${COURSE_CACHE_PREFIX}${courseId}`);
};

export const cacheModules = async (courseId, modules) => {
	await redisCache.set(`${COURSE_MODULES_PREFIX}${courseId}`, modules);
};

export const getCachedModules = async (courseId) => {
	return await redisCache.get(`${COURSE_MODULES_PREFIX}${courseId}`);
};

export const invalidateCourseCache = async (courseId) => {
	await redisCache.del(`${COURSE_CACHE_PREFIX}${courseId}`);
	await redisCache.del(`${COURSE_MODULES_PREFIX}${courseId}`);
	await redisCache.del(`${COURSE_ENROLLMENTS_PREFIX}${courseId}`);

	// Clear all access caches related to this course
	const courseAccessKeys = await redisCache.keys(`*course:${courseId}*`);
	for (const key of courseAccessKeys) {
		await redisCache.del(key);
	}
};

// Access caching
export const cacheAccess = async (userId, courseId, hasAccess) => {
	await redisCache.set(
		`${USER_ACCESS_PREFIX}${userId}:course:${courseId}`,
		hasAccess
	);
};

export const getCachedAccess = async (userId, courseId) => {
	return await redisCache.get(
		`${USER_ACCESS_PREFIX}${userId}:course:${courseId}`
	);
};

// Enrollment caching
export const cacheUserEnrollments = async (userId, enrollments) => {
	await redisCache.set(`${USER_ENROLLMENTS_PREFIX}${userId}`, enrollments);
};

export const getCachedUserEnrollments = async (userId) => {
	return await redisCache.get(`${USER_ENROLLMENTS_PREFIX}${userId}`);
};

export const cacheCourseEnrollments = async (courseId, enrollments) => {
	await redisCache.set(`${COURSE_ENROLLMENTS_PREFIX}${courseId}`, enrollments);
};

export const getCachedCourseEnrollments = async (courseId) => {
	return await redisCache.get(`${COURSE_ENROLLMENTS_PREFIX}${courseId}`);
};

// Cache management
export const flushAllCaches = async () => {
	await redisCache.flushAll();
};

export default {
	// Course cache
	cacheCourse,
	getCachedCourse,
	cacheModules,
	getCachedModules,
	invalidateCourseCache,

	// Access cache
	cacheAccess,
	getCachedAccess,

	// Enrollment cache
	cacheUserEnrollments,
	getCachedUserEnrollments,
	cacheCourseEnrollments,
	getCachedCourseEnrollments,

	// Management
	flushAllCaches,
};
