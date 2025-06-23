"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Upload, ImageIcon, Music, Video, Mic, Square, X } from "lucide-react"

interface MediaUploadProps {
  vaultId: string
  onUploadComplete: () => void
}

export function MediaUpload({ vaultId, onUploadComplete }: MediaUploadProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioThumbnail, setAudioThumbnail] = useState<File | null>(null)
  const [audioThumbnailPreview, setAudioThumbnailPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioThumbnailInputRef = useRef<HTMLInputElement>(null)
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
      const fakeEvent = {
        target: { files: [file] },
      } as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(fakeEvent)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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

  const handleAudioThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file for the thumbnail.",
        variant: "destructive",
      })
      return
    }

    setAudioThumbnail(file)
    const reader = new FileReader()
    reader.onload = (e) => setAudioThumbnailPreview(e.target?.result as string)
    reader.readAsDataURL(file)
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
    if (!selectedFile && !recordedBlob) return

    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    if (recordedBlob) {
      const recordedFile = new File([recordedBlob], `recording-${Date.now()}.wav`, {
        type: "audio/wav",
      })
      formData.append("file", recordedFile)

      // Add audio thumbnail if provided
      if (audioThumbnail) {
        formData.append("audioThumbnail", audioThumbnail)
      }
    } else if (selectedFile) {
      formData.append("file", selectedFile)

      // Add audio thumbnail for audio files
      if (selectedFile.type.startsWith("audio/") && audioThumbnail) {
        formData.append("audioThumbnail", audioThumbnail)
      }
    }

    try {
      const response = await fetch(`/api/vaults/${vaultId}/media`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload media")
      }

      toast({
        title: "Media uploaded!",
        description: "Your media has been uploaded successfully.",
      })

      setOpen(false)
      resetForm()
      onUploadComplete()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload media",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (file.type.startsWith("audio/")) return <Music className="h-4 w-4" />
    if (file.type.startsWith("video/")) return <Video className="h-4 w-4" />
    return <Upload className="h-4 w-4" />
  }

  const resetForm = () => {
    setSelectedFile(null)
    setRecordedBlob(null)
    setPreview(null)
    setAudioUrl(null)
    setAudioThumbnail(null)
    setAudioThumbnailPreview(null)
    setRecordingTime(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (audioThumbnailInputRef.current) {
      audioThumbnailInputRef.current.value = ""
    }
  }

  const isAudioFile = selectedFile?.type.startsWith("audio/") || recordedBlob

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Media
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Upload images, audio, video files or record audio to share with your family.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="record">Record Audio</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
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
                  <p className="text-xs text-gray-500">Images, Audio, Video (Max 50MB)</p>
                </div>
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,audio/*,video/*"
                  onChange={handleFileSelect}
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

              {/* Audio Thumbnail Upload */}
              {isAudioFile && (
                <div className="space-y-2">
                  <Label htmlFor="audioThumbnail">Audio Thumbnail (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => audioThumbnailInputRef.current?.click()}
                      className="flex-1"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {audioThumbnail ? "Change Thumbnail" : "Add Thumbnail"}
                    </Button>
                    {audioThumbnail && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAudioThumbnail(null)
                          setAudioThumbnailPreview(null)
                          if (audioThumbnailInputRef.current) {
                            audioThumbnailInputRef.current.value = ""
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    id="audioThumbnail"
                    ref={audioThumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAudioThumbnailSelect}
                    className="hidden"
                  />
                  {audioThumbnailPreview && (
                    <div className="mt-2">
                      <img
                        src={audioThumbnailPreview || "/placeholder.svg"}
                        alt="Audio thumbnail preview"
                        className="max-w-full h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="caption">Caption (Optional)</Label>
                <Textarea id="caption" name="caption" placeholder="Add a caption to describe this memory..." rows={3} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || (!selectedFile && !recordedBlob)}>
                  {isLoading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="record">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
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

                    {(recordedBlob || selectedFile) && (
                      <Button type="button" onClick={resetForm} variant="outline">
                        Reset
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
              </div>

              {/* Audio Thumbnail for Recording */}
              {(recordedBlob || audioUrl) && (
                <div className="space-y-2">
                  <Label htmlFor="audioThumbnail">Audio Thumbnail (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => audioThumbnailInputRef.current?.click()}
                      className="flex-1"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {audioThumbnail ? "Change Thumbnail" : "Add Thumbnail"}
                    </Button>
                    {audioThumbnail && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAudioThumbnail(null)
                          setAudioThumbnailPreview(null)
                          if (audioThumbnailInputRef.current) {
                            audioThumbnailInputRef.current.value = ""
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    id="audioThumbnail"
                    ref={audioThumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAudioThumbnailSelect}
                    className="hidden"
                  />
                  {audioThumbnailPreview && (
                    <div className="mt-2">
                      <img
                        src={audioThumbnailPreview || "/placeholder.svg"}
                        alt="Audio thumbnail preview"
                        className="max-w-full h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="caption">Caption (Optional)</Label>
                <Textarea id="caption" name="caption" placeholder="Add a caption to describe this audio..." rows={3} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || (!selectedFile && !recordedBlob)}>
                  {isLoading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
