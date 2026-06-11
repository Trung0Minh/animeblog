"use client"

import { useState } from "react"
import { FileText, LogOut, Menu, Search, User } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { WriterMenuUser } from "@/components/layout/WriterMenu"

interface MobileNavProps {
  links: { href: string; label: string }[]
  user?: WriterMenuUser | null
}

export function MobileNav({ links, user }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const menuUser = user ?? null

  function handleSignOut() {
    setOpen(false)
    void signOut({ callbackUrl: "/" })
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          aria-label="Open navigation menu"
          className="h-11 w-11 text-muted-foreground md:hidden"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-72 pt-14" side="right">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SheetDescription className="sr-only">
          Browse publication pages and search posts.
        </SheetDescription>
        <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted"
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)}
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 border-t pt-6">
          <Link
            aria-label="Search posts"
            className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            href="/search"
            onClick={() => setOpen(false)}
            prefetch={false}
          >
            <Search aria-hidden="true" className="h-4 w-4" />
            Search posts
          </Link>
        </div>

        {menuUser ? (
          <div className="mt-6 border-t pt-6">
            <div className="px-3 pb-3">
              <p className="truncate text-sm font-medium">{menuUser.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{menuUser.username}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Link
                className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                href="/dashboard"
                onClick={() => setOpen(false)}
                prefetch={false}
              >
                <FileText aria-hidden="true" className="h-4 w-4" />
                My posts
              </Link>
              <Link
                className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                prefetch={false}
              >
                <User aria-hidden="true" className="h-4 w-4" />
                Edit profile
              </Link>
              <Link
                className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                href={`/authors/${menuUser.username}`}
                onClick={() => setOpen(false)}
                prefetch={false}
              >
                <User aria-hidden="true" className="h-4 w-4" />
                View public profile
              </Link>
              <Button
                className="min-h-11 justify-start gap-2 px-3 text-muted-foreground"
                onClick={handleSignOut}
                type="button"
                variant="ghost"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
