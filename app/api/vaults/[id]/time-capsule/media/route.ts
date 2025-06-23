import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserServer, checkVaultAccess } from "@/lib/auth-helper"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: vaultId } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File
    const caption = formData.get("caption") as string
    const unlockAt = formData.get("unlockAt") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
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

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "video/mp4",
      "video/webm",
      "video/ogg",
    ]

    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 })
    }

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public/uploads")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `time-capsule-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filepath = join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    // Determine media type
    let mediaType: "IMAGE" | "AUDIO" | "VIDEO"
    if (file.type.startsWith("image/")) mediaType = "IMAGE"
    else if (file.type.startsWith("audio/")) mediaType = "AUDIO"
    else mediaType = "VIDEO"

    // Create locked media record
    const media = await prisma.media.create({
      data: {
        vaultId: vaultId,
        uploaderId: user.id,
        fileUrl: `/uploads/${filename}`,
        fileName: file.name,
        fileSize: file.size,
        type: mediaType,
        caption: caption || null,
        unlockAt: unlockDate,
        isLocked: true,
        approved: false, // Keep locked until unlock date
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

    return NextResponse.json({ success: true, media })
  } catch (error) {
    console.error("Error creating time capsule media:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
