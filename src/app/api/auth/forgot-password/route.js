
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import prisma from "../../../../lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const RESET_TOKEN_AGE = 15 * 60; // 15 minutes

export async function POST(request) {
  try {
    // 1. Read and validate the email
    const body = await request.json();
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // 2. Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // 3. Return the same message whether the account exists or not
    const responseMessage =
      "If an account exists with this email, a password reset link will be sent.";

    if (!user) {
      return NextResponse.json(
        { message: responseMessage },
        { status: 200 }
      );
    }

    // 4. Generate a cryptographically secure random token
    const resetToken = randomBytes(32).toString("hex");

    // 5. Hash the token before storing it
    const tokenHash = createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 6. Calculate the expiry time
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_AGE * 1000
    );

    // 7. Replace previous reset tokens and store the new one
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      }),
    ]);

    // 8. Build the reset link
   const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // 9. Development-only testing
   
const { error } = await resend.emails.send({
  from: process.env.EMAIL_FROM,
  to: user.email,
  subject: "Reset your password",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>Reset your password</h2>

      <p>We received a request to reset your password.</p>

      <p>Click the button below to choose a new password.</p>

      <a
        href="${resetLink}"
        style="
          display: inline-block;
          background-color: #16a34a;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
        "
      >
        Reset Password
      </a>

      <p>This link expires in 15 minutes.</p>

      <p>If you didn't request a password reset, you can ignore this email.</p>
    </div>
  `,
});

if (error) {
  console.error("Resend email error:", error);
 return NextResponse.json(
    { message: "Unable to send reset email. Please try again later." },
    { status: 500 }
  );
}
  return NextResponse.json(
  { message: responseMessage },
  { status: 200 }
);

 
} catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}