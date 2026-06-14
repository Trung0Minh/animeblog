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
      <div className="rounded-[8px] border border-dashed p-5 text-sm text-muted-foreground">
        No pending invites.
      </div>
    )
  }

  return (
    <div>
      {invites.map((invite) => (
        <article className="border-t border-border-default py-4 first:border-t-0" key={invite.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-text-primary">{invite.email}</p>
              <p className="mt-1 text-[11px] text-text-tertiary">
                Invited by {invite.createdBy.name} on {formatDate(invite.createdAt)}
              </p>
              <p className="mt-1 text-[11px] text-text-tertiary">
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
