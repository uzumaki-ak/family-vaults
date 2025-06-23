"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, ImageIcon, FileText } from "lucide-react"
import Link from "next/link"

interface VaultCardProps {
  vault: {
    id: string
    name: string
    description?: string
    coverImage?: string
    themeColor: string
    members: Array<{
      role: string
      user: {
        id: string
        name?: string
        email: string
        avatar?: string
      }
    }>
    _count: {
      media: number
      notes: number
    }
  }
  userRole: string
}

export function VaultCard({ vault, userRole }: VaultCardProps) {
  return (
    <Link href={`/vault/${vault.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <div
          className="h-32 bg-gradient-to-r rounded-t-lg"
          style={{
            background: vault.coverImage
              ? `url(${vault.coverImage}) center/cover`
              : `linear-gradient(135deg, ${vault.themeColor}, ${vault.themeColor}80)`,
          }}
        />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{vault.name}</CardTitle>
            <Badge variant={userRole === "ADMIN" ? "default" : "secondary"}>{userRole}</Badge>
          </div>
          {vault.description && <CardDescription className="line-clamp-2">{vault.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{vault.members.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                <span>{vault._count.media}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{vault._count.notes}</span>
              </div>
            </div>
            <div className="flex -space-x-2">
              {vault.members.slice(0, 3).map((member) => (
                <Avatar key={member.user.id} className="h-6 w-6 border-2 border-white">
                  <AvatarImage src={member.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {vault.members.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                  +{vault.members.length - 3}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
