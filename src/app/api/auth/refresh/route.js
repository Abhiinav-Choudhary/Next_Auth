
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../../../lib/prisma";

const ACCESS_TOKEN_AGE = 15 * 60;
// const ACCESS_TOKEN_AGE = 10;
const REFRESH_TOKEN_AGE = 7 * 24 * 60 * 60;

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function clearAuthCookies(response) {
  response.cookies.set("accessToken", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refreshToken", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function POST(request) {
  try {
    // 1. Read refresh token from HTTP-only cookie
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return clearAuthCookies(
        NextResponse.json(
          { message: "Refresh token missing. Please log in again." },
          { status: 401 }
        )
      );
    }

    // 2. Verify refresh token
    let payload;

    try {
      payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
    } catch {
      return clearAuthCookies(
        NextResponse.json(
          { message: "Invalid or expired refresh token." },
          { status: 401 }
        )
      );
    }

    if (payload.type !== "refresh" || !payload.userId) {
      return clearAuthCookies(
        NextResponse.json(
          { message: "Invalid refresh token." },
          { status: 401 }
        )
      );
    }

    // 3. Hash the incoming refresh token
    const oldTokenHash = hashToken(refreshToken);

    // 4. Find the matching session
    const session = await prisma.session.findUnique({
      where: {
        refreshTokenHash: oldTokenHash,
      },
    });

    if (
      !session ||
      session.userId !== payload.userId ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      return clearAuthCookies(
        NextResponse.json(
          { message: "Session is invalid. Please log in again." },
          { status: 401 }
        )
      );
    }

    // 5. Generate new tokens
    const newAccessToken = jwt.sign(
      {
        userId: payload.userId,
        type: "access",
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_AGE }
    );

    const newRefreshToken = jwt.sign(
      {
        userId: payload.userId,
        type: "refresh",
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_AGE }
    );

    const newTokenHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_AGE * 1000
    );

    // 6. Atomically replace the old refresh token hash
    const result = await prisma.session.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: oldTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        refreshTokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      },
    });

    // If another request already rotated this token, reject it.
    if (result.count !== 1) {
      return clearAuthCookies(
        NextResponse.json(
          { message: "Refresh token already used. Please log in again." },
          { status: 401 }
        )
      );
    }

    // 7. Return response and set new cookies
    const response = NextResponse.json({
      success: true,
      message: "Tokens refreshed successfully.",
    });

    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_AGE,
    });

    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_AGE,
    });

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);

    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}