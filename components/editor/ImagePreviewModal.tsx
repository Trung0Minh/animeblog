"use client"

import { AlignLeft, GripVertical, LayoutGrid, X } from "lucide-react"
import { useState } from "react"

import type { GalleryImage } from "@/components/editor/gallery"

export interface UploadedImage extends GalleryImage {
  file: File
  id: string
}

interface ImagePreviewModalProps {
  images: UploadedImage[]
  onClose: () => void
  onConfirm: (images: UploadedImage[], mode: "individual" | "gallery") => void
}

function moveItem<T>(items: readonly T[], from: number, to: number) {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function ImagePreviewModal({
  images: initialImages,
  onClose,
  onConfirm,
}: ImagePreviewModalProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [images, setImages] = useState(initialImages)
  const [mode, setMode] = useState<"individual" | "gallery">("individual")

  function updateImage(index: number, patch: Partial<GalleryImage>) {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...patch } : image,
      ),
    )
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))
  }

  function handleDragOver(event: React.DragEvent, index: number) {
    event.preventDefault()

    if (dragIndex === null || dragIndex === index) {
      return
    }

    setImages((current) => moveItem(current, dragIndex, index))
    setDragIndex(index)
  }

  return (
    <div
      aria-label={`${images.length} image${images.length === 1 ? "" : "s"} selected`}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[8px] border border-border-default bg-background shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <div>
            <h3 className="font-sans text-sm font-semibold text-text-primary">
              {images.length} image{images.length === 1 ? "" : "s"} selected
            </h3>
            <p className="mt-0.5 text-xs text-text-secondary">
              Reorder, add captions, then choose how to insert them.
            </p>
          </div>
          <button
            aria-label="Close image preview"
            className="rounded p-1.5 text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border-default p-4">
          <button
            className={[
              "inline-flex items-center gap-1.5 rounded-[5px] border px-3 py-1.5 text-sm transition-colors",
              mode === "individual"
                ? "border-text-primary bg-text-primary text-background"
                : "border-border-default text-text-primary hover:bg-subtle-bg",
            ].join(" ")}
            onClick={() => setMode("individual")}
            type="button"
          >
            <AlignLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Insert individually
          </button>
          <button
            className={[
              "inline-flex items-center gap-1.5 rounded-[5px] border px-3 py-1.5 text-sm transition-colors",
              mode === "gallery"
                ? "border-text-primary bg-text-primary text-background"
                : "border-border-default text-text-primary hover:bg-subtle-bg",
            ].join(" ")}
            onClick={() => setMode("gallery")}
            type="button"
          >
            <LayoutGrid aria-hidden="true" className="h-3.5 w-3.5" />
            Insert as gallery grid
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {images.map((image, index) => (
            <div
              aria-label={`Selected image ${image.file.name}`}
              className={[
                "grid gap-3 rounded-[8px] border border-border-default bg-subtle-bg/50 p-3 transition-opacity sm:grid-cols-[auto_5rem_1fr_auto]",
                dragIndex === index ? "opacity-50" : "",
              ].join(" ")}
              draggable
              key={image.id}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(event) => handleDragOver(event, index)}
              onDragStart={() => setDragIndex(index)}
            >
              <div className="hidden items-start pt-5 text-text-tertiary sm:flex">
                <GripVertical aria-hidden="true" className="h-4 w-4" />
              </div>

              <img
                alt=""
                className="h-24 w-full rounded object-cover sm:h-14 sm:w-20"
                src={image.url}
              />

              <div className="min-w-0 space-y-2">
                <p className="truncate font-sans text-xs font-medium text-text-tertiary">
                  {image.file.name}
                </p>
                <label className="sr-only" htmlFor={`caption-${image.id}`}>
                  Caption for {image.file.name}
                </label>
                <input
                  className="w-full rounded-[5px] border border-border-default bg-background px-2 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
                  id={`caption-${image.id}`}
                  onChange={(event) =>
                    updateImage(index, { caption: event.target.value })
                  }
                  placeholder="Caption shown below image..."
                  type="text"
                  value={image.caption}
                />
                <label className="sr-only" htmlFor={`alt-${image.id}`}>
                  Alt text for {image.file.name}
                </label>
                <input
                  className="w-full rounded-[5px] border border-border-default bg-background px-2 py-1.5 text-xs text-text-secondary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
                  id={`alt-${image.id}`}
                  onChange={(event) =>
                    updateImage(index, { alt: event.target.value })
                  }
                  placeholder="Alt text for accessibility..."
                  type="text"
                  value={image.alt}
                />
              </div>

              <button
                aria-label={`Remove ${image.file.name}`}
                className="justify-self-end rounded p-1.5 text-text-tertiary transition-colors hover:bg-subtle-bg hover:text-destructive"
                onClick={() => removeImage(index)}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-border-default p-4">
          <button
            className="rounded-[5px] border border-border-default px-4 py-2 text-sm text-text-primary transition-colors hover:bg-subtle-bg"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-[5px] bg-button-bg px-4 py-2 text-sm text-button-text transition-opacity hover:opacity-85 disabled:opacity-50"
            disabled={images.length === 0}
            onClick={() => onConfirm(images, mode)}
            type="button"
          >
            Insert {images.length} image{images.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  )
}
