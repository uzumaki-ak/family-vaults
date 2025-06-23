"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Lock, Clock, ImageIcon, Music, Video, FileText, Sparkles } from "lucide-react"
import { format, isPast } from "date-fns"
import confetti from "canvas-confetti"

interface LockedMemory {
  id: string
  type: "media" | "note"
  unlockAt: string
  caption?: string
  createdAt: string
  author: {
    id: string
    name?: string
    email: string
  }
  // Media specific
  fileName?: string
  fileUrl?: string
  mediaType?: "IMAGE" | "AUDIO" | "VIDEO"
  // Note specific
  title?: string
  content?: string
}

interface LockedMemoriesProps {
  memories: LockedMemory[]
  currentUserId: string
  onMemoryUnlock: () => void
}

export function LockedMemories({ memories, currentUserId, onMemoryUnlock }: LockedMemoriesProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedMemory, setSelectedMemory] = useState<LockedMemory | null>(null)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getTimeRemaining = (unlockDate: string) => {
    const unlock = new Date(unlockDate)
    const now = currentTime

    if (isPast(unlock)) {
      return { expired: true, text: "Ready to unlock!" }
    }

    const diff = unlock.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (days > 0) {
      return { expired: false, text: `${days}d ${hours}h ${minutes}m` }
    } else if (hours > 0) {
      return { expired: false, text: `${hours}h ${minutes}m ${seconds}s` }
    } else if (minutes > 0) {
      return { expired: false, text: `${minutes}m ${seconds}s` }
    } else {
      return { expired: false, text: `${seconds}s` }
    }
  }

  const getMemoryIcon = (memory: LockedMemory) => {
    if (memory.type === "note") {
      return <FileText className="h-5 w-5" />
    }

    switch (memory.mediaType) {
      case "IMAGE":
        return <ImageIcon className="h-5 w-5" />
      case "AUDIO":
        return <Music className="h-5 w-5" />
      case "VIDEO":
        return <Video className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const handleUnlockMemory = async (memory: LockedMemory) => {
    try {
      const endpoint =
        memory.type === "media"
          ? `/api/vaults/time-capsule/media/${memory.id}/unlock`
          : `/api/vaults/time-capsule/notes/${memory.id}/unlock`

      const response = await fetch(endpoint, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to unlock memory")
      }

      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"],
      })

      setSelectedMemory(memory)
      setShowUnlockDialog(true)
      onMemoryUnlock()
    } catch (error) {
      console.error("Error unlocking memory:", error)
      // You could show a toast notification here
    }
  }

  const renderMemoryPreview = (memory: LockedMemory) => {
    const timeRemaining = getTimeRemaining(memory.unlockAt)
    const canUnlock = timeRemaining.expired && memory.author.id === currentUserId

    return (
      <Card key={memory.id} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getMemoryIcon(memory)}
              <CardTitle className="text-sm">
                {memory.type === "note" ? memory.title || "Locked Note" : memory.fileName || "Locked Memory"}
              </CardTitle>
            </div>
            <Lock className="h-4 w-4 text-purple-500" />
          </div>
        </CardHeader>
        <CardContent className="relative space-y-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {memory.author.name?.[0] || memory.author.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500">{memory.author.name || memory.author.email}</span>
          </div>

          {memory.caption && <p className="text-sm text-gray-600 line-clamp-2">{memory.caption}</p>}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Unlocks {format(new Date(memory.unlockAt), "PPP")}</span>
            </div>

            <div className="text-center">
              <Badge
                variant={timeRemaining.expired ? "default" : "secondary"}
                className={
                  timeRemaining.expired
                    ? "bg-green-500 hover:bg-green-600 animate-pulse"
                    : "bg-purple-100 text-purple-700"
                }
              >
                {timeRemaining.text}
              </Badge>
            </div>

            {canUnlock && (
              <Button
                onClick={() => handleUnlockMemory(memory)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Unlock Memory
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{memories.map(renderMemoryPreview)}</div>

      {memories.length === 0 && (
        <div className="text-center py-12">
          <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No locked memories yet.</p>
          <p className="text-sm text-gray-400 mt-1">Create your first time capsule to get started!</p>
        </div>
      )}

      {/* Unlock Dialog */}
      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Memory Unlocked!
            </DialogTitle>
          </DialogHeader>

          {selectedMemory && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  {getMemoryIcon(selectedMemory)}
                </div>
                <h3 className="font-semibold">
                  {selectedMemory.type === "note" ? selectedMemory.title || "Your Note" : selectedMemory.fileName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Locked on {format(new Date(selectedMemory.createdAt), "PPP")}
                </p>
              </div>

              {selectedMemory.caption && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedMemory.caption}</p>
                </div>
              )}

              {selectedMemory.type === "note" && selectedMemory.content && (
                <div className="p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{selectedMemory.content}</p>
                </div>
              )}

              {selectedMemory.type === "media" && selectedMemory.fileUrl && (
                <div className="text-center">
                  {selectedMemory.mediaType === "IMAGE" && (
                    <img
                      src={selectedMemory.fileUrl || "/placeholder.svg"}
                      alt="Unlocked memory"
                      className="max-w-full h-48 object-cover rounded-lg mx-auto"
                    />
                  )}
                  {selectedMemory.mediaType === "AUDIO" && (
                    <audio src={selectedMemory.fileUrl} controls className="w-full" />
                  )}
                  {selectedMemory.mediaType === "VIDEO" && (
                    <video src={selectedMemory.fileUrl} controls className="max-w-full h-48 rounded-lg mx-auto" />
                  )}
                </div>
              )}

              <div className="text-center">
                <Button onClick={() => setShowUnlockDialog(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
