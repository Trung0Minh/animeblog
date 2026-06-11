"use client"

import { useEffect } from "react"

import { trackEvent } from "@/lib/analytics"

interface PostReadTrackerProps {
  slug: string
  title: string
}

export function PostReadTracker({ slug, title }: PostReadTrackerProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      trackEvent("post_read", { slug, title })
    }, 30_000)

    return () => window.clearTimeout(timer)
  }, [slug, title])

  return null
}
