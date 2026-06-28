import { Badge } from "@/components/ui/badge"
import { DocumentSensitivity } from "@/drizzle/schema"
import { ShieldAlert, Shield, ShieldCheck, FileText } from "lucide-react"

export function SensitivityBadge({ sensitivity }: { sensitivity: DocumentSensitivity }) {
  switch (sensitivity) {
    case "restricted":
      return (
        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
          <ShieldAlert className="size-3" />
          Restricted
        </Badge>
      )
    case "confidential":
      return (
        <Badge variant="secondary" className="flex items-center gap-1 w-fit border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400">
          <Shield className="size-3" />
          Confidential
        </Badge>
      )
    case "internal":
      return (
        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
          <ShieldCheck className="size-3" />
          Internal
        </Badge>
      )
    case "public":
    default:
      return (
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          <FileText className="size-3" />
          Public
        </Badge>
      )
  }
}
