
import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function POST(request) {
  try {
    // 1. Read refresh token from cookie
    const refreshToken = request.cookies.get("refreshToken")?.value;

    // 2. Revoke the session in the database
    if (refreshToken) {
      const refreshTokenHash = hashToken(refreshToken);

      await prisma.session.updateMany({
        where: {
          refreshTokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    // 3. Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    // 4. Clear both authentication cookies
    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    };

    response.cookies.set("accessToken", "", cookieOptions);
    response.cookies.set("refreshToken", "", cookieOptions);

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}