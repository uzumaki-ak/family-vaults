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

    // Check if user is a member
    const member = await prisma.vaultMember.findFirst({
      where: {
        vaultId: id,
        userId: user.id,
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Not a member of this vault" }, { status: 404 })
    }

    // Prevent last admin from leaving
    if (member.role === "ADMIN") {
      const adminCount = await prisma.vaultMember.count({
        where: {
          vaultId: id,
          role: "ADMIN",
        },
      })

      if (adminCount === 1) {
        return NextResponse.json({ error: "Cannot leave vault as the last admin" }, { status: 400 })
      }
    }

    // Remove member
    await prisma.vaultMember.delete({
      where: { id: member.id },
    })

    // Log activity
    await prisma.vaultActivity.create({
      data: {
        vaultId: id,
        userId: user.id,
        action: "MEMBER_LEFT",
        details: `${user.name || user.email} left the vault`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error leaving vault:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
