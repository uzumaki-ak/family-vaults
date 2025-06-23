import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { inviteCode } = await request.json()

    // Find vault by invite code
    const vault = await prisma.vault.findFirst({
      where: {
        OR: [{ id }, { inviteCode }],
      },
    })

    if (!vault) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.vaultMember.findFirst({
      where: {
        vaultId: vault.id,
        userId: user.id,
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 })
    }

    // Add user as member
    await prisma.vaultMember.create({
      data: {
        vaultId: vault.id,
        userId: user.id,
        role: "MEMBER",
      },
    })

    return NextResponse.json({ success: true, vaultId: vault.id })
  } catch (error) {
    console.error("Error joining vault:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
