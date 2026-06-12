"use client"

import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"

export interface LightboxImage {
  alt: string
  caption?: string
  src: string
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex: number
  onClose: () => void
}

export function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const current = images[index]
  const hasNext = index < images.length - 1
  const hasPrevious = index > 0

  const previous = useCallback(() => {
    if (!hasPrevious) {
      return
    }

    setIndex((currentIndex) => currentIndex - 1)
    setScale(1)
  }, [hasPrevious])

  const next = useCallback(() => {
    if (!hasNext) {
      return
    }

    setIndex((currentIndex) => currentIndex + 1)
    setScale(1)
  }, [hasNext])

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }

      if (event.key === "ArrowLeft") {
        previous()
      }

      if (event.key === "ArrowRight") {
        next()
      }
    }

    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [next, onClose, previous])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  if (!current) {
    return null
  }

  return (
    <div
      aria-label="Image viewer"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
    >
      <button
        aria-label="Close image viewer"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        onClick={onClose}
        type="button"
      >
        <X aria-hidden="true" className="h-5 w-5" />
      </button>

      {images.length > 1 ? (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 font-sans text-sm text-white/80">
          {index + 1} / {images.length}
        </div>
      ) : null}

      <div className="absolute right-16 top-4 z-10 flex gap-1">
        <button
          aria-label="Zoom in"
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
          disabled={scale >= 3}
          onClick={(event) => {
            event.stopPropagation()
            setScale((currentScale) => Math.min(currentScale + 0.5, 3))
          }}
          type="button"
        >
          <ZoomIn aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          aria-label="Zoom out"
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
          disabled={scale <= 1}
          onClick={(event) => {
            event.stopPropagation()
            setScale((currentScale) => Math.max(currentScale - 0.5, 1))
          }}
          type="button"
        >
          <ZoomOut aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      {hasPrevious ? (
        <button
          aria-label="Previous image"
          className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          onClick={(event) => {
            event.stopPropagation()
            previous()
          }}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="h-6 w-6" />
        </button>
      ) : null}

      <div
        className="flex max-h-[80vh] max-w-[90vw] items-center justify-center overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          alt={current.alt || "Expanded post image"}
          className="max-h-[80vh] max-w-full select-none rounded object-contain"
          draggable={false}
          src={current.src}
          style={{
            transform: `scale(${scale})`,
            transition: "transform 200ms ease",
          }}
        />
      </div>

      {current.caption ? (
        <p className="mt-4 max-w-2xl px-4 text-center font-sans text-sm text-white/75">
          {current.caption}
        </p>
      ) : null}

      {hasNext ? (
        <button
          aria-label="Next image"
          className="absolute right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          onClick={(event) => {
            event.stopPropagation()
            next()
          }}
          type="button"
        >
          <ChevronRight aria-hidden="true" className="h-6 w-6" />
        </button>
      ) : null}
    </div>
  )
}
