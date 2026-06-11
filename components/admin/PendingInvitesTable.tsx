import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface PendingInvite {
  createdAt: Date
  createdBy: { name: string }
  email: string
  expiresAt: Date
  id: string
}

export function PendingInvitesTable({ invites }: { invites: PendingInvite[] }) {
  if (invites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
        No pending invites.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {invites.map((invite) => (
        <article className="rounded-2xl border bg-card p-4" key={invite.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{invite.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Invited by {invite.createdBy.name} on {formatDate(invite.createdAt)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Expires {formatDate(invite.expiresAt)}
              </p>
            </div>
            <Badge variant="secondary">Pending</Badge>
          </div>
        </article>
      ))}
    </div>
  )
}
