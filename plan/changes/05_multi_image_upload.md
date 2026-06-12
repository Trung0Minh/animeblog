# changes/05_multi_image_upload.md — Multi-Image Upload & Image Lightbox

## Problem

Two related image UX issues:

1. **Single image upload only** — the current `MediaUpload` button lets writers pick one file at a time. For posts with many images (e.g. sakuga frame comparisons), this is tedious.
2. **Images are not clickable** — readers cannot zoom in on images. For anime analysis posts where frame details matter, this is a significant limitation.

---

## Part A — Multi-Image Upload with Gallery Layout

### What changes

Writers can now:
- Select multiple images/GIFs at once from their file picker
- See a preview grid of selected images before inserting
- Reorder images by drag-and-drop
- Add a caption to each image individually
- Choose between inserting as individual image blocks or as a gallery grid

### Files to change

```
components/editor/MediaUpload.tsx           — update to support multi-select
components/editor/ImageGalleryBlock.tsx     — new: gallery block component
components/editor/extensions/GalleryExtension.ts  — new: Tiptap node for gallery
app/api/upload/route.ts                     — support multiple file uploads
```

---

### 1. Update MediaUpload — multi-select

```typescript
// components/editor/MediaUpload.tsx
'use client'

import { useRef, useState } from 'react'
import { Image as ImageIcon, Loader2 } from 'lucide-react'
import { ImagePreviewModal } from './ImagePreviewModal'

interface UploadedImage {
  url: string
  alt: string
  caption: string
  file: File
}

interface MediaUploadProps {
  onInsertSingle: (url: string, alt: string) => void
  onInsertGallery: (images: { url: string; caption: string }[]) => void
}

export function MediaUpload({ onInsertSingle, onInsertGallery }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews] = useState<UploadedImage[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    // Single file — upload immediately and insert, no preview modal
    if (files.length === 1) {
      setUploading(true)
      try {
        const url = await uploadFile(files[0])
        const alt = window.prompt('Alt text (optional):') ?? ''
        onInsertSingle(url, alt)
      } catch {
        alert('Upload failed')
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
      return
    }

    // Multiple files — show preview modal for reordering + captions
    setUploading(true)
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const url = await uploadFile(file)
          return { url, alt: '', caption: '', file }
        })
      )
      setPreviews(uploaded)
      setShowPreview(true)
    } catch {
      alert('One or more uploads failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleConfirm = (images: UploadedImage[], mode: 'individual' | 'gallery') => {
    setShowPreview(false)
    setPreviews([])

    if (mode === 'individual') {
      // Insert each image as a separate block
      images.forEach((img) => onInsertSingle(img.url, img.alt))
    } else {
      // Insert as a gallery block
      onInsertGallery(images.map((img) => ({ url: img.url, caption: img.caption })))
    }
  }

  return (
    <>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); inputRef.current?.click() }}
        disabled={uploading}
        title="Insert image(s) or GIF"
        className="p-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
      >
        {uploading
          ? <Loader2 size={15} className="animate-spin" />
          : <ImageIcon size={15} />
        }
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple           // ← allow multiple selection
        className="hidden"
        onChange={handleChange}
      />

      {showPreview && (
        <ImagePreviewModal
          images={previews}
          onConfirm={handleConfirm}
          onClose={() => { setShowPreview(false); setPreviews([]) }}
        />
      )}
    </>
  )
}

// Helper: upload a single file to R2
async function uploadFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('folder', 'content-images')

  const res = await fetch('/api/upload', { method: 'POST', body: form })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json.data.url
}
```

---

### 2. ImagePreviewModal — reorder + captions + insert mode

