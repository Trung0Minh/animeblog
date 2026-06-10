import { Search } from "lucide-react"
import Link from "next/link"

import { MobileNav } from "@/components/layout/MobileNav"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Button } from "@/components/ui/button"

const NAV_LINKS = [
  { href: "/contributors", label: "Contributors" },
  { href: "/about", label: "About" },
]

export function Navbar() {
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
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button
            asChild
            className="hidden h-11 w-11 text-muted-foreground md:inline-flex"
            size="icon"
            variant="ghost"
          >
            <Link aria-label="Search posts" href="/search">
              <Search aria-hidden="true" />
            </Link>
          </Button>
          <ThemeToggle />
          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  )
}
