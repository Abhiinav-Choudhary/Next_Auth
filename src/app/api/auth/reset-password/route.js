
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    // 1. Read request body
    const body = await request.json();
    const { token, newPassword } = body;

    // 2. Validate input
    if (
      typeof token !== "string" ||
      !token.trim() ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return NextResponse.json(
        {
          message:
            "A valid token and password of at least 8 characters are required.",
        },
        { status: 400 }
      );
    }

    // 3. Hash the token received from the email
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    // 4. Find the token in the database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    // 5. Check token validity
    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= new Date()
    ) {
      return NextResponse.json(
        { message: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    // 6. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 7. Update password and consume token atomically
    const success = await prisma.$transaction(async (tx) => {
      const result = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          usedAt: new Date(),
        },
      });

      // Another request may have already used the token
      if (result.count !== 1) {
        return false;
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      return true;
    });

    if (!success) {
      return NextResponse.json(
        { message: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    // 8. Success response
    return NextResponse.json(
      { message: "Password reset successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);

    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}