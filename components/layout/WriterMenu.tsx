"use client"

import { useEffect, useState } from "react"
import { ChevronDown, FileText, LogOut, User } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface WriterMenuUser {
  avatarUrl: string | null
  name: string
  username: string
}

function getSessionUser(value: unknown): WriterMenuUser | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "user" in value &&
    typeof value.user === "object" &&
    value.user !== null &&
    "name" in value.user &&
    "username" in value.user &&
    typeof value.user.name === "string" &&
    typeof value.user.username === "string"
  ) {
    return {
      avatarUrl:
        "avatarUrl" in value.user && typeof value.user.avatarUrl === "string"
          ? value.user.avatarUrl
          : null,
      name: value.user.name,
      username: value.user.username,
    }
  }

  return null
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  )
}

function WriterAvatar({
  className,
  user,
}: {
  className?: string
  user: WriterMenuUser
}) {
  if (user.avatarUrl) {
    return (
      <img
        alt={user.name}
        className={cn("rounded-full object-cover", className)}
        src={user.avatarUrl}
      />
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-muted text-xs font-semibold",
        className,
      )}
    >
      {getInitials(user.name)}
    </span>
  )
}

export function WriterMenu({ user }: { user?: WriterMenuUser | null }) {
  const [loadedUser, setLoadedUser] = useState<WriterMenuUser | null>(null)

  useEffect(() => {
    if (user !== undefined) return

    let isMounted = true

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session")
        if (!response.ok) return

        const result: unknown = await response.json()
        if (isMounted) {
          setLoadedUser(getSessionUser(result))
        }
      } catch {
        if (isMounted) {
          setLoadedUser(null)
        }
      }
    }

    void loadSession()

    return () => {
      isMounted = false
    }
  }, [user])

  const menuUser = user !== undefined ? user : loadedUser

  if (!menuUser) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open writer menu"
        className="inline-flex h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <WriterAvatar className="h-7 w-7" user={menuUser} />
        <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <WriterAvatar className="h-8 w-8" user={menuUser} />
          <span className="min-w-0">
            <span className="block truncate text-sm">{menuUser.name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              @{menuUser.username}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <FileText aria-hidden="true" />
            My posts
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">
            <User aria-hidden="true" />
            Edit profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/authors/${menuUser.username}`} prefetch={false}>
            <User aria-hidden="true" />
            View public profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-muted-foreground"
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
