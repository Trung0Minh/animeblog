import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/session"

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Dashboard",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <>
      <div className="container max-w-4xl pt-6">
        <nav
          aria-label="Dashboard navigation"
          className="mb-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b pb-4 text-sm"
        >
          <Link
            className="whitespace-nowrap rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            href="/dashboard"
            prefetch={false}
          >
            My posts
          </Link>
          <Link
            className="whitespace-nowrap rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            href="/dashboard/profile"
            prefetch={false}
          >
            Edit profile
          </Link>
          <Link
            className="ml-auto whitespace-nowrap rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            href={`/authors/${session.user.username}`}
            target="_blank"
          >
            View public profile
          </Link>
        </nav>
      </div>
      {children}
    </>
  )
}
