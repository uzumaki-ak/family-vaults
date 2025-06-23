import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserServer } from "@/lib/auth-helper"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: mediaId } = await params

    // Get current user from your auth system
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the locked media
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!media) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 })
    }

    if (media.uploaderId !== user.id) {
      return NextResponse.json({ error: "You can only unlock your own memories" }, { status: 403 })
    }

    if (!media.unlockAt || new Date() < media.unlockAt) {
      return NextResponse.json({ error: "Memory is not ready to unlock yet" }, { status: 400 })
    }

    if (!media.isLocked) {
      return NextResponse.json({ error: "Memory is already unlocked" }, { status: 400 })
    }

    // Unlock the media
    const unlockedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        isLocked: false,
        approved: true,
        unlockAt: null, // Clear unlock date
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, media: unlockedMedia })
  } catch (error) {
    console.error("Error unlocking media:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
