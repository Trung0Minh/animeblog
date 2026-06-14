import { Plus, Search } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { InviteWriterForm } from "@/components/admin/InviteWriterForm"
import { PendingInvitesTable } from "@/components/admin/PendingInvitesTable"
import { WritersTable } from "@/components/admin/WritersTable"
import { getCachedAdminWritersData } from "@/lib/queries"

export default async function AdminWritersPage() {
  const { pendingInvites, writers } = await getCachedAdminWritersData()

  return (
    <div className="animate-in fade-in duration-300">
      <AdminPageHeader
        action={
          <button className="flex h-[34px] w-full shrink-0 items-center justify-center gap-1.5 rounded-[5px] bg-button-bg px-3.5 text-[13px] font-semibold text-button-text transition-opacity hover:opacity-90 md:w-auto">
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Invite Writer
          </button>
        }
        subtitle="Manage your editorial team and permissions"
        title="Writers"
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative w-full md:w-[280px]">
          <Search
            aria-hidden="true"
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary"
          />
          <input
            className="h-[34px] w-full rounded-[5px] border border-border-default bg-transparent pl-8 pr-2.5 text-[13px] outline-none transition-colors placeholder:text-text-tertiary focus:border-accent"
            placeholder="Search writers by name or email..."
            type="text"
          />
        </div>
      </div>

      <section className="min-w-0">
        <WritersTable writers={writers} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-[8px] border border-border-default bg-background p-5">
          <h2 className="text-[15px] font-semibold text-text-primary">
            Invite a writer
          </h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            Send an invite link to create a writer account.
          </p>
          <div className="mt-4">
            <InviteWriterForm />
          </div>
        </section>

        <section className="rounded-[8px] border border-border-default bg-background p-5">
          <div className="mb-2">
            <h2 className="text-[15px] font-semibold text-text-primary">
              Pending invites
            </h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Open invites that have not expired.
            </p>
          </div>
          <PendingInvitesTable invites={pendingInvites} />
        </section>
      </div>
    </div>
  )
}
