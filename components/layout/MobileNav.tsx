"use client"

import { Menu, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface MobileNavProps {
  links: { href: string; label: string }[]
}

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false)

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
          >
            <Search aria-hidden="true" className="h-4 w-4" />
            Search posts
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
