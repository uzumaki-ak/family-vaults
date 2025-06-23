import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vault = await prisma.vault.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        media: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            votes: {
              include: {
                voter: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
            tags: {
              include: {
                tag: true,
              },
            },
            mentions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        notes: {
          where: {
            deletedAt: null,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            tags: {
              include: {
                tag: true,
              },
            },
            mentions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        joinRequests: {
          where: {
            status: "PENDING",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            media: true,
            notes: true,
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
    console.error("Error fetching vault:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const member = await prisma.vaultMember.findFirst({
      where: {
        vaultId: id,
        userId: user.id,
        role: "ADMIN",
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, description, themeColor, coverImage } = await request.json()

    const vault = await prisma.vault.update({
      where: { id },
      data: {
        name,
        description,
        themeColor,
        coverImage,
      },
    })

    // Log activity
    await prisma.vaultActivity.create({
      data: {
        vaultId: id,
        userId: user.id,
        action: "VAULT_UPDATED",
        details: `Updated vault settings`,
      },
    })

    return NextResponse.json({ vault })
  } catch (error) {
    console.error("Error updating vault:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const member = await prisma.vaultMember.findFirst({
      where: {
        vaultId: id,
        userId: user.id,
        role: "ADMIN",
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete the vault (cascade will handle related data)
    await prisma.vault.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting vault:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
