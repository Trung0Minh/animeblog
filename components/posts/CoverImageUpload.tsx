"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"

interface CoverImageUploadProps {
  onChange: (url: string) => void
  value: string
}

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Failed to upload cover image"
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

export function CoverImageUpload({ onChange, value }: CoverImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setError("")
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "covers")

      const response = await fetch("/api/upload", {
        body: formData,
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      const url = getUploadUrl(result)

      if (!url) {
        throw new Error("Upload response did not include a URL")
      }

      onChange(url)
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload cover image",
      )
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold text-muted-foreground" htmlFor="cover-image">
          Cover image
        </label>
        {value && (
          <Button
            onClick={() => onChange("")}
            size="sm"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>

      {value && (
        <div className="aspect-video overflow-hidden rounded-[8px] border bg-muted">
          <img
            alt="Selected cover"
            className="h-full w-full object-cover"
            src={value}
          />
        </div>
      )}

      <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-input bg-muted p-4 text-center transition-colors hover:border-muted-foreground/60 hover:bg-border/30">
        <div>
          <p className="text-[13px] font-medium">Add cover image</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            JPG, PNG, GIF, WebP · Max 10MB
          </p>
        </div>
        <Button
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          type="button"
          size="sm"
          variant="outline"
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus aria-hidden="true" className="mr-2 h-4 w-4" />
          )}
          Upload
        </Button>
        <input
          accept="image/jpeg,image/png,image/gif,image/webp"
          aria-label="Upload cover image"
          className="sr-only"
          id="cover-image"
          onChange={(event) => {
            const file = event.target.files?.[0]

            if (file) {
              void handleFile(file)
            }
          }}
          ref={inputRef}
          type="file"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
