
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

// PATCH: Update customer details
export async function PATCH(request, { params }) {
  try {
    const payload = await verifyAccessToken(request);

    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Only allow these fields to be updated
    const allowedFields = ["name", "email", "phone", "address"];
    const data = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== "string") {
          return NextResponse.json(
            { message: `${field} must be a string` },
            { status: 400 }
          );
        }

        data[field] =
          field === "email"
            ? body[field].trim().toLowerCase()
            : body[field].trim();
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "At least one field is required" },
        { status: 400 }
      );
    }

    if (
      (data.name !== undefined && (!data.name || data.name.length > 100)) ||
      (data.email !== undefined &&
        (!data.email || data.email.length > 254)) ||
      (data.phone !== undefined &&
        (!data.phone || data.phone.length > 20)) ||
      (data.address !== undefined &&
        (!data.address || data.address.length > 500))
    ) {
      return NextResponse.json(
        { message: "Invalid or too-long field value" },
        { status: 400 }
      );
    }

    // Update only if this customer belongs to the logged-in user
    const result = await prisma.customer.updateMany({
      where: {
        id,
        userId: payload.userId,
      },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        userId: payload.userId,
      },
    });

    return NextResponse.json(
      {
        message: "Customer updated successfully",
        customer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH customer error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a customer
export async function DELETE(request, { params }) {
  try {
    const payload = await verifyAccessToken(request);

    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const result = await prisma.customer.deleteMany({
      where: {
        id,
        userId: payload.userId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Customer deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE customer error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}