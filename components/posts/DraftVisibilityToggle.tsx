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
    <fieldset className="space-y-3">
      <legend className="text-[12px] font-semibold text-text-secondary">
        Draft visibility
      </legend>
      <div className="flex flex-wrap gap-2">
        <button
          aria-pressed={value === "PRIVATE"}
          className={cn(
            "flex h-[34px] items-center gap-2 rounded-[5px] border px-4 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === "PRIVATE"
              ? "border-text-primary bg-text-primary text-background"
              : "border-border-default text-text-primary hover:bg-subtle-bg",
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
              ? "border-text-primary bg-text-primary text-background"
              : "border-border-default text-text-primary hover:bg-subtle-bg",
          )}
          onClick={() => onChange("CO_AUTHORS")}
          type="button"
        >
          <Users aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>Visible to co-authors</span>
        </button>
      </div>
      <p className="text-xs text-text-tertiary">
        {value === "PRIVATE"
          ? "Only you and admins can open this draft."
          : "Listed co-authors can open this draft while it remains unpublished."}
      </p>
    </fieldset>
  )
}
