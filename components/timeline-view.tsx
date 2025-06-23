"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ImageIcon, Music, Video, FileText, Eye, Play, Download, X } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface TimelineItem {
  id: string
  type: "media" | "note"
  createdAt: string
  author: {
    id: string
    name?: string
    email: string
  }
  // Media specific
  fileUrl?: string
  fileName?: string
  mediaType?: "IMAGE" | "AUDIO" | "VIDEO"
  caption?: string
  aiCaption?: string
  // Note specific
  title?: string
  content?: string
  isPrivate?: boolean
}

interface TimelineViewProps {
  items: TimelineItem[]
  currentUserId: string
}

export function TimelineView({ items, currentUserId }: TimelineViewProps) {
  const [selectedMedia, setSelectedMedia] = useState<TimelineItem | null>(null)

  const openMediaViewer = (item: TimelineItem) => {
    setSelectedMedia(item)
  }

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const getAudioThumbnailColor = (fileName: string) => {
    const colors = [
      "from-purple-400 to-pink-400",
      "from-blue-400 to-cyan-400",
      "from-green-400 to-teal-400",
      "from-orange-400 to-red-400",
      "from-indigo-400 to-purple-400",
      "from-pink-400 to-rose-400",
    ]
    const hash = fileName?.split("").reduce((a, b) => a + b.charCodeAt(0), 0) || 0
    return colors[hash % colors.length]
  }

  const sortedItems = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const groupedItems = sortedItems.reduce(
    (groups, item) => {
      const date = format(new Date(item.createdAt), "yyyy-MM-dd")
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(item)
      return groups
    },
    {} as Record<string, TimelineItem[]>,
  )

  const renderMediaPreview = (item: TimelineItem) => {
    if (!item.fileUrl || !item.mediaType) return null

    switch (item.mediaType) {
      case "IMAGE":
        return (
          <div className="relative cursor-pointer group" onClick={() => openMediaViewer(item)}>
            <img
              src={item.fileUrl || "/placeholder.svg"}
              alt={item.caption || item.fileName}
              className="w-full h-32 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
              onError={(e) => {
                console.error("Timeline image failed to load:", item.fileUrl)
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <Eye className="h-4 w-4 text-gray-800" />
              </div>
            </div>
          </div>
        )
      case "AUDIO":
        const audioGradient = getAudioThumbnailColor(item.fileName || "")
        return (
          <div
            className={`w-full h-32 bg-gradient-to-br ${audioGradient} rounded-lg flex items-center justify-center cursor-pointer group hover:scale-105 transition-transform relative overflow-hidden`}
            onClick={() => openMediaViewer(item)}
          >
            {/* Audio waveform background */}
            <div className="absolute inset-0 opacity-20">
              <div className="flex items-end justify-center h-full gap-1 px-4">
                {[...Array(15)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-full animate-pulse"
                    style={{
                      width: "2px",
                      height: `${Math.random() * 40 + 10}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="text-center text-white relative z-10">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto group-hover:bg-white/30 transition-colors">
                <Play className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs text-white/90">Audio File</p>
            </div>
          </div>
        )
      case "VIDEO":
        return (
          <div className="relative cursor-pointer group" onClick={() => openMediaViewer(item)}>
            <video
              src={item.fileUrl}
              className="w-full h-32 object-cover rounded-lg"
              preload="metadata"
              onError={(e) => {
                console.error("Timeline video failed to load:", item.fileUrl)
              }}
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
              <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-5 w-5 text-gray-800 ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">VIDEO</div>
          </div>
        )
      default:
        return null
    }
  }

  const getItemIcon = (item: TimelineItem) => {
    if (item.type === "note") {
      return <FileText className="h-4 w-4" />
    }

    switch (item.mediaType) {
      case "IMAGE":
        return <ImageIcon className="h-4 w-4" />
      case "AUDIO":
        return <Music className="h-4 w-4" />
      case "VIDEO":
        return <Video className="h-4 w-4" />
      default:
        return <ImageIcon className="h-4 w-4" />
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No memories yet.</p>
        <p className="text-sm text-gray-400 mt-1">Start creating memories to see them in the timeline!</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedItems).map(([date, dayItems]) => (
        <div key={date} className="relative">
          <div className="sticky top-4 z-10 mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-white border rounded-full px-3 py-1 shadow-sm">
                <p className="text-sm font-medium">{format(new Date(date), "MMMM d, yyyy")}</p>
              </div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </div>

          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
            {dayItems.map((item, index) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-6 top-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full" />

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {item.author.name?.[0] || item.author.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{item.author.name || item.author.email}</p>
                          <div className="flex items-center gap-1 text-gray-500">
                            {getItemIcon(item)}
                            <span className="text-xs">{format(new Date(item.createdAt), "h:mm a")}</span>
                          </div>
                          {item.isPrivate && (
                            <Badge variant="secondary" className="text-xs">
                              Private
                            </Badge>
                          )}
                        </div>

                        {item.type === "note" ? (
                          <div>
                            {item.title && <h4 className="font-medium mb-1">{item.title}</h4>}
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
                          </div>
                        ) : (
                          <div>
                            {renderMediaPreview(item)}
                            {item.caption && <p className="text-sm text-gray-700 mt-2">{item.caption}</p>}
                            {item.aiCaption && !item.caption && (
                              <p className="text-sm text-gray-500 italic mt-2">AI: {item.aiCaption}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Media Viewer Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          {selectedMedia && selectedMedia.type === "media" && (
            <div className="flex flex-col h-full">
              <DialogHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {selectedMedia.author.name?.[0] || selectedMedia.author.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedMedia.author.name || selectedMedia.author.email}</p>
                      <p className="text-sm text-gray-500 font-normal">
                        {formatDistanceToNow(new Date(selectedMedia.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    {selectedMedia.fileUrl && selectedMedia.fileName && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(selectedMedia.fileUrl!, selectedMedia.fileName!)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedMedia(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 flex items-center justify-center bg-black p-4">
                {selectedMedia.mediaType === "IMAGE" && (
                  <img
                    src={selectedMedia.fileUrl || "/placeholder.svg"}
                    alt={selectedMedia.caption || selectedMedia.fileName}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
                {selectedMedia.mediaType === "VIDEO" && (
                  <video src={selectedMedia.fileUrl} controls className="max-w-full max-h-full" autoPlay />
                )}
                {selectedMedia.mediaType === "AUDIO" && (
                  <div className="text-center text-white">
                    <div
                      className={`w-24 h-24 bg-gradient-to-br ${getAudioThumbnailColor(selectedMedia.fileName || "")} rounded-full flex items-center justify-center mb-4 mx-auto`}
                    >
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-lg font-medium mb-4">{selectedMedia.fileName}</h3>
                    <audio src={selectedMedia.fileUrl} controls className="w-full max-w-md" autoPlay />
                  </div>
                )}
              </div>

              {(selectedMedia.caption || selectedMedia.aiCaption) && (
                <div className="p-4 border-t bg-white">
                  {selectedMedia.caption && <p className="text-gray-700">{selectedMedia.caption}</p>}
                  {selectedMedia.aiCaption && !selectedMedia.caption && (
                    <p className="text-gray-600 italic">AI: {selectedMedia.aiCaption}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
