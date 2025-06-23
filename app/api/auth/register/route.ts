import { type NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log("Register API called")

    const { name, email, password } = await request.json()
    console.log("Registration attempt for email:", email)

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Use a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already exists
      console.log("Checking if user exists...")
      const existingUser = await tx.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new Error("User already exists")
      }

      // Hash password
      console.log("Hashing password...")
      const hashedPassword = await hash(password, 12)

      // Create user
      console.log("Creating user...")
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })

      return user
    })

    console.log("User created successfully:", result.id)
    return NextResponse.json({ user: result })
  } catch (error) {
    console.error("Registration error:", error)

    // Handle specific errors
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string" &&
      (error as { message: string }).message === "User already exists"
    ) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Handle Prisma errors
    if (typeof error === "object" && error !== null && "code" in error && (error as any).code === "P2002") {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
