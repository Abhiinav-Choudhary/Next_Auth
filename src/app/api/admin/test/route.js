
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/requireAdmin";

export async function GET(request) {
  const { user, error } = await requireAdmin(request);

  if (error) {
    return error;
  }

  return NextResponse.json({
    message: "Welcome to the admin area!",
    admin: user,
  });
}