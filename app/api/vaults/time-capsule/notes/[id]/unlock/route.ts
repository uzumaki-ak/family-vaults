import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserServer } from "@/lib/auth-helper"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: noteId } = await params

    // Get current user from your auth system
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the locked note
    const note = await prisma.legacyNote.findUnique({
      where: { id: noteId },
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

    if (!note) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 })
    }

    if (note.authorId !== user.id) {
      return NextResponse.json({ error: "You can only unlock your own memories" }, { status: 403 })
    }

    if (!note.unlockAt || new Date() < note.unlockAt) {
      return NextResponse.json({ error: "Memory is not ready to unlock yet" }, { status: 400 })
    }

    if (!note.isLocked) {
      return NextResponse.json({ error: "Memory is already unlocked" }, { status: 400 })
    }

    // Unlock the note
    const unlockedNote = await prisma.legacyNote.update({
      where: { id: noteId },
      data: {
        isLocked: false,
        isPrivate: false,
        unlockAt: null, // Clear unlock date
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

    return NextResponse.json({ success: true, note: unlockedNote })
  } catch (error) {
    console.error("Error unlocking note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
