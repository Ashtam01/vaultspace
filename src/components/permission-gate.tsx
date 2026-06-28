import { getUserWorkspacePermissions } from "@/permissions/casl"
import { AppAbility } from "@/permissions/casl"
import { ReactNode } from "react"

interface PermissionGateProps {
  workspaceId: string
  action: Parameters<AppAbility["can"]>[0]
  subject: Parameters<AppAbility["can"]>[1]
  children: ReactNode
  fallback?: ReactNode
}

export async function PermissionGate({
  workspaceId,
  action,
  subject,
  children,
  fallback = null,
}: PermissionGateProps) {
  const permissions = await getUserWorkspacePermissions(workspaceId)
  if (permissions.can(action as any, subject as any)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
