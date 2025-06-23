"use client"

import { AvatarFallback } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MediaGallery } from "@/components/media-gallery"
import { TimelineView } from "@/components/timeline-view"
import { MediaUpload } from "@/components/media-upload"
import { CreateNoteDialog } from "@/components/create-note-dialog"
import { SearchFilter } from "@/components/search-filter"
import { VaultSettingsDialog } from "@/components/vault-settings-dialog"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Share2, Grid3X3, Clock, Copy, Trash2, Music, FileText } from "lucide-react"

interface Vault {
  id: string
  name: string
  description?: string
  coverImage?: string
  themeColor: string
  inviteCode: string
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name?: string
      email: string
      avatar?: string
    }
  }>
  media: Array<{
    id: string
    fileUrl: string
    fileName: string
    type: "IMAGE" | "AUDIO" | "VIDEO"
    caption?: string
    aiCaption?: string
    approved: boolean
    deletedAt?: string
    createdAt: string
    uploader: {
      id: string
      name?: string
      email: string
    }
    votes: Array<{
      id: string
      value: boolean
      voter: {
        id: string
        name?: string
      }
    }>
    comments?: Array<{
      id: string
      content: string
      author: {
        id: string
        name?: string
      }
      createdAt: string
    }>
  }>
  notes: Array<{
    id: string
    title?: string
    content: string
    isPrivate: boolean
    createdAt: string
    author: {
      id: string
      name?: string
      email: string
    }
  }>
}

interface User {
  id: string
  email: string
  name?: string
}

