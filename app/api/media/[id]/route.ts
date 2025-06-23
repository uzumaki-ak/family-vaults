import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        vault: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Check if user is admin or owner
    const userMember = media.vault.members.find((m) => m.userId === user.id)
    const isAdmin = userMember?.role === "ADMIN"
    const isOwner = media.uploaderId === user.id

    if (isAdmin || isOwner) {
      // Direct delete for admin or owner
      await prisma.media.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
      return NextResponse.json({ success: true, deleted: true })
    } else {
      // Voting system for other members
      const existingVote = await prisma.vote.findFirst({
        where: {
          mediaId: id,
          voterId: user.id,
        },
      })

      if (!existingVote) {
        await prisma.vote.create({
          data: {
            mediaId: id,
            voterId: user.id,
            value: true,
            reason: "Deletion request",
          },
        })
      }

      // Check if majority voted for deletion
      const totalMembers = media.vault.members.length
      const votesForDeletion = await prisma.vote.count({
        where: {
          mediaId: id,
          value: true,
        },
      })

      if (votesForDeletion > totalMembers / 2) {
        // Majority voted, proceed with soft delete
        await prisma.media.update({
          where: { id },
          data: { deletedAt: new Date() },
        })
        return NextResponse.json({ success: true, deleted: true })
      }

      return NextResponse.json({ success: true, voted: true })
    }
  } catch (error) {
    console.error("Error deleting media:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, caption } = await request.json()

    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        vault: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    const userMember = media.vault.members.find((m) => m.userId === user.id)
    const isAdmin = userMember?.role === "ADMIN"

    if (action === "approve" && isAdmin) {
      await prisma.media.update({
        where: { id },
        data: { approved: true },
      })
      return NextResponse.json({ success: true })
    }

    if (action === "restore" && (isAdmin || media.uploaderId === user.id)) {
      await prisma.media.update({
        where: { id },
        data: { deletedAt: null },
      })
      return NextResponse.json({ success: true })
    }

    if (action === "updateCaption" && (isAdmin || media.uploaderId === user.id)) {
      await prisma.media.update({
        where: { id },
        data: { caption },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  } catch (error) {
    console.error("Error updating media:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
