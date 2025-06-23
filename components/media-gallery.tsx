
"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  MoreHorizontal,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Play,
  MessageCircle,
  Send,
  Download,
  X,
  ArchiveRestoreIcon as Restore,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Image as ImageIcon,
  Music,
  Video,
  AlertCircle,
  Volume2,
  Pause,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface MediaItem {
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
      email: string
    }
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: string
    author: {
      id: string
      name?: string
      email: string
    }
  }>
}

interface MediaGalleryProps {
  media: MediaItem[]
  currentUserId: string
  userRole: string
  totalMembers: number
  showDeleted?: boolean
  onMediaUpdate: () => void
}

export function MediaGallery({
  media,
  currentUserId,
  userRole,
  totalMembers,
  showDeleted = false,
  onMediaUpdate,
}: MediaGalleryProps) {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isCommenting, setIsCommenting] = useState(false)
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({})
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({})
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({})
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
  const { toast } = useToast()

  // Ensure comments exist and log media data
  const safeMedia = media.map((item) => {
    console.log("Media item:", item.id, item.type, item.fileUrl)
    return {
      ...item,
      comments: item.comments || [],
    }
  })

  const selectedMedia = selectedMediaIndex !== null ? safeMedia[selectedMediaIndex] : null

  // Determine media type from file extension if type is not set properly
  const getActualMediaType = (item: MediaItem): "IMAGE" | "AUDIO" | "VIDEO" => {
    if (item.type && ["IMAGE", "AUDIO", "VIDEO"].includes(item.type)) {
      return item.type
    }

    const extension = item.fileName.toLowerCase().split('.').pop() || ''
    
    // Image extensions
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
      return "IMAGE"
    }
    
    // Video extensions
    if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
      return "VIDEO"
    }
    
    // Audio extensions
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'wma'].includes(extension)) {
      return "AUDIO"
    }

    // Fallback to original type or IMAGE
    return item.type || "IMAGE"
  }

  // Generate video thumbnail
  const generateVideoThumbnail = (videoElement: HTMLVideoElement, mediaId: string) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = videoElement.videoWidth || 640
    canvas.height = videoElement.videoHeight || 360
    
    try {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8)
      setVideoThumbnails(prev => ({ ...prev, [mediaId]: thumbnailUrl }))
    } catch (error) {
      console.error("Failed to generate video thumbnail:", error)
      setThumbnailErrors(prev => ({ ...prev, [mediaId]: true }))
    }
  }

  const handleVideoLoad = (mediaId: string) => {
    const videoElement = videoRefs.current[mediaId]
    if (videoElement && !videoThumbnails[mediaId] && !thumbnailErrors[mediaId]) {
      videoElement.currentTime = 1 // Seek to 1 second for better thumbnail
    }
  }

  const handleVideoSeeked = (mediaId: string) => {
    const videoElement = videoRefs.current[mediaId]
    if (videoElement && !thumbnailErrors[mediaId]) {
      generateVideoThumbnail(videoElement, mediaId)
    }
  }

  const handleMediaClick = (mediaIndex: number) => {
    console.log("Media clicked:", mediaIndex, safeMedia[mediaIndex])
    setSelectedMediaIndex(mediaIndex)
  }

  const handleMediaError = (mediaId: string) => {
    console.error("Media failed to load:", mediaId)
    setThumbnailErrors(prev => ({ ...prev, [mediaId]: true }))
  }

  const togglePlayPause = (mediaId: string, type: "audio" | "video") => {
    if (type === "audio") {
      const audioElement = audioRefs.current[mediaId]
      if (audioElement) {
        if (isPlaying[mediaId]) {
          audioElement.pause()
        } else {
          audioElement.play()
        }
        setIsPlaying(prev => ({ ...prev, [mediaId]: !prev[mediaId] }))
      }
    } else if (type === "video") {
      const videoElement = videoRefs.current[mediaId]
      if (videoElement) {
        if (isPlaying[mediaId]) {
          videoElement.pause()
        } else {
          videoElement.play()
        }
        setIsPlaying(prev => ({ ...prev, [mediaId]: !prev[mediaId] }))
      }
    }
  }

  const handleDelete = async (mediaId: string, mediaUploaderId: string) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete media")
      }

      if (data.voted) {
        toast({
          title: "Vote recorded",
          description: "Your vote for deletion has been recorded.",
        })
      } else if (data.deleted) {
        toast({
          title: "Media deleted",
          description: "The media has been moved to trash.",
        })
      }

      onMediaUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete media",
        variant: "destructive",
      })
    }
  }

  const handleRestore = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "restore" }),
      })

      if (!response.ok) {
        throw new Error("Failed to restore media")
      }

      toast({
        title: "Media restored",
        description: "The media has been restored from trash.",
      })

      onMediaUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore media",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "approve" }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve media")
      }

      toast({
        title: "Media approved",
        description: "The media is now visible to all members.",
      })

      onMediaUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve media",
        variant: "destructive",
      })
    }
  }

  const handleAddComment = async () => {
    if (!selectedMedia || !newComment.trim()) return

    setIsCommenting(true)

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaId: selectedMedia.id,
          content: newComment.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add comment")
      }

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      })

      setNewComment("")
      onMediaUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setIsCommenting(false)
    }
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

      toast({
        title: "Download started",
        description: "Your file is being downloaded.",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the file.",
        variant: "destructive",
      })
    }
  }

  const navigateMedia = (direction: "prev" | "next") => {
    if (selectedMediaIndex === null) return

    if (direction === "prev" && selectedMediaIndex > 0) {
      setSelectedMediaIndex(selectedMediaIndex - 1)
    } else if (direction === "next" && selectedMediaIndex < safeMedia.length - 1) {
      setSelectedMediaIndex(selectedMediaIndex + 1)
    }
  }

  const getAudioThumbnailColor = (fileName: string) => {
    const colors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-teal-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-pink-500 to-rose-500",
    ]
    const hash = fileName.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const renderMediaThumbnail = (item: MediaItem, index: number) => {
    const actualType = getActualMediaType(item)
    console.log("Rendering thumbnail for:", actualType, item.fileUrl)
    const hasError = thumbnailErrors[item.id]

    switch (actualType) {
      case "IMAGE":
        return (
          <div
            className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => handleMediaClick(index)}
          >
            {hasError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50">
                <ImageIcon className="h-12 w-12 mb-2" />
                <p className="text-sm font-medium">Image</p>
                <p className="text-xs opacity-75">Click to view</p>
              </div>
            ) : (
              <>
                <img
                  src={item.fileUrl}
                  alt={item.caption || item.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onLoad={() => console.log("Image loaded successfully:", item.fileUrl)}
                  onError={() => handleMediaError(item.id)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              </>
            )}
          </div>
        )
      
      case "AUDIO":
        const audioGradient = getAudioThumbnailColor(item.fileName)
        return (
          <div
            className={`w-full h-48 bg-gradient-to-br ${audioGradient} rounded-lg flex flex-col items-center justify-center cursor-pointer group hover:scale-105 transition-transform duration-200 relative overflow-hidden`}
            onClick={() => handleMediaClick(index)}
          >
            {/* Audio waveform background effect */}
            <div className="absolute inset-0 opacity-20">
              <div className="flex items-end justify-center h-full gap-1 px-8">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-full animate-pulse"
                    style={{
                      width: "3px",
                      height: `${Math.random() * 60 + 20}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="text-center text-white relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 mx-auto group-hover:bg-white/30 transition-colors">
                <Music className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm font-medium">Audio File</p>
              <p className="text-xs opacity-80 truncate max-w-32">{item.fileName}</p>
            </div>
          </div>
        )
      
      case "VIDEO":
        return (
          <div
            className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => handleMediaClick(index)}
          >
            {hasError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50">
                <Video className="h-12 w-12 mb-2" />
                <p className="text-sm font-medium">Video</p>
                <p className="text-xs opacity-75">Click to play</p>
              </div>
            ) : videoThumbnails[item.id] ? (
              <>
                <img
                  src={videoThumbnails[item.id]}
                  alt={item.caption || item.fileName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 text-gray-800 ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">VIDEO</div>
              </>
            ) : (
              <>
                <video
                  ref={(el) => {
                    if (el) videoRefs.current[item.id] = el
                  }}
                  src={item.fileUrl}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  onLoadedData={() => handleVideoLoad(item.id)}
                  onSeeked={() => handleVideoSeeked(item.id)}
                  onError={() => handleMediaError(item.id)}
                  style={{ display: videoThumbnails[item.id] ? 'none' : 'block' }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 text-gray-800 ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">VIDEO</div>
              </>
            )}
          </div>
        )
      
      default:
        return (
          <div 
            className="w-full h-48 bg-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
            onClick={() => handleMediaClick(index)}
          >
            <AlertCircle className="h-12 w-12 text-gray-500 mb-2" />
            <p className="text-gray-500 text-sm">Unknown format</p>
            <p className="text-gray-400 text-xs">Click to try viewing</p>
          </div>
        )
    }
  }

  const getVoteCount = (votes: MediaItem["votes"], value: boolean) => {
    return votes.filter((vote) => vote.value === value).length
  }

  const hasUserVoted = (votes: MediaItem["votes"]) => {
    return votes.some((vote) => vote.voter.id === currentUserId)
  }

  const getVoteStatus = (item: MediaItem) => {
    const upVotes = getVoteCount(item.votes, true)
    const downVotes = getVoteCount(item.votes, false)
    const totalVotes = upVotes + downVotes

    if (totalVotes === 0) return null

    const majorityNeeded = Math.ceil(totalMembers / 2)

    if (upVotes >= majorityNeeded) {
      return { status: "approved", message: "Deletion approved by majority" }
    } else if (downVotes >= majorityNeeded) {
      return { status: "rejected", message: "Deletion rejected by majority" }
    } else {
      return { status: "pending", message: `${upVotes}/${majorityNeeded} votes needed for deletion` }
    }
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{showDeleted ? "No deleted media." : "No media uploaded yet."}</p>
        <p className="text-sm text-gray-400 mt-1">
          {showDeleted ? "Deleted media will appear here." : "Be the first to share a memory!"}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {safeMedia.map((item, index) => {
          const voteStatus = getVoteStatus(item)
          const isOwner = item.uploader.id === currentUserId
          const isAdmin = userRole === "ADMIN"
          const userVoted = hasUserVoted(item.votes)

          return (
            <Card key={item.id} className={`overflow-hidden ${item.deletedAt ? "opacity-60" : ""}`}>
              <div className="relative">
                {renderMediaThumbnail(item, index)}

                {/* Status badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {!item.approved && !item.deletedAt && (
                    <Badge variant="secondary" className="text-xs">
                      Pending
                    </Badge>
                  )}
                  {item.deletedAt && (
                    <Badge variant="destructive" className="text-xs">
                      Deleted
                    </Badge>
                  )}
                  {voteStatus && (
                    <Badge variant={voteStatus.status === "approved" ? "destructive" : "secondary"} className="text-xs">
                      {voteStatus.status === "pending" ? "Voting" : voteStatus.status}
                    </Badge>
                  )}
                  {userVoted && !isOwner && !isAdmin && (
                    <Badge variant="default" className="text-xs bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Voted
                    </Badge>
                  )}
                </div>

                {/* Vote count display */}
                {item.votes.length > 0 && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{getVoteCount(item.votes, true)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3" />
                      <span>{getVoteCount(item.votes, false)}</span>
                    </div>
                  </div>
                )}

                {/* Actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="absolute top-2 right-2 bg-white/80 hover:bg-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {userRole === "ADMIN" && !item.approved && !item.deletedAt && (
                      <DropdownMenuItem onClick={() => handleApprove(item.id)}>
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Approve
                      </DropdownMenuItem>
                    )}
                    {item.deletedAt && (isAdmin || isOwner) && (
                      <DropdownMenuItem onClick={() => handleRestore(item.id)}>
                        <Restore className="h-4 w-4 mr-2" />
                        Restore
                      </DropdownMenuItem>
                    )}
                    {!item.deletedAt && (
                      <DropdownMenuItem onClick={() => handleDelete(item.id, item.uploader.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {userRole === "ADMIN" || item.uploader.id === currentUserId ? "Delete" : "Vote to Delete"}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDownload(item.fileUrl, item.fileName)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {item.uploader.name?.[0] || item.uploader.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.uploader.name || item.uploader.email}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {item.caption && <p className="text-sm text-gray-700 mb-2 line-clamp-2">{item.caption}</p>}
                {item.aiCaption && !item.caption && (
                  <p className="text-sm text-gray-500 italic mb-2 line-clamp-2">AI: {item.aiCaption}</p>
                )}

                {/* Comments indicator */}
                {item.comments.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <MessageCircle className="h-3 w-3" />
                    <span>
                      {item.comments.length} comment{item.comments.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Full Screen Media Viewer */}
      <Dialog open={selectedMediaIndex !== null} onOpenChange={() => setSelectedMediaIndex(null)}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-hidden p-0 bg-white">
          {selectedMedia && (
            <div className="flex flex-col h-[95vh]">
              {/* Header */}
              <DialogHeader className="p-4 pb-3 border-b bg-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {selectedMedia.uploader.name?.[0] || selectedMedia.uploader.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedMedia.uploader.name || selectedMedia.uploader.email}</p>
                      <p className="text-sm text-gray-500 font-normal">
                        {formatDistanceToNow(new Date(selectedMedia.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedMedia.fileUrl, selectedMedia.fileName)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedMediaIndex(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* Navigation arrows */}
              {selectedMediaIndex !== null && selectedMediaIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => navigateMedia("prev")}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {selectedMediaIndex !== null && selectedMediaIndex < safeMedia.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => navigateMedia("next")}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Media Display - Full Width */}
              <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
                {getActualMediaType(selectedMedia) === "IMAGE" && (
                  <div className="w-full h-full flex items-center justify-center">
                    {thumbnailErrors[selectedMedia.id] ? (
                      <div className="text-center text-white">
                        <ImageIcon className="h-24 w-24 mx-auto mb-4 opacity-50" />
                        <p className="text-xl mb-2">Image cannot be displayed</p>
                        <p className="text-sm opacity-75">The image file may be corrupted or unavailable</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => handleDownload(selectedMedia.fileUrl, selectedMedia.fileName)}
                        >
                          Try Download Instead
                        </Button>
                      </div>
                    ) : (
                      <img
                        src={selectedMedia.fileUrl}
                        alt={selectedMedia.caption || selectedMedia.fileName}
                        className="w-full h-full object-contain"
                        onError={() => handleMediaError(selectedMedia.id)}
                      />
                    )}
                  </div>
                )}
                
                {getActualMediaType(selectedMedia) === "VIDEO" && (
                  <div className="w-full h-full flex items-center justify-center">
                    {thumbnailErrors[selectedMedia.id] ? (
                      <div className="text-center text-white">
                        <Video className="h-24 w-24 mx-auto mb-4 opacity-50" />
                        <p className="text-xl mb-2">Video cannot be played</p>
                        <p className="text-sm opacity-75">The video format may not be supported or file unavailable</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => handleDownload(selectedMedia.fileUrl, selectedMedia.fileName)}
                        >
                          Try Download Instead
                        </Button>
                      </div>
                    ) : (
                      <video 
                        ref={(el) => {
                          if (el) videoRefs.current[selectedMedia.id] = el
                        }}
                        src={selectedMedia.fileUrl} 
                        controls 
                        className="w-full h-full object-contain" 
                        autoPlay
                        onError={() => handleMediaError(selectedMedia.id)}
                        onPlay={() => setIsPlaying(prev => ({ ...prev, [selectedMedia.id]: true }))}
                        onPause={() => setIsPlaying(prev => ({ ...prev, [selectedMedia.id]: false }))}
                      />
                    )}
                  </div>
                )}
                
                {getActualMediaType(selectedMedia) === "AUDIO" && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                    <div className="text-center text-white max-w-2xl w-full px-8">
                      <div
                        className={`w-48 h-48 bg-gradient-to-br ${getAudioThumbnailColor(selectedMedia.fileName)} rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl`}
                      >
                        <div className="relative">
                          <Music className="h-24 w-24 text-white" />
                          {isPlaying[selectedMedia.id] && (
                            <div className="absolute -inset-4">
                              <div className="w-full h-full border-4 border-white/30 rounded-full animate-ping"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-6">{selectedMedia.fileName}</h3>
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                        <audio 
                          ref={(el) => {
                            if (el) audioRefs.current[selectedMedia.id] = el
                          }}
                          src={selectedMedia.fileUrl} 
                          controls 
                          className="w-full h-12" 
                          autoPlay
                          onError={() => {
                            console.error("Audio failed to load:", selectedMedia.fileUrl)
                            handleMediaError(selectedMedia.id)
                          }}
                          onPlay={() => setIsPlaying(prev => ({ ...prev, [selectedMedia.id]: true }))}
                          onPause={() => setIsPlaying(prev => ({ ...prev, [selectedMedia.id]: false }))}
                        />
                        {thumbnailErrors[selectedMedia.id] && (
                          <div className="mt-4">
                            <p className="text-sm opacity-75 mb-4">Audio cannot be played in browser</p>
                            <Button 
                              variant="outline" 
                              onClick={() => handleDownload(selectedMedia.fileUrl, selectedMedia.fileName)}
                            >
                              Download Audio File
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Details & Comments - Below Media */}
              <div className="p-6 border-t bg-white max-h-80 overflow-y-auto flex-shrink-0">
                {/* Caption */}
                {selectedMedia.caption && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-lg">Caption</h4>
                    <p className="text-gray-700 text-base leading-relaxed">{selectedMedia.caption}</p>
                  </div>
                )}

                {/* AI Caption */}
                {selectedMedia.aiCaption && !selectedMedia.caption && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-lg">AI Generated Caption</h4>
                    <p className="text-gray-600 italic text-base leading-relaxed">{selectedMedia.aiCaption}</p>
                  </div>
                )}

                {/* Vote Status */}
                {selectedMedia.votes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Voting Status</h4>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        <span>{getVoteCount(selectedMedia.votes, true)} votes for deletion</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                        <span>{getVoteCount(selectedMedia.votes, false)} votes against</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.ceil(totalMembers / 2)} votes needed for deletion
                    </p>
                  </div>
                )}

                {/* Comments Section */}
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Comments ({selectedMedia.comments.length})</h4>

                  {/* Existing Comments */}
                  <div className="space-y-4 mb-4">
                    {selectedMedia.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {comment.author.name?.[0] || comment.author.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">{comment.author.name || comment.author.email}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {currentUserId[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button onClick={handleAddComment} disabled={!newComment.trim() || isCommenting} size="sm" className="self-start">
                        {isCommenting ? "..." : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
