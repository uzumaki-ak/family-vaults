// Cleanup script to permanently delete media that has been in trash for more than 24 hours
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function cleanupDeletedMedia() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  try {
    // Find media that was deleted more than 24 hours ago
    const mediaToDelete = await prisma.media.findMany({
      where: {
        deletedAt: {
          lte: twentyFourHoursAgo,
        },
      },
    })

    console.log(`Found ${mediaToDelete.length} media items to permanently delete`)

    // Delete the media records
    const result = await prisma.media.deleteMany({
      where: {
        deletedAt: {
          lte: twentyFourHoursAgo,
        },
      },
    })

    console.log(`Permanently deleted ${result.count} media items`)

    // Note: In a real application, you would also want to delete the actual files
    // from Supabase Storage here using the deleteFile function from lib/supabase.ts
  } catch (error) {
    console.error("Error cleaning up deleted media:", error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDeletedMedia()
