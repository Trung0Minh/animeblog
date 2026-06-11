"use client"

import { useEffect } from "react"

export function useWarnUnsaved(hasUnsaved: boolean) {
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsaved) return

      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasUnsaved])
}
