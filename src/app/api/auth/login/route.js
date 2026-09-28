import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../../../lib/prisma";

const ACCESS_TOKEN_AGE = 15 * 60; // 15 minutes
// const ACCESS_TOKEN_AGE = 10;
const REFRESH_TOKEN_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // 1. Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 2. Find user in database
    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 4. Generate access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: "access",
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: ACCESS_TOKEN_AGE,
      }
    );

    // 5. Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: "refresh",
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: REFRESH_TOKEN_AGE,
      }
    );

    // 6. Hash refresh token before storing it
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // 7. Create session in database
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_AGE * 1000
        ),
      },
    });

    // 8. Create response
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );

    // 9. Set access token cookie
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_AGE,
    });

    // 10. Set refresh token cookie
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_AGE,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}