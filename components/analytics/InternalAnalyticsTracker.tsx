"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { trackEvent } from "@/lib/analytics"

export function InternalAnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  useEffect(() => {
    if (pathname) {
      trackEvent("page_view")
    }
  }, [pathname, search])

  return null
}
