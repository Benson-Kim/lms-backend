import NodeCache from "node-cache";

// Create cache with items expiring after 10 minutes
const userCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Cache keys
const USER_CACHE_PREFIX = "user:";
const ROLES_CACHE_PREFIX = "roles:";

export const cacheUser = (userId, userData) => {
	userCache.set(`${USER_CACHE_PREFIX}${userId}`, userData);
};

export const getCachedUser = (userId) => {
	return userCache.get(`${USER_CACHE_PREFIX}${userId}`);
};

export const cacheUserRoles = (userId, roles) => {
	userCache.set(`${ROLES_CACHE_PREFIX}${userId}`, roles);
};

export const getCachedUserRoles = (userId) => {
	return userCache.get(`${ROLES_CACHE_PREFIX}${userId}`);
};

export const invalidateUserCache = (userId) => {
	userCache.del(`${USER_CACHE_PREFIX}${userId}`);
	userCache.del(`${ROLES_CACHE_PREFIX}${userId}`);
};

export default {
	cacheUser,
	getCachedUser,
	cacheUserRoles,
	getCachedUserRoles,
	invalidateUserCache,
};
