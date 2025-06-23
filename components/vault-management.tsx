"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Settings, UserMinus, UserCheck, UserX, Trash2, LogOut, Users, BarChart3, Moon, Sun } from "lucide-react"

interface VaultManagementProps {
  vault: any
  currentUser: any
  onUpdate: () => void
}

export function VaultManagement({ vault, currentUser, onUpdate }: VaultManagementProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(currentUser.darkMode || false)
  const { toast } = useToast()

  const isAdmin = vault.members.find((m: any) => m.user.id === currentUser.id)?.role === "ADMIN"

  const handleDeleteVault = async () => {
    if (!isAdmin) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/vaults/${vault.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete vault")
      }

      toast({
        title: "Vault deleted",
        description: "The vault has been permanently deleted.",
      })

      window.location.href = "/dashboard"
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vault",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveVault = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/vaults/${vault.id}/leave`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to leave vault")
      }

      toast({
        title: "Left vault",
        description: "You have left the vault successfully.",
      })

      window.location.href = "/dashboard"
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave vault",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isAdmin) return

    try {
      const response = await fetch(`/api/vaults/${vault.id}/members/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove member")
      }

      toast({
        title: "Member removed",
        description: `${memberName} has been removed from the vault.`,
      })

      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  const handleJoinRequest = async (requestId: string, action: "approve" | "reject") => {
    if (!isAdmin) return

    try {
      const response = await fetch(`/api/vaults/${vault.id}/join-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} join request`)
      }

      toast({
        title: `Join request ${action}d`,
        description: `The join request has been ${action}d.`,
      })

      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} join request`,
        variant: "destructive",
      })
    }
  }

  const toggleDarkMode = async () => {
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ darkMode: !darkMode }),
      })

      if (!response.ok) {
        throw new Error("Failed to update preferences")
      }

      setDarkMode(!darkMode)
      toast({
        title: "Preferences updated",
        description: `Dark mode ${!darkMode ? "enabled" : "disabled"}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
          <Settings className="h-4 w-4 mr-2" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vault Management</DialogTitle>
          <DialogDescription>Manage vault settings, members, and preferences.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vault Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Vault Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{vault._count?.media || 0}</div>
                <div className="text-sm text-blue-600">Total Media</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{vault.members?.length || 0}</div>
                <div className="text-sm text-green-600">Members</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{vault._count?.notes || 0}</div>
                <div className="text-sm text-purple-600">Notes</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {vault.members?.filter((m: any) => m.role === "ADMIN").length || 0}
                </div>
                <div className="text-sm text-orange-600">Admins</div>
              </div>
            </div>
          </div>

          {/* User Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">User Preferences</h3>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span>Dark Mode</span>
              </div>
              <Button variant="outline" size="sm" onClick={toggleDarkMode}>
                {darkMode ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>

          {/* Pending Join Requests (Admin Only) */}
          {isAdmin && vault.joinRequests?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pending Join Requests</h3>
              <div className="space-y-2">
                {vault.joinRequests
                  .filter((req: any) => req.status === "PENDING")
                  .map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {request.user.name?.[0] || request.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.user.name || request.user.email}</p>
                          {request.message && <p className="text-sm text-gray-600">{request.message}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleJoinRequest(request.id, "approve")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleJoinRequest(request.id, "reject")}>
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Members Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({vault.members?.length || 0})
            </h3>
            <div className="space-y-2">
              {vault.members?.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{member.user.name?.[0] || member.user.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.name || member.user.email}</p>
                      <p className="text-sm text-gray-600">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>{member.role}</Badge>
                    {isAdmin && member.user.id !== currentUser.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {member.user.name || member.user.email} from this vault?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveMember(member.id, member.user.name || member.user.email)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
            <div className="space-y-2">
              {!isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-red-600 border-red-200">
                      <LogOut className="h-4 w-4 mr-2" />
                      Leave Vault
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave Vault</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to leave this vault? You will lose access to all memories and will need to
                        be re-invited to join again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLeaveVault} className="bg-red-600 hover:bg-red-700">
                        Leave Vault
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-red-600 border-red-200">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Vault Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Vault</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to permanently delete this vault? This will delete all memories, notes,
                        and remove all members. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteVault}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading ? "Deleting..." : "Delete Permanently"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
