import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const now = new Date()

    // Find expired media time capsules
    const expiredMedia = await prisma.media.findMany({
      where: {
        isLocked: true,
        unlockAt: {
          lte: now,
        },
      },
    })

    // Find expired note time capsules
    const expiredNotes = await prisma.legacyNote.findMany({
      where: {
        isLocked: true,
        unlockAt: {
          lte: now,
        },
      },
    })

    // Unlock expired media
    if (expiredMedia.length > 0) {
      await prisma.media.updateMany({
        where: {
          id: {
            in: expiredMedia.map((m) => m.id),
          },
        },
        data: {
          isLocked: false,
          approved: true,
          unlockAt: null,
        },
      })
    }

    // Unlock expired notes
    if (expiredNotes.length > 0) {
      await prisma.legacyNote.updateMany({
        where: {
          id: {
            in: expiredNotes.map((n) => n.id),
          },
        },
        data: {
          isLocked: false,
          isPrivate: false,
          unlockAt: null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      unlockedMedia: expiredMedia.length,
      unlockedNotes: expiredNotes.length,
    })
  } catch (error) {
    console.error("Error unlocking time capsules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
