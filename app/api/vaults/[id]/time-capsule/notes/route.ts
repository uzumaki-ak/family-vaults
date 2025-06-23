import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserServer, checkVaultAccess } from "@/lib/auth-helper"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: vaultId } = await params
    const { title, content, unlockAt, caption } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 })
    }

    if (!unlockAt) {
      return NextResponse.json({ error: "Unlock date is required" }, { status: 400 })
    }

    // Get current user from your auth system
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has access to this vault
    const hasAccess = await checkVaultAccess(vaultId, user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this vault" }, { status: 403 })
    }

    // Validate unlock date is in the future
    const unlockDate = new Date(unlockAt)
    if (unlockDate <= new Date()) {
      return NextResponse.json({ error: "Unlock date must be in the future" }, { status: 400 })
    }

    // Create locked note record
    const note = await prisma.legacyNote.create({
      data: {
        vaultId: vaultId,
        authorId: user.id,
        title: title?.trim() || null,
        content: content.trim(),
        unlockAt: unlockDate,
        isLocked: true,
        isPrivate: true, // Keep private until unlock date
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

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error("Error creating time capsule note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
