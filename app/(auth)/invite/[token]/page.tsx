import { redirect } from "next/navigation"

import { InviteForm } from "@/components/auth/InviteForm"
import { prisma } from "@/lib/prisma"

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const invite = await prisma.invite.findUnique({
    where: { token },
    select: { email: true, status: true, expiresAt: true },
  })

  if (
    !invite ||
    invite.status !== "PENDING" ||
    invite.expiresAt <= new Date()
  ) {
    redirect("/login?error=invite-invalid")
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-sm rounded-[8px] border bg-background p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          You have been invited to write on Anime Blog.
        </p>
        <InviteForm email={invite.email} token={token} />
      </section>
    </main>
  )
}
