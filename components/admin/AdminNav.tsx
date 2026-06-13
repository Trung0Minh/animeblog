"use client"

import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ADMIN_LINKS = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/posts", icon: FileText, label: "Posts" },
  { href: "/admin/writers", icon: Users, label: "Writers" },
  { href: "/admin/comments", icon: MessageSquare, label: "Comments" },
  { href: "/admin/newsletter", icon: Mail, label: "Newsletter" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
]

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Admin navigation"
      className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center"
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-editorial">
          Admin
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Moderate posts, writers, comments, and broadcasts.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto lg:ml-auto">
        {ADMIN_LINKS.map(({ href, icon: Icon, label }) => {
          const active = isActivePath(pathname, href)

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-1 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "border-editorial text-foreground",
              )}
              href={href}
              key={href}
              prefetch={false}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </div>

      <Button
        className="w-full shrink-0 lg:w-auto"
        onClick={() => void signOut({ callbackUrl: "/" })}
        size="sm"
        type="button"
        variant="ghost"
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
        Sign out
      </Button>
    </nav>
  )
}
