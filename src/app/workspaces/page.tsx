import { getCurrentUser } from "@/lib/session"
import { getUserWorkspaces } from "@/dal/workspaces/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/actions/auth"

export default async function WorkspacesPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/")
  }

  const userWorkspaces = await getUserWorkspaces(user.id)

  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground mt-2">Select a workspace to continue</p>
        </div>
        <form action={logout}>
          <Button variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </form>
      </div>

      {userWorkspaces.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <h3 className="text-xl font-semibold mb-2">No workspaces found</h3>
          <p className="text-muted-foreground mb-4">You have not been invited to any workspaces yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userWorkspaces.map(({ workspace, role }) => (
            <Link key={workspace.id} href={`/${workspace.slug}/projects`}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{workspace.name}</CardTitle>
                    <Badge variant={role === "owner" || role === "admin" ? "default" : "secondary"}>
                      {role}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-1">{workspace.slug}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
