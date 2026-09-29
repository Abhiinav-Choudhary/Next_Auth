
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(request) {
  try {
    // 1. Check whether the user is an admin
    const { user, error } = await requireAdmin(request);

    if (error) {
      return error;
    }

    // 2. Read the request body
    const body = await request.json();

    const {
      name,
      description,
      price,
      stock,
      category,
      imageUrl,
    } = body;

    // 3. Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return NextResponse.json(
        { message: "Invalid product data" },
        { status: 400 }
      );
    }

    if (
      imageUrl !== undefined &&
      imageUrl !== null &&
      typeof imageUrl !== "string"
    ) {
      return NextResponse.json(
        { message: "Invalid image URL" },
        { status: 400 }
      );
    }

    // 4. Create the product
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: String(price),
        stock,
        category: category.trim(),
        imageUrl: imageUrl?.trim() || null,
        createdById: user.id,
      },
    });

    // 5. Return the created product
    return NextResponse.json(
      {
        message: "Product created successfully",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}