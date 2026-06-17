import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setTokenCookies,
  clearTokenCookies,
} from "@/lib/auth/jwt";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";

export async function POST() {
  const cookieStore = await cookies();
  const refreshCookie = cookieStore.get(REFRESH_TOKEN_COOKIE);

  if (!refreshCookie) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const payload = await verifyRefreshToken(refreshCookie.value);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      await clearTokenCookies();
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 401 }
      );
    }

    const accessToken = await signAccessToken({
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
    });
    const refreshToken = await signRefreshToken(user.id);

    await setTokenCookies(accessToken, refreshToken);

    return NextResponse.json({ success: true });
  } catch {
    await clearTokenCookies();
    return NextResponse.json(
      { error: "Invalid refresh token" },
      { status: 401 }
    );
  }
}