export default function VaultPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [vault, setVault] = useState<Vault | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("gallery")
  const [viewMode, setViewMode] = useState<"active" | "trash">("active")
  const [filteredItems, setFilteredItems] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({})

  useEffect(() => {
    fetchVault()
    fetchUser()
  }, [params.id])

  useEffect(() => {
    if (vault) {
      applyFilters()
    }
  }, [vault, searchQuery, filters, viewMode, activeTab])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const fetchVault = async () => {
    try {
      const response = await fetch(`/api/vaults/${params.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch vault")
      }
      const data = await response.json()
      setVault(data.vault)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load vault",
        variant: "destructive",
      })
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (!vault) return

    let items: any[] = []

    // Filter based on active tab
    if (activeTab === "gallery") {
      // Show all media types
      items = vault.media
        .filter((media) => {
          if (viewMode === "trash") {
            return media.deletedAt
          } else {
            return !media.deletedAt && media.approved
          }
        })
        .map((media) => ({
          ...media,
          type: "media",
          author: media.uploader,
          mediaType: media.type,
          comments: media.comments || [],
        }))
    } else if (activeTab === "audio") {
      // Show only audio
      items = vault.media
        .filter((media) => {
          const isAudio = media.type === "AUDIO"
          if (viewMode === "trash") {
            return media.deletedAt && isAudio
          } else {
            return !media.deletedAt && media.approved && isAudio
          }
        })
        .map((media) => ({
          ...media,
          type: "media",
          author: media.uploader,
          mediaType: media.type,
          comments: media.comments || [],
        }))
    } else if (activeTab === "notes") {
      // Show only notes (only for active view)
      items =
        viewMode === "active"
          ? vault.notes
              .filter((note) => !note.isPrivate || note.author.id === user?.id)
              .map((note) => ({
                ...note,
                type: "note",
              }))
          : []
    } else if (activeTab === "timeline") {
      // Show all items for timeline
      const mediaItems = vault.media
        .filter((media) => {
          if (viewMode === "trash") {
            return media.deletedAt
          } else {
            return !media.deletedAt && media.approved
          }
        })
        .map((media) => ({
          ...media,
          type: "media",
          author: media.uploader,
          mediaType: media.type,
          comments: media.comments || [],
        }))

      const noteItems =
        viewMode === "active"
          ? vault.notes
              .filter((note) => !note.isPrivate || note.author.id === user?.id)
              .map((note) => ({
                ...note,
                type: "note",
              }))
          : []

      items = [...mediaItems, ...noteItems]
    }

    // Apply search filter
    if (searchQuery) {
      items = items.filter((item) => {
        const searchText = searchQuery.toLowerCase()
        if (item.type === "media") {
          return (
            item.caption?.toLowerCase().includes(searchText) ||
            item.aiCaption?.toLowerCase().includes(searchText) ||
            item.fileName?.toLowerCase().includes(searchText)
          )
        } else {
          return item.title?.toLowerCase().includes(searchText) || item.content?.toLowerCase().includes(searchText)
        }
      })
    }

    // Apply other filters
    const { type, uploader, dateFrom, dateTo } = filters as any

    if (type && type !== "ALL") {
      if (type === "NOTE") {
        items = items.filter((item) => item.type === "note")
      } else {
        items = items.filter((item) => item.type === "media" && item.mediaType === type)
      }
    }

    if (uploader && uploader !== "ALL") {
      items = items.filter((item) => item.author.id === uploader)
    }

    if (dateFrom) {
      items = items.filter((item) => new Date(item.createdAt) >= dateFrom)
    }

    if (dateTo) {
      items = items.filter((item) => new Date(item.createdAt) <= dateTo)
    }

    setFilteredItems(items)
  }

  const copyInviteCode = () => {
    if (vault) {
      navigator.clipboard.writeText(vault.inviteCode)
      toast({
        title: "Invite code copied!",
        description: "Share this code with family members to invite them.",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vault...</p>
        </div>
      </div>
    )
  }

  if (!vault || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Vault not found</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const userMember = vault.members.find((m) => m.user.id === user.id)
  const userRole = userMember?.role || "MEMBER"
  const canUpload = userRole !== "READ_ONLY"

  const timelineItems = filteredItems.map((item) => ({
    id: item.id,
    type: item.type,
    createdAt: item.createdAt,
    author: item.author,
    ...(item.type === "media" && {
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      mediaType: item.mediaType,
      caption: item.caption,
      aiCaption: item.aiCaption,
    }),
    ...(item.type === "note" && {
      title: item.title,
      content: item.content,
      isPrivate: item.isPrivate,
    }),
  }))

  const uploaders = vault.members.map((member) => ({
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="bg-white border-b"
        style={{
          background: vault.coverImage
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${vault.coverImage}) center/cover`
            : `linear-gradient(135deg, ${vault.themeColor}, ${vault.themeColor}80)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">{vault.name}</h1>
                {vault.description && <p className="text-white/80 text-sm">{vault.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {userRole}
              </Badge>
              <Button variant="ghost" size="sm" onClick={copyInviteCode} className="text-white hover:bg-white/20">
                <Share2 className="h-4 w-4 mr-2" />
                <Copy className="h-4 w-4" />
              </Button>
              {userRole === "ADMIN" && (
                <VaultSettingsDialog vault={vault} currentUserId={user.id} onUpdate={fetchVault} />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{vault.members.length} members</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("active")}
              >
                Active
              </Button>
              <Button
                variant={viewMode === "trash" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("trash")}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Trash
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            {canUpload && viewMode === "active" && (
              <>
                <CreateNoteDialog vaultId={vault.id} onNoteCreated={fetchVault} />
                <MediaUpload vaultId={vault.id} onUploadComplete={fetchVault} />
              </>
            )}
          </div>
        </div>

        <SearchFilter onSearch={setSearchQuery} onFilter={setFilters} uploaders={uploaders} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="mt-6">
            <MediaGallery
              media={filteredItems.filter((item) => item.type === "media")}
              currentUserId={user.id}
              userRole={userRole}
              totalMembers={vault.members.length}
              showDeleted={viewMode === "trash"}
              onMediaUpdate={fetchVault}
            />
          </TabsContent>

          <TabsContent value="audio" className="mt-6">
            <MediaGallery
              media={filteredItems.filter((item) => item.type === "media" && item.mediaType === "AUDIO")}
              currentUserId={user.id}
              userRole={userRole}
              totalMembers={vault.members.length}
              showDeleted={viewMode === "trash"}
              onMediaUpdate={fetchVault}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems
                .filter((item) => item.type === "note")
                .map((note) => (
                  <div key={note.id} className="bg-white p-4 rounded-lg border shadow-sm">
                    {note.title && <h3 className="font-medium mb-2">{note.title}</h3>}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">{note.content}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {note.author.name?.[0] || note.author.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">{note.author.name || note.author.email}</span>
                      </div>
                      {note.isPrivate && (
                        <Badge variant="secondary" className="text-xs">
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
            {filteredItems.filter((item) => item.type === "note").length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No notes yet.</p>
                <p className="text-sm text-gray-400 mt-1">Create your first note to get started!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <TimelineView items={timelineItems} currentUserId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
