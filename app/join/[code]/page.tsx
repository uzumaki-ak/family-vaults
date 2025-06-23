"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Vault, Users, Loader2 } from "lucide-react"

export default function JoinVaultPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [vault, setVault] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const inviteCode = params.code as string

  useEffect(() => {
    fetchVaultInfo()
  }, [inviteCode])

  const fetchVaultInfo = async () => {
    try {
      const response = await fetch(`/api/vaults/info/${inviteCode}`)
      if (response.ok) {
        const data = await response.json()
        setVault(data.vault)
      } else {
        setError("Invalid or expired invite link")
      }
    } catch (error) {
      setError("Failed to load vault information")
    }
  }

  const handleJoin = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/vaults/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join vault")
      }

      toast({
        title: "Joined vault!",
        description: "You have successfully joined the family vault.",
      })

      router.push(`/vault/${data.vaultId}`)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join vault",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Vault className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle className="text-red-600">Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!vault) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className="h-32 bg-gradient-to-r rounded-t-lg -mx-6 -mt-6 mb-4"
            style={{
              background: vault.coverImage
                ? `url(${vault.coverImage}) center/cover`
                : `linear-gradient(135deg, ${vault.themeColor}, ${vault.themeColor}80)`,
            }}
          />
          <CardTitle className="text-2xl">{vault.name}</CardTitle>
          <CardDescription>{vault.description || "Join this family vault to share memories"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{vault._count.members} members</span>
          </div>

          <Button onClick={handleJoin} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Vault"
            )}
          </Button>

          <Button variant="outline" onClick={() => router.push("/")} className="w-full">
            Back to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