```typescript
// components/editor/ImagePreviewModal.tsx
'use client'

import { useState } from 'react'
import { X, GripVertical, LayoutGrid, AlignLeft } from 'lucide-react'

interface ImageItem {
  url: string
  alt: string
  caption: string
  file: File
}

interface ImagePreviewModalProps {
  images: ImageItem[]
  onConfirm: (images: ImageItem[], mode: 'individual' | 'gallery') => void
  onClose: () => void
}

export function ImagePreviewModal({ images: initial, onConfirm, onClose }: ImagePreviewModalProps) {
  const [images, setImages] = useState<ImageItem[]>(initial)
  const [mode, setMode] = useState<'individual' | 'gallery'>('individual')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const updateCaption = (index: number, caption: string) => {
    setImages((prev) => prev.map((img, i) => i === index ? { ...img, caption } : img))
  }

  const updateAlt = (index: number, alt: string) => {
    setImages((prev) => prev.map((img, i) => i === index ? { ...img, alt } : img))
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Drag-and-drop reordering
  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return

    setImages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(index)
  }

  const handleDragEnd = () => setDragIndex(null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{images.length} image{images.length !== 1 ? 's' : ''} selected</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Insert mode toggle */}
        <div className="flex gap-2 p-4 border-b">
          <button
            type="button"
            onClick={() => setMode('individual')}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors',
              mode === 'individual' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted',
            ].join(' ')}
          >
            <AlignLeft size={13} />
            Insert individually
          </button>
          <button
            type="button"
            onClick={() => setMode('gallery')}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors',
              mode === 'gallery' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted',
            ].join(' ')}
          >
            <LayoutGrid size={13} />
            Insert as gallery grid
          </button>
        </div>

        {/* Image list — scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {images.map((img, index) => (
            <div
              key={img.url}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={[
                'flex gap-3 p-3 border rounded-lg bg-muted/30 cursor-grab active:cursor-grabbing transition-opacity',
                dragIndex === index ? 'opacity-50' : '',
              ].join(' ')}
            >
              {/* Drag handle */}
              <div className="flex items-center text-muted-foreground shrink-0 mt-1">
                <GripVertical size={16} />
              </div>

              {/* Thumbnail */}
              <img
                src={img.url}
                alt={img.alt}
                className="w-20 h-14 object-cover rounded shrink-0"
              />

              {/* Caption + alt text inputs */}
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  type="text"
                  value={img.caption}
                  onChange={(e) => updateCaption(index, e.target.value)}
                  placeholder="Caption (shown below image)..."
                  className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                />
                <input
                  type="text"
                  value={img.alt}
                  onChange={(e) => updateAlt(index, e.target.value)}
                  placeholder="Alt text for accessibility..."
                  className="w-full px-2 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-muted-foreground"
                />
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-1"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(images, mode)}
            disabled={images.length === 0}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Insert {images.length} image{images.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### 3. GalleryExtension — Tiptap node for image grid

```typescript
// components/editor/extensions/GalleryExtension.ts
import { Node, mergeAttributes } from '@tiptap/core'

export const GalleryExtension = Node.create({
  name: 'imageGallery',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      // Array of { url, caption } serialized as JSON string
      images: {
        default: '[]',
        parseHTML: (el) => el.getAttribute('data-images') ?? '[]',
        renderHTML: (attrs) => ({ 'data-images': attrs.images }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-gallery"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const images: { url: string; caption: string }[] = JSON.parse(
      HTMLAttributes.images ?? '[]'
    )

    return [
      'div',
      mergeAttributes({ 'data-type': 'image-gallery', class: 'image-gallery my-6' }),
      [
        'div',
        { class: 'grid grid-cols-2 gap-2' },
        ...images.map((img) => [
          'figure',
          { class: 'relative' },
          ['img', { src: img.url, alt: img.caption, class: 'w-full rounded-md object-cover cursor-zoom-in' }],
          ...(img.caption
            ? [['figcaption', { class: 'text-xs text-center text-muted-foreground mt-1' }, img.caption]]
            : []),
        ]),
      ],
    ]
  },
})
```

Add `GalleryExtension` to `TiptapEditor.tsx` extensions array and update `EditorToolbar` to wire up `onInsertGallery`:

```typescript
// TiptapEditor.tsx — add to extensions:
import { GalleryExtension } from './extensions/GalleryExtension'

// In useEditor extensions array:
GalleryExtension,

// EditorToolbar.tsx — update MediaUpload props:
<MediaUpload
  onInsertSingle={handleImageInsert}
  onInsertGallery={(images) => {
    editor.chain().focus().insertContent({
      type: 'imageGallery',
      attrs: { images: JSON.stringify(images) },
    }).run()
  }}
/>
```

---

## Part B — Image Lightbox (Click to Zoom)

Readers can click any image in a post to open a full-screen lightbox view.

### Files to change

```
components/posts/ImageLightbox.tsx    — new: lightbox component
components/posts/PostBody.tsx         — attach click handlers to images
app/globals.css                       — cursor-zoom-in style for images
```

---

### 1. ImageLightbox component

```typescript
// components/posts/ImageLightbox.tsx
'use client'

import { useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface LightboxProps {
  images: { src: string; alt: string; caption?: string }[]
  initialIndex: number
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)

  const current = images[index]
  const hasPrev = index > 0
  const hasNext = index < images.length - 1

  const prev = useCallback(() => {
    if (hasPrev) { setIndex((i) => i - 1); setScale(1) }
  }, [hasPrev])

  const next = useCallback(() => {
    if (hasNext) { setIndex((i) => i + 1); setScale(1) }
  }, [hasNext])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
      >
        <X size={20} />
      </button>

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
          {index + 1} / {images.length}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute top-4 right-16 flex gap-1 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); setScale((s) => Math.min(s + 0.5, 3)) }}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setScale((s) => Math.max(s - 0.5, 1)) }}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ZoomOut size={16} />
        </button>
      </div>

      {/* Prev button */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); prev() }}
          className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[80vh] flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.src}
          alt={current.alt}
          style={{ transform: `scale(${scale})`, transition: 'transform 200ms ease' }}
          className="max-w-full max-h-[80vh] object-contain rounded-md select-none"
          draggable={false}
        />
      </div>

      {/* Caption */}
      {current.caption && (
        <p className="mt-4 text-white/70 text-sm text-center max-w-lg px-4">
          {current.caption}
        </p>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); next() }}
          className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  )
}
```

---

### 2. PostBody — wire up lightbox

```typescript
// components/posts/PostBody.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { ImageLightbox } from './ImageLightbox'
import type { JSONContent } from '@tiptap/react'

interface PostBodyProps {
  content: JSONContent
}

interface LightboxState {
  images: { src: string; alt: string; caption?: string }[]
  index: number
}

export function PostBody({ content }: PostBodyProps) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  // After render, find all images in the post and attach click handlers
  useEffect(() => {
    const container = document.querySelector('.post-content')
    if (!container) return

    // Collect all images in the post in order
    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]

    const imageData = imgs.map((img) => ({
      src: img.src,
      alt: img.alt,
      caption: img.closest('figure')?.querySelector('figcaption')?.textContent ?? undefined,
    }))

    const handlers = imgs.map((img, i) => {
      const handler = () => setLightbox({ images: imageData, index: i })
      img.addEventListener('click', handler)
      img.style.cursor = 'zoom-in'
      return { img, handler }
    })

    return () => {
      handlers.forEach(({ img, handler }) => img.removeEventListener('click', handler))
    }
  }, [content])

  return (
    <>
      <div className="post-content">
        <TiptapEditor content={content} editable={false} />
      </div>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
```

---

### 3. CSS — cursor and hover styles for clickable images

```css
/* globals.css — add to post-content image styles */
.post-content img {
  cursor: zoom-in;
  transition: opacity 150ms;
}
.post-content img:hover {
  opacity: 0.92;
}

/* Gallery grid */
.image-gallery .grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}
.image-gallery img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 4px;
  cursor: zoom-in;
  transition: opacity 150ms;
}
.image-gallery img:hover {
  opacity: 0.9;
}

/* Single image in gallery with odd count — span full width */
.image-gallery figure:last-child:nth-child(odd) {
  grid-column: span 2;
}
```

---

## Checklist

**Multi-image upload:**
- [x] Update `MediaUpload` to accept `multiple` files and add `onInsertGallery` prop
- [x] Create `components/editor/ImagePreviewModal.tsx`
- [x] Create `components/editor/extensions/GalleryExtension.ts`
- [x] Add `GalleryExtension` to `TiptapEditor` extensions array
- [x] Update `EditorToolbar` to wire `onInsertGallery` to gallery extension
- [x] Verify: selecting 1 file uploads and inserts immediately (no modal)
- [x] Verify: selecting multiple files shows preview modal with thumbnails
- [x] Verify: images can be reordered by drag-and-drop in the modal
- [x] Verify: captions can be added per image in the modal
- [x] Verify: "Insert individually" inserts each image as a separate block
- [x] Verify: "Insert as gallery grid" inserts a 2-column grid block
- [x] Verify: gallery with odd number of images — last image spans full width

**Image lightbox:**
- [x] Create `components/posts/ImageLightbox.tsx`
- [x] Update `components/posts/PostBody.tsx` to attach click handlers and render lightbox
- [x] Add `cursor: zoom-in` and hover styles to post-content images in `globals.css`
- [x] Add gallery grid CSS to `globals.css`
- [x] Verify: clicking any image in a post opens the lightbox
- [x] Verify: keyboard navigation works (Escape to close, Arrow keys to navigate)
- [x] Verify: zoom in/out buttons work in lightbox
- [x] Verify: clicking outside the image closes the lightbox
- [x] Verify: body scroll is locked while lightbox is open
- [x] Verify: captions are shown in lightbox when available
- [x] Verify: lightbox works on mobile (tap to open, tap outside to close)
