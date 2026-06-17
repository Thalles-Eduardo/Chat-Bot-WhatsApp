import { cookies, headers } from "next/headers";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt";
import { ACCESS_TOKEN_COOKIE, ROLE_HIERARCHY } from "./constants";

export interface AuthUser {
  userId: string;
  companyId: string;
  role: string;
  email: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const headerStore = await headers();
  const userId = headerStore.get("x-user-id");
  const companyId = headerStore.get("x-company-id");
  const role = headerStore.get("x-user-role");
  const email = headerStore.get("x-user-email");

  if (userId && companyId && role && email) {
    return { userId, companyId, role, email };
  }

  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(ACCESS_TOKEN_COOKIE);
  if (!tokenCookie) return null;

  try {
    const payload: AccessTokenPayload = await verifyAccessToken(
      tokenCookie.value
    );
    return {
      userId: payload.sub,
      companyId: payload.companyId,
      role: payload.role,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(minimumRole: string): Promise<AuthUser> {
  const user = await requireAuth();
  const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;

  if (userLevel < requiredLevel) {
    throw new Error("Forbidden");
  }

  return user;
}
