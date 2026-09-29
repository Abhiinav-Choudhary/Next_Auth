
import { NextResponse } from "next/server";
import prisma from "./prisma";
import { verifyAccessToken } from "./auth";

export async function requireAdmin(request) {
  // 1. Verify the access token
  const payload = await verifyAccessToken(request);

  if (!payload) {
    return {
      user: null,
      error: NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  // 2. Fetch the user's latest role from the database
  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { message: "User not found" },
        { status: 401 }
      ),
    };
  }

  // 3. Check the role
  if (user.role !== "ADMIN") {
    return {
      user: null,
      error: NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  // 4. Authorized
  return {
    user,
    error: null,
  };
}