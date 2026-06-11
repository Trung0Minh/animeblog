import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ProfileForm } from "@/components/profile/ProfileForm"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Edit Profile",
  robots: { follow: false, index: false },
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    select: {
      avatarUrl: true,
      bio: true,
      email: true,
      name: true,
      username: true,
    },
    where: { id: session.user.id },
  })

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
