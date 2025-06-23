import { getCurrentUser as getAuthUser } from "@/lib/auth"

// Server-side auth helper for API routes
export async function getCurrentUserServer() {
  try {
    return await getAuthUser()
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Client-side auth helper
export async function getCurrentUserClient() {
  try {
    const response = await fetch("/api/auth/me")
    if (response.ok) {
      const data = await response.json()
      return data.user
    }
  } catch (error) {
    console.error("Error getting current user:", error)
  }
  return null
}

// Helper to check if user has access to vault
export async function checkVaultAccess(vaultId: string, userId: string) {
  try {
    const { prisma } = await import("@/lib/prisma")

    const member = await prisma.vaultMember.findUnique({
      where: {
        vaultId_userId: {
          vaultId,
          userId,
        },
      },
    })

    return !!member
  } catch (error) {
    console.error("Error checking vault access:", error)
    return false
  }
}
