import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ProfileForm } from "@/components/profile/ProfileForm"
import { getCachedProfileUser } from "@/lib/queries"
import { getCurrentSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Edit Profile",
  robots: { follow: false, index: false },
}

export default async function ProfilePage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const user = await getCachedProfileUser(session.user.id)

  if (!user) {
    redirect("/login")
  }

  return (
    <main className="container max-w-2xl py-8 sm:py-10">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Writer settings
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Edit profile</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Keep your public writer profile current for readers and co-authors.
        </p>
      </div>

      <ProfileForm user={user} />
    </main>
  )
}
