"use client"

import { Lock, Users } from "lucide-react"

import { cn } from "@/lib/utils"

type DraftVisibility = "PRIVATE" | "CO_AUTHORS"

interface DraftVisibilityToggleProps {
  hasCoAuthors: boolean
  onChange: (value: DraftVisibility) => void
  value: DraftVisibility
}

export function DraftVisibilityToggle({
  hasCoAuthors,
  onChange,
  value,
}: DraftVisibilityToggleProps) {
  if (!hasCoAuthors) return null

  return (
    <fieldset className="mt-6 rounded-[8px] border p-4">
      <legend className="px-1 text-xs font-semibold text-muted-foreground">
        Draft visibility
      </legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          aria-pressed={value === "PRIVATE"}
          className={cn(
            "flex h-[34px] items-center gap-2 rounded-[5px] border px-4 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === "PRIVATE"
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:bg-muted",
          )}
          onClick={() => onChange("PRIVATE")}
          type="button"
        >
          <Lock aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>Private</span>
        </button>
        <button
          aria-pressed={value === "CO_AUTHORS"}
          className={cn(
            "flex h-[34px] items-center gap-2 rounded-[5px] border px-4 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === "CO_AUTHORS"
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:bg-muted",
          )}
          onClick={() => onChange("CO_AUTHORS")}
          type="button"
        >
          <Users aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>Visible to co-authors</span>
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {value === "PRIVATE"
          ? "Only you and admins can open this draft."
          : "Listed co-authors can open this draft while it remains unpublished."}
      </p>
    </fieldset>
  )
}
