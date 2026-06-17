export const ACCESS_TOKEN_COOKIE = "token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export const ACCESS_TOKEN_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY = "7d";

export const ACCESS_TOKEN_MAX_AGE = 15 * 60;
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export const ROLE_HIERARCHY: Record<string, number> = {
  OPERATOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

export const PUBLIC_ROUTES = ["/", "/login", "/register"];
export const AUTH_API_PREFIX = "/api/auth";
