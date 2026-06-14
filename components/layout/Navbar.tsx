import Link from "next/link"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { WriterNavControls } from "@/components/layout/WriterNavControls"
import type { WriterMenuUser } from "@/components/layout/WriterMenu"
import { SearchBar } from "@/components/search/SearchBar"

const NAV_LINKS = [
  { href: "/contributors", label: "Đóng góp" },
  { href: "/resources", label: "Nguồn tham khảo" },
  { href: "/about", label: "Giới thiệu" },
]

export function Navbar({ user }: { user?: WriterMenuUser | null }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-default/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-[52px] max-w-[1440px] items-center justify-between gap-4 px-4 md:h-[56px] md:px-6 lg:px-8">
        <Link
          className="shrink-0 text-[16px] font-bold tracking-tight transition-colors duration-150 hover:text-accent"
          href="/"
        >
          {appName}
        </Link>

        <nav
          aria-label="Primary navigation"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              className="text-[14px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden w-[280px] md:block">
            <SearchBar />
          </div>
          <ThemeToggle />
          <WriterNavControls links={NAV_LINKS} user={user} />
        </div>
      </div>
    </header>
  )
}
