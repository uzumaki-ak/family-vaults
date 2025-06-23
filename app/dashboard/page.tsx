import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { VaultCard } from "@/components/vault-card"
import { CreateVaultDialog } from "@/components/create-vault-dialog"
import { JoinVaultDialog } from "@/components/join-vault-dialog"
import { LogOut, Vault } from "lucide-react"

async function logout() {
  "use server"
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
  redirect("/")
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  const vaults = await prisma.vault.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: {
          media: true,
          notes: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Vault className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Legacy</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.name || user.email}</span>
              <form action={logout}>
                <Button variant="ghost" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Family Vaults</h2>
            <p className="text-gray-600 mt-1">Manage and access your family memory collections</p>
          </div>
          <div className="flex gap-2">
            <JoinVaultDialog />
            <CreateVaultDialog />
          </div>
        </div>

        {vaults.length === 0 ? (
          <div className="text-center py-12">
            <Vault className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vaults yet</h3>
            <p className="text-gray-600 mb-6">Create your first family vault or join an existing one to get started.</p>
            <div className="flex justify-center gap-2">
              <JoinVaultDialog />
              <CreateVaultDialog />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaults.map((vault) => {
              const userMember = vault.members.find((m) => m.userId === user.id)
              return <VaultCard key={vault.id} vault={vault} userRole={userMember?.role || "MEMBER"} />
            })}
          </div>
        )}
      </main>
    </div>
  )
}
