import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mediaId, content } = await request.json()

    // Remove the existing comment check - allow multiple comments per user

    // Check if user has access to the media's vault
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
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

    const isMember = media.vault.members.some((member) => member.userId === user.id)
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create comment - allow multiple comments per user
    const comment = await prisma.comment.create({
      data: {
        mediaId,
        authorId: user.id,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
