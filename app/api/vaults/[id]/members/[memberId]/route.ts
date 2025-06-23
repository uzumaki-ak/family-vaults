import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  try {
    const { id: vaultId, memberId } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminMember = await prisma.vaultMember.findFirst({
      where: {
        vaultId,
        userId: user.id,
        role: "ADMIN",
      },
    })

    if (!adminMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { role } = await request.json()

    // Update member role
    const updatedMember = await prisma.vaultMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Log activity
    await prisma.vaultActivity.create({
      data: {
        vaultId,
        userId: user.id,
        action: "MEMBER_ROLE_CHANGED",
        details: `Changed ${updatedMember.user.name || updatedMember.user.email}'s role to ${role}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating member role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  try {
    const { id: vaultId, memberId } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminMember = await prisma.vaultMember.findFirst({
      where: {
        vaultId,
        userId: user.id,
        role: "ADMIN",
      },
    })

    if (!adminMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get member details before deletion
    const memberToRemove = await prisma.vaultMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!memberToRemove) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Remove member
    await prisma.vaultMember.delete({
      where: { id: memberId },
    })

    // Log activity
    await prisma.vaultActivity.create({
      data: {
        vaultId,
        userId: user.id,
        action: "MEMBER_REMOVED",
        details: `Removed ${memberToRemove.user.name || memberToRemove.user.email} from the vault`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
