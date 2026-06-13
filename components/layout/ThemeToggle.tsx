"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"

const emptySubscribe = () => () => undefined

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  if (!mounted) {
    return <div aria-hidden="true" className="h-8 w-8" />
  }

  const activeTheme = resolvedTheme ?? theme
  const isDark = activeTheme === "dark"

  return (
    <Button
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:h-[18px] [&_svg]:w-[18px]"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      size="icon"
      type="button"
      variant="ghost"
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  )
}
