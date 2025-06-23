"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Settings, Upload, X, Copy, Link, Users } from "lucide-react"

const THEME_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

interface VaultSettingsDialogProps {
  vault: {
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
      }
    }>
  }
  currentUserId: string
  onUpdate: () => void
}

export function VaultSettingsDialog({ vault, currentUserId, onUpdate }: VaultSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedColor, setSelectedColor] = useState(vault.themeColor)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(vault.coverImage)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const isAdmin = vault.members.find((m) => m.user.id === currentUserId)?.role === "ADMIN"
  const inviteLink = `${window.location.origin}/join/${vault.inviteCode}`

  const handleCoverImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    setCoverImage(file)
    const reader = new FileReader()
    reader.onload = (e) => setCoverPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removeCoverImage = () => {
    setCoverImage(null)
    setCoverPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(vault.inviteCode)
    toast({
      title: "Invite code copied!",
      description: "Share this code with family members.",
    })
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    toast({
      title: "Invite link copied!",
      description: "Share this link with family members.",
    })
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/vaults/${vault.id}/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to update member role")
      }

      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      })

      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isAdmin) return

    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    // Upload cover image if changed
    let coverImageUrl = vault.coverImage
    if (coverImage) {
      const imageFormData = new FormData()
      imageFormData.append("file", coverImage)
      imageFormData.append("type", "cover")

      try {
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: imageFormData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          coverImageUrl = uploadData.url
        }
      } catch (error) {
        console.error("Error uploading cover image:", error)
      }
    }

    try {
      const response = await fetch(`/api/vaults/${vault.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          themeColor: selectedColor,
          coverImage: coverImageUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update vault")
      }

      toast({
        title: "Vault updated!",
        description: "Your vault settings have been saved.",
      })

      setOpen(false)
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vault",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vault Settings</DialogTitle>
          <DialogDescription>Manage your vault settings and members.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Invite Members</h3>

            <div className="space-y-2">
              <Label>Invite Code</Label>
              <div className="flex gap-2">
                <Input value={vault.inviteCode} readOnly />
                <Button type="button" variant="outline" onClick={copyInviteCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly />
                <Button type="button" variant="outline" onClick={copyInviteLink}>
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({vault.members.length})
            </h3>

            <div className="space-y-2">
              {vault.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{member.user.name || member.user.email}</p>
                    <p className="text-sm text-gray-600">{member.user.email}</p>
                  </div>
                  {isAdmin && member.user.id !== currentUserId ? (
                    <Select value={member.role} onValueChange={(value) => updateMemberRole(member.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="READ_ONLY">Read Only</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {member.role}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vault Settings (Admin Only) */}
          {isAdmin && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-medium">Vault Settings</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Vault Name</Label>
                <Input id="name" name="name" defaultValue={vault.name} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={vault.description || ""} rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                {coverPreview ? (
                  <div className="relative">
                    <img
                      src={coverPreview || "/placeholder.svg"}
                      alt="Cover preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeCoverImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload cover image</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label>Theme Color</Label>
                <div className="flex gap-2">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color ? "border-gray-900" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
