import Link from "next/link"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { WriterNavControls } from "@/components/layout/WriterNavControls"
import type { WriterMenuUser } from "@/components/layout/WriterMenu"
import { SearchBar } from "@/components/search/SearchBar"

const NAV_LINKS = [
  { href: "/contributors", label: "Contributors" },
  { href: "/about", label: "About" },
]

export function Navbar({ user }: { user?: WriterMenuUser | null }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center gap-4">
        <Link
          className="shrink-0 text-base font-bold tracking-tight transition-colors hover:text-editorial"
          href="/"
        >
          {appName}
        </Link>

        <nav
          aria-label="Primary navigation"
          className="ml-auto hidden items-center gap-1 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href={link.href}
              key={link.href}
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden w-64 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />
          <WriterNavControls links={NAV_LINKS} user={user} />
        </div>
      </div>
    </header>
  )
}
