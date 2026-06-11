"use client"

import { ImageIcon, Loader2 } from "lucide-react"
import { ChangeEvent, useRef, useState } from "react"

const ACCEPTED_TYPES = "image/jpeg,image/png,image/gif,image/webp"

interface MediaUploadProps {
  onInsert: (url: string, alt: string) => void
}

function getUploadError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Upload failed"
}

function getUploadUrl(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "url" in value.data &&
    typeof value.data.url === "string"
  ) {
    return value.data.url
  }

  return null
}

export function MediaUpload({ onInsert }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)

    try {
      const form = new FormData()
      form.append("file", file)
      form.append("folder", "content-images")

      const response = await fetch("/api/upload", { body: form, method: "POST" })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getUploadError(result))
      }

      const url = getUploadUrl(result)
      if (!url) {
        throw new Error("Upload failed")
      }

      const alt =
        window.prompt("Alt text for this image (leave blank to skip):") ?? ""
      onInsert(url, alt)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <button
        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        disabled={uploading}
        onMouseDown={(event) => {
          event.preventDefault()
          inputRef.current?.click()
        }}
        title="Insert image or GIF"
        type="button"
      >
        {uploading ? (
          <Loader2 aria-hidden="true" className="h-[15px] w-[15px] animate-spin" />
        ) : (
          <ImageIcon aria-hidden="true" className="h-[15px] w-[15px]" />
        )}
      </button>
      <input
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
    </>
  )
}
