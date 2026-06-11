"use client"

import { useEffect } from "react"

import { trackEvent } from "@/lib/analytics"

interface SearchPageTrackerProps {
  query: string
}

export function SearchPageTracker({ query }: SearchPageTrackerProps) {
  useEffect(() => {
    const trimmedQuery = query.trim()

    if (trimmedQuery) {
      trackEvent("search", { query: trimmedQuery })
    }
  }, [query])

  return null
}
