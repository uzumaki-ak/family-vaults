"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Activity,
  Upload,
  Trash2,
  MessageCircle,
  UserPlus,
  UserMinus,
  FileText,
  Vote,
  Settings,
  RefreshCw,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityFeedProps {
  vaultId: string
}

interface ActivityItem {
  id: string
  action: string
  details: string
  createdAt: string
  user: {
    id: string
    name?: string
    email: string
  }
  metadata?: any
}

export function ActivityFeed({ vaultId }: ActivityFeedProps) {
  const [open, setOpen] = useState(false)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/vaults/${vaultId}/activities`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchActivities()
    }
  }, [open, vaultId])

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "MEDIA_UPLOADED":
        return <Upload className="h-4 w-4 text-blue-600" />
      case "MEDIA_DELETED":
        return <Trash2 className="h-4 w-4 text-red-600" />
      case "COMMENT_ADDED":
        return <MessageCircle className="h-4 w-4 text-green-600" />
      case "MEMBER_JOINED":
        return <UserPlus className="h-4 w-4 text-purple-600" />
      case "MEMBER_LEFT":
        return <UserMinus className="h-4 w-4 text-orange-600" />
      case "NOTE_CREATED":
        return <FileText className="h-4 w-4 text-indigo-600" />
      case "VOTE_CAST":
        return <Vote className="h-4 w-4 text-yellow-600" />
      case "VAULT_UPDATED":
        return <Settings className="h-4 w-4 text-gray-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case "MEDIA_UPLOADED":
        return "bg-blue-50 border-blue-200"
      case "MEDIA_DELETED":
        return "bg-red-50 border-red-200"
      case "COMMENT_ADDED":
        return "bg-green-50 border-green-200"
      case "MEMBER_JOINED":
        return "bg-purple-50 border-purple-200"
      case "MEMBER_LEFT":
        return "bg-orange-50 border-orange-200"
      case "NOTE_CREATED":
        return "bg-indigo-50 border-indigo-200"
      case "VOTE_CAST":
        return "bg-yellow-50 border-yellow-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
          <Activity className="h-4 w-4 mr-2" />
          Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Vault Activity Feed
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={fetchActivities} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No activities yet.</p>
              <p className="text-sm text-gray-400">Vault activities will appear here.</p>
            </div>
          ) : (
            activities.map((activity) => (
              <Card key={activity.id} className={`border ${getActivityColor(activity.action)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.action)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {activity.user.name?.[0] || activity.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{activity.user.name || activity.user.email}</span>
                        <Badge variant="secondary" className="text-xs">
                          {activity.action.replace("_", " ").toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{activity.details}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
