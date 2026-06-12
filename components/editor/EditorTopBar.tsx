"use client"

import Link from "next/link"

import { SaveStatusIndicator } from "@/components/editor/SaveStatusIndicator"
import { Button } from "@/components/ui/button"
import type { SaveStatus } from "@/hooks/useAutosave"

interface EditorTopBarProps {
  autosaveHint?: string
  canSave: boolean
  exitHref: string
  isPending: boolean
  isPublished: boolean
  onPublish: () => void
  onSaveDraft: () => void
  saveStatus: SaveStatus
}

export function EditorTopBar({
  autosaveHint = "Autosave starts after you edit title, excerpt, or body.",
  canSave,
  exitHref,
  isPending,
  isPublished,
  onPublish,
  onSaveDraft,
  saveStatus,
}: EditorTopBarProps) {
  const actionsDisabled = isPending || !canSave
  const statusText = canSave
    ? autosaveHint
    : "Add a title to enable saving and publishing."

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild size="sm" variant="ghost">
            <Link href={exitHref}>Exit</Link>
          </Button>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-medium">Writing mode</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            className="h-9"
            disabled={actionsDisabled}
            onClick={onSaveDraft}
            size="sm"
            type="button"
            variant="outline"
          >
            Save draft
          </Button>
          <Button
            className="h-9"
            disabled={actionsDisabled}
            onClick={onPublish}
            size="sm"
            type="button"
          >
            {isPublished ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="border-t px-4 py-2 text-xs text-muted-foreground sm:px-6 lg:px-8">
        {isPending ? (
          "Saving..."
        ) : saveStatus === "idle" ? (
          <span>{statusText}</span>
        ) : (
          <SaveStatusIndicator status={saveStatus} />
        )}
      </div>
    </header>
  )
}
