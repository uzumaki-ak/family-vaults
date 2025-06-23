import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params

    const vault = await prisma.vault.findFirst({
      where: { inviteCode: code },
      select: {
        id: true,
        name: true,
        description: true,
        coverImage: true,
        themeColor: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    })

    if (!vault) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 })
    }

    return NextResponse.json({ vault })
  } catch (error) {
    console.error("Error fetching vault info:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
