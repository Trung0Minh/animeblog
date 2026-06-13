import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/AdminNav"
import { getCurrentSession } from "@/lib/session"

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Admin",
}

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <main className="container max-w-6xl py-6 sm:py-8">
      <AdminNav />
      <div className="pt-6">{children}</div>
    </main>
  )
}
