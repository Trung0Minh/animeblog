import { InviteWriterForm } from "@/components/admin/InviteWriterForm"
import { PendingInvitesTable } from "@/components/admin/PendingInvitesTable"
import { WritersTable } from "@/components/admin/WritersTable"
import { getCachedAdminWritersData } from "@/lib/queries"

export default async function AdminWritersPage() {
  const { pendingInvites, writers } = await getCachedAdminWritersData()

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="min-w-0 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Writers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage active writer access and preserve author attribution.
          </p>
        </div>
        <WritersTable writers={writers} />
      </section>

      <aside className="space-y-6">
        <section className="rounded-[8px] border bg-background p-4">
          <h2 className="font-semibold">Invite a writer</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Send an invite link to create a writer account.
          </p>
          <div className="mt-4">
            <InviteWriterForm />
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="font-semibold">Pending invites</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Open invites that have not expired.
            </p>
          </div>
          <PendingInvitesTable invites={pendingInvites} />
        </section>
      </aside>
    </div>
  )
}
