import prisma from "@/utils/connect";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

export const POST = async (req) => {
  try {
    const { name, email, password, image } = await req.json();

    if (!name || !email || !password) {
      return new NextResponse(
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ message: "User already exists" }),
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        image: image || "",
      },
    });

    return new NextResponse(
      JSON.stringify({
        message: "User created",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong", error: error.message }),
      { status: 500 }
    );
  }
};
