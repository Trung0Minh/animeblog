"use client"

import { useEffect, useState } from "react"

import { MobileNav } from "@/components/layout/MobileNav"
import {
  getSessionUser,
  WriterMenu,
  type WriterMenuUser,
} from "@/components/layout/WriterMenu"

interface WriterNavControlsProps {
  links: { href: string; label: string }[]
  user?: WriterMenuUser | null
}

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
]

function hasSessionCookie() {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .some((name) => SESSION_COOKIE_NAMES.includes(name))
}

export function WriterNavControls({ links, user }: WriterNavControlsProps) {
  const [loadedUser, setLoadedUser] = useState<WriterMenuUser | null>(null)

  useEffect(() => {
    if (user !== undefined) return
    if (!hasSessionCookie()) {
      setLoadedUser(null)
      return
    }

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

  return (
    <>
      <div className="hidden md:block" data-testid="desktop-writer-menu">
        <WriterMenu user={menuUser} />
      </div>
      <MobileNav links={links} user={menuUser} />
    </>
  )
}
