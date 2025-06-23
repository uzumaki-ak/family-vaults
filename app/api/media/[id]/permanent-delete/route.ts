import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { deleteFile } from "@/lib/supabase"

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

    // Check if user is admin
    const userMember = media.vault.members.find((m) => m.userId === user.id)
    const isAdmin = userMember?.role === "ADMIN"

    if (!isAdmin) {
      return NextResponse.json({ error: "Only admins can permanently delete media" }, { status: 403 })
    }

    // Only allow permanent deletion if media is already in trash
    if (!media.deletedAt) {
      return NextResponse.json({ error: "Media must be in trash before permanent deletion" }, { status: 400 })
    }

    // Delete file from storage
    try {
      const urlParts = media.fileUrl.split("/")
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `${media.vaultId}/${fileName}`
      await deleteFile(filePath)
    } catch (error) {
      console.error("Error deleting file from storage:", error)
      // Continue with database deletion even if file deletion fails
    }

    // Permanently delete from database
    await prisma.media.delete({
      where: { id },
    })

    // Log activity
    await prisma.vaultActivity.create({
      data: {
        vaultId: media.vaultId,
        userId: user.id,
        action: "MEDIA_DELETED",
        details: `Permanently deleted media: ${media.fileName}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error permanently deleting media:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
