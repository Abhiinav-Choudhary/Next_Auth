
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { verifyAccessToken } from "../../../lib/auth";

export async function GET(request) {
  try {
    // 1. Verify access token
    const payload = verifyAccessToken(request);

    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Fetch users from PostgreSQL
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 3. Return users
    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Users API error:", error);

    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}