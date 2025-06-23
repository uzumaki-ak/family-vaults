import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { uploadFileAdmin } from "@/lib/supabase-admin"
import { generateCaption } from "@/lib/gemini"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: vaultId } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a member and can upload
    const member = await prisma.vaultMember.findFirst({
      where: {
        vaultId,
        userId: user.id,
        role: {
          not: "READ_ONLY",
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const caption = formData.get("caption") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Determine media type
    let mediaType: "IMAGE" | "AUDIO" | "VIDEO"
    if (file.type.startsWith("image/")) {
      mediaType = "IMAGE"
    } else if (file.type.startsWith("audio/")) {
      mediaType = "AUDIO"
    } else if (file.type.startsWith("video/")) {
      mediaType = "VIDEO"
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    // Upload file to Supabase Storage using admin client
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `${vaultId}/${fileName}`
    const fileUrl = await uploadFileAdmin(file, filePath)

    // Generate AI caption
    let aiCaption = null
    try {
      aiCaption = await generateCaption(fileUrl, mediaType)
    } catch (error) {
      console.error("Error generating AI caption:", error)
    }

    // Create media record
    const media = await prisma.media.create({
      data: {
        vaultId,
        uploaderId: user.id,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        type: mediaType,
        caption,
        aiCaption,
        approved: member.role === "ADMIN", // Auto-approve for admins
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

    return NextResponse.json({ media })
  } catch (error) {
    console.error("Error uploading media:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
