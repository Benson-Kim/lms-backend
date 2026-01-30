export const ErrorCodes = {
	NO_TOKEN: "NO_TOKEN",
	TOKEN_EXPIRED: "TOKEN_EXPIRED",
	TOKEN_INVALID: "TOKEN_INVALID",
	AUTH_ERROR: "AUTH_ERROR",
	PERMISSION_DENIED: "PERMISSION_DENIED",
	ENTITY_NOT_FOUND: "ENTITY_NOT_FOUND",
	MISSING_PARAM: "MISSING_PARAM",
	INTERNAL_ERROR: "INTERNAL_ERROR",
};

export const errorResponse = (res, status, message, code, details = null) => {
	const response = { error: message, code };
	if (details && process.env.NODE_ENV !== "production") {
		response.details = details;
	}
	return res.status(status).json(response);
};
