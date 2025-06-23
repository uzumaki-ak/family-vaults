"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Upload, ImageIcon, Music, Video, Mic, Square, CalendarIcon, Lock, FileText } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TimeCapsuleUploadProps {
  vaultId: string
  onUploadComplete: () => void
}

type UploadType = "media" | "audio" | "notes"

export function TimeCapsuleUpload({ vaultId, onUploadComplete }: TimeCapsuleUploadProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadType, setUploadType] = useState<UploadType>("media")
  const [unlockDate, setUnlockDate] = useState<Date>()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState("")
  const [noteTitle, setNoteTitle] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      handleFileSelect(file)
    }
  }

  const handleFileSelect = (file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "video/mp4",
      "video/webm",
      "video/ogg",
    ]

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an image, audio, or video file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 50MB.",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    setRecordedBlob(null)
    setAudioUrl(null)

    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setRecordedBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setSelectedFile(null)
        setPreview(null)

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!unlockDate) {
      toast({
        title: "Unlock date required",
        description: "Please select when this time capsule should unlock.",
        variant: "destructive",
      })
      return
    }

    if (unlockDate <= new Date()) {
      toast({
        title: "Invalid unlock date",
        description: "Unlock date must be in the future.",
        variant: "destructive",
      })
      return
    }

    if (uploadType === "notes" && !noteContent.trim()) {
      toast({
        title: "Note content required",
        description: "Please enter some content for your note.",
        variant: "destructive",
      })
      return
    }

    if (uploadType !== "notes" && !selectedFile && !recordedBlob) {
      toast({
        title: "File required",
        description: "Please select a file or record audio.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (uploadType === "notes") {
        // Handle note time capsule
        const response = await fetch(`/api/vaults/${vaultId}/time-capsule/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: noteTitle.trim() || null,
            content: noteContent.trim(),
            unlockAt: unlockDate.toISOString(),
            caption: (event.currentTarget.elements.namedItem("caption") as HTMLTextAreaElement)?.value || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to create time capsule note")
        }
      } else {
        // Handle media time capsule
        const formData = new FormData(event.currentTarget)
        formData.append("unlockAt", unlockDate.toISOString())

        if (recordedBlob) {
          const recordedFile = new File([recordedBlob], `time-capsule-${Date.now()}.wav`, {
            type: "audio/wav",
          })
          formData.append("file", recordedFile)
        } else if (selectedFile) {
          formData.append("file", selectedFile)
        }

        const response = await fetch(`/api/vaults/${vaultId}/time-capsule/media`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to create time capsule")
        }
      }

      toast({
        title: "Time Capsule Created! 🔒",
        description: `Your memory will unlock on ${format(unlockDate, "PPP")}`,
      })

      setOpen(false)
      resetForm()
      onUploadComplete()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create time capsule",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setRecordedBlob(null)
    setPreview(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setNoteContent("")
    setNoteTitle("")
    setUnlockDate(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (file.type.startsWith("audio/")) return <Music className="h-4 w-4" />
    if (file.type.startsWith("video/")) return <Video className="h-4 w-4" />
    return <Upload className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Lock className="h-4 w-4 mr-2" />
          Lock Memory
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Create Time Capsule
          </DialogTitle>
          <DialogDescription>
            Lock a memory to be revealed in the future. Choose what to lock and when it should unlock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Type Selection */}
          <div className="space-y-3">
            <Label>What would you like to lock?</Label>
            <Tabs value={uploadType} onValueChange={(value) => setUploadType(value as UploadType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="media" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Media
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Audio
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="media" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select Media File</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {isDragging ? "Drop file here" : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-500">Images, Video (Max 50MB)</p>
                  </div>
                  <Input
                    id="file"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                {selectedFile && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {getFileIcon(selectedFile)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>

                    {preview && (
                      <div className="mt-2">
                        <img
                          src={preview || "/placeholder.svg"}
                          alt="Preview"
                          className="max-w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="audio" className="space-y-4">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    {isRecording ? (
                      <div className="w-8 h-8 bg-white rounded animate-pulse" />
                    ) : (
                      <Mic className="h-12 w-12 text-white" />
                    )}
                  </div>

                  {isRecording && (
                    <div className="text-lg font-mono text-red-600 mb-4">{formatTime(recordingTime)}</div>
                  )}

                  <div className="flex justify-center gap-2">
                    {!isRecording ? (
                      <Button type="button" onClick={startRecording} className="bg-red-500 hover:bg-red-600">
                        <Mic className="h-4 w-4 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button type="button" onClick={stopRecording} variant="outline">
                        <Square className="h-4 w-4 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                  </div>
                </div>

                {audioUrl && (
                  <div className="space-y-2">
                    <Label>Recorded Audio</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <audio src={audioUrl} controls className="w-full" />
                      <p className="text-xs text-gray-500 mt-1">Duration: {formatTime(recordingTime)}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="noteTitle">Title (Optional)</Label>
                  <Input
                    id="noteTitle"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Give your note a title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noteContent">Note Content</Label>
                  <Textarea
                    id="noteContent"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your note here... This will be locked until the unlock date."
                    rows={6}
                    className="resize-none"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Unlock Date Selection */}
          <div className="space-y-2">
            <Label>Unlock Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !unlockDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {unlockDate ? format(unlockDate, "PPP") : "Select unlock date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={unlockDate}
                  onSelect={setUnlockDate}
                  disabled={(date) => date <= new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {unlockDate && (
              <p className="text-xs text-gray-500">
                This memory will unlock in{" "}
                {Math.ceil((unlockDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (Optional)</Label>
            <Textarea
              id="caption"
              name="caption"
              placeholder="Add a message for when this memory unlocks..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !unlockDate ||
                (uploadType === "notes" ? !noteContent.trim() : !selectedFile && !recordedBlob)
              }
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isLoading ? "Creating Time Capsule..." : "🔒 Lock Memory"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
