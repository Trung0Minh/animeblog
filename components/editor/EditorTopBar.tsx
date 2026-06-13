"use client"

import { ArrowLeft } from "lucide-react"
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
  titlePreview?: string
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
  titlePreview,
}: EditorTopBarProps) {
  const actionsDisabled = isPending || !canSave
  const statusText = canSave
    ? autosaveHint
    : "Add a title to enable saving and publishing."

  return (
    <header className="fixed left-0 right-0 top-0 z-[100] h-12 border-b bg-background px-5">
      <div className="flex h-full items-center justify-between gap-3">
        <Link
          className="group flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          href={exitHref}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          <span className="hidden text-[13px] font-medium md:inline">
            Dashboard
          </span>
        </Link>

        <div className="absolute left-1/2 flex h-full -translate-x-1/2 items-center">
          <div className="flex min-w-[70px] justify-end">
            {isPending ? (
              <span className="text-xs text-muted-foreground">Saving...</span>
            ) : saveStatus === "idle" ? (
              <span className="block max-w-[150px] truncate text-xs text-muted-foreground">
                {statusText}
              </span>
            ) : (
              <SaveStatusIndicator status={saveStatus} />
            )}
          </div>
          <div className="mx-3 hidden h-4 w-px bg-border md:block" />
          <div className="hidden max-w-[280px] truncate text-[13px] text-muted-foreground md:block">
            {titlePreview?.trim() || "Untitled post"}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            className="h-8 px-2 md:px-3.5"
            disabled={actionsDisabled}
            onClick={onSaveDraft}
            size="sm"
            type="button"
            variant="outline"
          >
            <span className="hidden md:inline">Save draft</span>
            <span className="md:hidden">Draft</span>
          </Button>
          <Button
            className="h-8 px-3.5 font-semibold"
            disabled={actionsDisabled}
            onClick={onPublish}
            size="sm"
            type="button"
          >
            {isPublished ? "Update" : "Publish"}
          </Button>
        </div>
      </div>
    </header>
  )
}
