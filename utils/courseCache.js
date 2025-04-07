// import RedisCache from "./redisCache.js";

// const courseCache = new RedisCache();
// const enrollmentCache = new RedisCache();
// const accessCache = new RedisCache();

const cache = global.cache;

// Cache key prefixes
const COURSE_CACHE_PREFIX = "course:";
const COURSE_MODULES_PREFIX = "course:modules:";
const USER_ACCESS_PREFIX = "access:";
const USER_ENROLLMENTS_PREFIX = "enrollments:user:";
const COURSE_ENROLLMENTS_PREFIX = "enrollments:course:";

// Course caching
export const cacheCourse = async (courseId, courseData) => {
	await cache.set(`${COURSE_CACHE_PREFIX}${courseId}`, courseData);
};

export const getCachedCourse = async (courseId) => {
	return await cache.get(`${COURSE_CACHE_PREFIX}${courseId}`);
};

export const cacheModules = async (courseId, modules) => {
	await cache.set(`${COURSE_MODULES_PREFIX}${courseId}`, modules);
};

export const getCachedModules = async (courseId) => {
	return await cache.get(`${COURSE_MODULES_PREFIX}${courseId}`);
};

export const invalidateCourseCache = async (courseId) => {
	cache.del(`${COURSE_CACHE_PREFIX}${courseId}`);
	cache.del(`${COURSE_MODULES_PREFIX}${courseId}`);
	cache.del(`${COURSE_ENROLLMENTS_PREFIX}${courseId}`);

	// Clear all access caches related to this course
	const courseAccessKeys = accessCache
		.keys()
		.filter((key) => key.includes(`course:${courseId}`));
	courseAccessKeys.forEach((key) => cache.del(key));
};

// Access caching
export const cacheAccess = async (userId, courseId, hasAccess) => {
	await cache.set(
		`${USER_ACCESS_PREFIX}${userId}:course:${courseId}`,
		hasAccess
	);
};

export const getCachedAccess = async (userId, courseId) => {
	return await cache.get(`${USER_ACCESS_PREFIX}${userId}:course:${courseId}`);
};

// Enrollment caching
export const cacheUserEnrollments = async (userId, enrollments) => {
	await cache.set(`${USER_ENROLLMENTS_PREFIX}${userId}`, enrollments);
};

export const getCachedUserEnrollments = async (userId) => {
	return await cache.get(`${USER_ENROLLMENTS_PREFIX}${userId}`);
};

export const cacheCourseEnrollments = async (courseId, enrollments) => {
	await cache.set(`${COURSE_ENROLLMENTS_PREFIX}${courseId}`, enrollments);
};

export const getCachedCourseEnrollments = async (courseId) => {
	return await cache.get(`${COURSE_ENROLLMENTS_PREFIX}${courseId}`);
};

// Cache management
export const flushAllCaches = async () => {
	cache.flushAll();
	cache.flushAll();
	cache.flushAll();
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
