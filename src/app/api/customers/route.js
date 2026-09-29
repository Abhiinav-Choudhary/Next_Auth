
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { verifyAccessToken } from "../../../lib/auth";

// GET: Fetch all customers belonging to the logged-in user
export async function GET(request) {
  try {
    const payload = await verifyAccessToken(request);

    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const customers = await prisma.customer.findMany({
      where: {
        userId: payload.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    console.error("GET customers error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new customer
export async function POST(request) {
  try {
    const payload = await verifyAccessToken(request);

    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const address = body.address?.trim();

    if (!name || !email || !phone || !address) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (name.length > 100 || email.length > 254 ||
        phone.length > 20 || address.length > 500) {
      return NextResponse.json(
        { message: "One or more fields are too long" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        userId: payload.userId,
      },
    });

    return NextResponse.json(
      {
        message: "Customer created successfully",
        customer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST customer error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}