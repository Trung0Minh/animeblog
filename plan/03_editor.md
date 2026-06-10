# 03 — Editor (Tiptap) & Media Upload

## 1. Overview

Post content is written using **Tiptap** — an extensible block editor built on ProseMirror. Content is stored as **JSON** in `Post.content`. A separate plain-text version is stored in `Post.contentText` for full-text search indexing. When rendering a post for readers, Tiptap runs in read-only mode to parse and display the JSON.

Media handling is split:
- **Images and GIFs** → uploaded directly to Cloudflare R2, URL stored in content JSON
- **Videos** → embedded via URL (YouTube, etc.), never self-hosted

---

## 2. Tiptap Extensions

| Extension | Package | Purpose |
|---|---|---|
| `StarterKit` | `@tiptap/starter-kit` | Bold, italic, strike, code, heading, lists, blockquote, horizontal rule |
| `Image` | `@tiptap/extension-image` | Insert images and GIFs |
| `Link` | `@tiptap/extension-link` | Hyperlinks with open-on-click disabled in editor |
| `Placeholder` | `@tiptap/extension-placeholder` | Empty state placeholder text |
| `Typography` | `@tiptap/extension-typography` | Smart quotes, em dashes, ellipsis |
| `CharacterCount` | `@tiptap/extension-character-count` | Live character count display |
| `CodeBlockLowlight` | `@tiptap/extension-code-block-lowlight` | Code block with syntax highlighting via lowlight |
| `SpoilerExtension` | Custom | Block-level spoiler that reveals on click |
| `VideoEmbedExtension` | Custom | Embed YouTube/external video via iframe |

---

## 3. Required Packages

```bash
npm install \
  @tiptap/react @tiptap/pm \
  @tiptap/starter-kit \
  @tiptap/extension-image \
  @tiptap/extension-link \
  @tiptap/extension-placeholder \
  @tiptap/extension-typography \
  @tiptap/extension-character-count \
  @tiptap/extension-code-block-lowlight \
  lowlight \
  @aws-sdk/client-s3 \
  nanoid
```

---

## 4. File Structure

```
components/editor/
├── TiptapEditor.tsx            # Main editor component — used in both write and read mode
├── EditorToolbar.tsx           # Toolbar shown only in editable mode
├── BubbleMenu.tsx              # Floating menu when text is selected
├── MediaUpload.tsx             # Image/GIF upload button + file input
├── VideoEmbedModal.tsx         # Modal for entering a video URL
├── SpoilerView.tsx             # React NodeView for the spoiler block
└── extensions/
    ├── SpoilerExtension.ts     # Custom Tiptap node: spoiler block
    ├── VideoEmbedExtension.ts  # Custom Tiptap node: video embed
    └── index.ts                # Re-exports all custom extensions
```

---

## 5. TiptapEditor Component

This is the single component used in both write mode (dashboard) and read mode (post detail page). The `editable` prop controls which mode is active.

```typescript
// components/editor/TiptapEditor.tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { BubbleMenuComponent } from './BubbleMenu'
import { EditorToolbar } from './EditorToolbar'
import { SpoilerExtension } from './extensions/SpoilerExtension'
import { VideoEmbedExtension } from './extensions/VideoEmbedExtension'
import type { JSONContent } from '@tiptap/react'

// Lowlight instance with common languages pre-registered
// (html, css, js, ts, python, bash, json, yaml, etc.)
const lowlight = createLowlight(common)

interface TiptapEditorProps {
  content?: JSONContent       // Initial content (undefined = empty)
  onChange?: (json: JSONContent, text: string) => void  // Called on every update
  editable?: boolean          // true = write mode, false = read mode (default: true)
}

export function TiptapEditor({
  content,
  onChange,
  editable = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Only allow H2, H3, H4 — H1 is reserved for the post title
        heading: { levels: [2, 3, 4] },
      }),
      Image.configure({
        allowBase64: false,  // Never accept base64 — images must be uploaded to R2
        HTMLAttributes: {
          class: 'rounded-md max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,   // Prevent navigating away while editing
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2 hover:opacity-80',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your post...',
      }),
      Typography,
      CharacterCount,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
      SpoilerExtension,
      VideoEmbedExtension,
    ],
    content: content ?? '',
    editable,
    onUpdate: ({ editor }) => {
      // Pass both JSON (stored in DB) and plain text (used for search index)
      onChange?.(editor.getJSON(), editor.getText())
    },
    editorProps: {
      attributes: {
        // prose-lg: comfortable reading size
        // dark:prose-invert: proper dark mode for content
        // focus:outline-none: remove browser default focus ring (toolbar handles focus state)
        class: [
          'prose prose-lg dark:prose-invert max-w-none',
          'focus:outline-none',
          editable ? 'min-h-[500px] px-0 py-4' : '',
        ].join(' '),
      },
    },
  })

  if (!editor) return null

  return (
    <div className="relative w-full">
      {editable && (
        <>
          <EditorToolbar editor={editor} />
          <BubbleMenuComponent editor={editor} />
        </>
      )}

      <EditorContent editor={editor} />

      {editable && (
        <p className="mt-2 text-xs text-muted-foreground text-right">
          {editor.storage.characterCount.characters().toLocaleString()} characters
        </p>
      )}
    </div>
  )
}
```

---

## 6. EditorToolbar Component

```typescript
// components/editor/EditorToolbar.tsx
'use client'

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Strikethrough, Code, Heading2, Heading3, Heading4,
  List, ListOrdered, Quote, Minus, Link2, Image as ImageIcon,
  Video, Eye, CodeSquare,
} from 'lucide-react'
import { MediaUpload } from './MediaUpload'
import { VideoEmbedModal } from './VideoEmbedModal'

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent editor from losing focus when toolbar button is clicked
        e.preventDefault()
        onClick()
      }}
      disabled={disabled}
      title={title}
      className={[
        'p-1.5 rounded transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1 shrink-0" />
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const [showVideoModal, setShowVideoModal] = useState(false)

  const handleImageInsert = (url: string, alt: string) => {
    editor.chain().focus().setImage({ src: url, alt }).run()
  }

  const handleVideoInsert = (url: string, caption: string) => {
    editor.chain().focus().insertContent({
      type: 'videoEmbed',
      attrs: { url, caption },
    }).run()
    setShowVideoModal(false)
  }

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Enter URL:', previous ?? 'https://')
    if (url === null) return         // User cancelled
    if (url === '') {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 p-2 mb-2 border rounded-md bg-background/95 backdrop-blur">

        {/* Text formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <Code size={15} />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive('heading', { level: 4 })} title="Heading 4">
          <Heading4 size={15} />
        </ToolbarButton>

        <Divider />

        {/* Lists & blocks */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <Minus size={15} />
        </ToolbarButton>

        <Divider />

        {/* Links & media */}
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Insert / edit link">
          <Link2 size={15} />
        </ToolbarButton>
        <MediaUpload onInsert={handleImageInsert} />
        <ToolbarButton onClick={() => setShowVideoModal(true)} title="Embed video">
          <Video size={15} />
        </ToolbarButton>

        <Divider />

        {/* Spoiler */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleSpoiler().run()} active={editor.isActive('spoiler')} title="Spoiler block">
          <Eye size={15} />
        </ToolbarButton>

        {/* Code block */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
          <CodeSquare size={15} />
        </ToolbarButton>

      </div>

      {showVideoModal && (
        <VideoEmbedModal
          onInsert={handleVideoInsert}
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </>
  )
}
```

---

## 7. BubbleMenu Component

Floating toolbar that appears when the user selects text.

```typescript
// components/editor/BubbleMenu.tsx
'use client'

import { BubbleMenu } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { Bold, Italic, Link2 } from 'lucide-react'

export function BubbleMenuComponent({ editor }: { editor: Editor }) {
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Enter URL:', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-0.5 p-1 rounded-md border bg-background shadow-md"
    >
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
        className={`p-1.5 rounded text-sm ${editor.isActive('bold') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
      >
        <Bold size={14} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
        className={`p-1.5 rounded text-sm ${editor.isActive('italic') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
      >
        <Italic size={14} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setLink() }}
        className={`p-1.5 rounded text-sm ${editor.isActive('link') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
      >
        <Link2 size={14} />
      </button>
    </BubbleMenu>
  )
}
```

---

## 8. MediaUpload Component

```typescript
// components/editor/MediaUpload.tsx
'use client'

import { useRef, useState } from 'react'
import { Image as ImageIcon, Loader2 } from 'lucide-react'

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,image/webp'

interface MediaUploadProps {
  onInsert: (url: string, alt: string) => void
}

export function MediaUpload({ onInsert }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'content-images')

      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Upload failed')

      // Prompt for optional alt text after successful upload
      const alt = window.prompt('Alt text for this image (leave blank to skip):') ?? ''
      onInsert(json.data.url, alt)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      // Reset so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); inputRef.current?.click() }}
        disabled={uploading}
        title="Insert image or GIF"
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
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleChange}
      />
    </>
  )
}
```

---

## 9. VideoEmbedModal Component

```typescript
// components/editor/VideoEmbedModal.tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface VideoEmbedModalProps {
  onInsert: (url: string, caption: string) => void
  onClose: () => void
}

export function VideoEmbedModal({ onInsert, onClose }: VideoEmbedModalProps) {
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    onInsert(url.trim(), caption.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl border">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">Embed video</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Video URL</label>
            <p className="text-xs text-muted-foreground mb-1">
              Supports YouTube links (e.g. https://youtube.com/watch?v=...)
            </p>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
              autoFocus
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Caption <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Brief description of the video..."
              className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
              Insert
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

## 10. Custom Extensions

### SpoilerExtension

```typescript
// components/editor/extensions/SpoilerExtension.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { SpoilerView } from '../SpoilerView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spoiler: {
      toggleSpoiler: () => ReturnType
    }
  }
}

export const SpoilerExtension = Node.create({
  name: 'spoiler',
  group: 'block',
  content: 'block+',

  parseHTML() {
    return [{ tag: 'div[data-type="spoiler"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'spoiler' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SpoilerView)
  },

  addCommands() {
    return {
      toggleSpoiler:
        () =>
        ({ commands }) =>
          commands.toggleWrap('spoiler'),
    }
  },
})
```

### SpoilerView (React NodeView)

```typescript
// components/editor/SpoilerView.tsx
'use client'

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function SpoilerView() {
  const [revealed, setRevealed] = useState(false)

  return (
    <NodeViewWrapper>
      <div className="relative my-4 rounded-md border border-dashed border-yellow-400/50 bg-yellow-50/30 dark:bg-yellow-900/10">
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:opacity-80 z-10"
        >
          {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
          {revealed ? 'Hide spoiler' : 'Show spoiler'}
        </button>

        <div className={`p-4 transition-all ${revealed ? '' : 'blur-sm select-none pointer-events-none'}`}>
          <NodeViewContent />
        </div>
      </div>
    </NodeViewWrapper>
  )
}
```

### VideoEmbedExtension

```typescript
// components/editor/extensions/VideoEmbedExtension.ts
import { Node, mergeAttributes } from '@tiptap/core'

// Convert a watch URL to an embed URL
function toEmbedUrl(raw: string): string {
  // YouTube: https://youtube.com/watch?v=ID or https://youtu.be/ID
  const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`
  return raw  // Other URLs passed through as-is
}

export const VideoEmbedExtension = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,  // Treated as a single indivisible unit — no cursor inside

  addAttributes() {
    return {
      url: { default: null },
      caption: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video-embed"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const embedUrl = toEmbedUrl(HTMLAttributes.url ?? '')
    const nodes: unknown[] = [
      'div',
      mergeAttributes({ 'data-type': 'video-embed', class: 'my-6' }),
      [
        'div',
        { class: 'relative w-full aspect-video' },
        [
          'iframe',
          {
            src: embedUrl,
            class: 'absolute inset-0 w-full h-full rounded-md',
            allowfullscreen: 'true',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            loading: 'lazy',
          },
        ],
      ],
    ]

    if (HTMLAttributes.caption) {
      nodes.push([
        'p',
        { class: 'mt-2 text-sm text-center text-muted-foreground' },
        HTMLAttributes.caption,
      ])
    }

    return nodes as Parameters<typeof mergeAttributes>[0]
  },
})
```

---

## 11. Upload API Route

```typescript
// app/api/upload/route.ts
import { auth } from '@/lib/auth'
import { uploadToR2 } from '@/lib/r2'
import { nanoid } from 'nanoid'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])
const MAX_BYTES = 10 * 1024 * 1024  // 10 MB

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const form = await req.formData()
    const file = form.get('file')
    const folder = (form.get('folder') as string | null) ?? 'uploads'

    if (!(file instanceof File)) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return Response.json({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'File must be 10 MB or smaller' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'bin'
    const key = `${folder}/${nanoid()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const url = await uploadToR2({ key, body: buffer, contentType: file.type })

    return Response.json({ data: { url } }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/upload]', error)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

---

## 12. Cloudflare R2 Client

```typescript
// lib/r2.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2({
  key,
  body,
  contentType,
}: {
  key: string
  body: Buffer
  contentType: string
}): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

  // Return the public URL of the uploaded file
  return `${process.env.R2_PUBLIC_URL}/${key}`
}
```

---

## 13. PostBody Component (Read-only Renderer)

Used on the post detail page to render saved Tiptap JSON content.

```typescript
// components/posts/PostBody.tsx
'use client'

import { TiptapEditor } from '@/components/editor/TiptapEditor'
import type { JSONContent } from '@tiptap/react'

interface PostBodyProps {
  content: JSONContent
}

export function PostBody({ content }: PostBodyProps) {
  return (
    // The outer div isolates prose styles from the rest of the page layout
    <div className="post-content">
      <TiptapEditor content={content} editable={false} />
    </div>
  )
}
```

---

## 14. Code Block Styles

Add these styles to `app/globals.css` alongside the other post-content prose styles:

```css
/* Code block (fenced) */
.post-content pre,
.ProseMirror pre {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1em 1.25em;
  overflow-x: auto;
  margin: 2em 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}
.post-content pre code,
.ProseMirror pre code {
  background: none;
  padding: 0;
  font-size: inherit;
  color: inherit;
  border: none;
}

/* Inline code */
.post-content code:not(pre code),
.ProseMirror code:not(pre code) {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  padding: 0.15em 0.4em;
  font-size: 0.875em;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

/* Lowlight syntax highlight tokens — GitHub-style light/dark */
.hljs-comment, .hljs-quote       { color: #6a737d; }
.hljs-keyword, .hljs-selector-tag { color: #d73a49; }
.hljs-string, .hljs-attr          { color: #032f62; }
.hljs-number, .hljs-literal       { color: #005cc5; }
.hljs-title, .hljs-name           { color: #6f42c1; }
.hljs-built_in, .hljs-type        { color: #e36209; }

.dark .hljs-comment, .dark .hljs-quote       { color: #8b949e; }
.dark .hljs-keyword, .dark .hljs-selector-tag { color: #ff7b72; }
.dark .hljs-string, .dark .hljs-attr          { color: #a5d6ff; }
.dark .hljs-number, .dark .hljs-literal       { color: #79c0ff; }
.dark .hljs-title, .dark .hljs-name           { color: #d2a8ff; }
.dark .hljs-built_in, .dark .hljs-type        { color: #ffa657; }
```

---

## 15. Cloudflare R2 Bucket Setup

These steps must be completed manually in the Cloudflare dashboard before the upload feature will work:

1. Create a new R2 bucket named `animeblog` (or whatever value `R2_BUCKET_NAME` is set to)
2. Under bucket settings, enable **Public Access** and copy the public bucket URL into `R2_PUBLIC_URL`
3. Create an **API token** with `Object Read & Write` permissions on that bucket — copy the Access Key ID and Secret into `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`
4. Set the following **CORS policy** on the bucket to allow browser uploads:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 16. Checklist

- [ ] Install all required packages listed in section 3 (including `@tiptap/extension-code-block-lowlight` and `lowlight`)
- [ ] Create `components/editor/TiptapEditor.tsx` with `CodeBlockLowlight` extension configured
- [ ] Create `components/editor/EditorToolbar.tsx` with code block button (`CodeSquare` icon)
- [ ] Create `components/editor/BubbleMenu.tsx`
- [ ] Create `components/editor/MediaUpload.tsx`
- [ ] Create `components/editor/VideoEmbedModal.tsx`
- [ ] Create `components/editor/SpoilerView.tsx`
- [ ] Create `components/editor/extensions/SpoilerExtension.ts`
- [ ] Create `components/editor/extensions/VideoEmbedExtension.ts`
- [ ] Create `app/api/upload/route.ts`
- [ ] Create `lib/r2.ts`
- [ ] Create `components/posts/PostBody.tsx`
- [ ] Add code block styles to `app/globals.css` (section 14)
- [ ] Complete R2 bucket setup in Cloudflare dashboard (section 15)
- [ ] Set env variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- [ ] Verify that uploading a GIF in the editor inserts it inline correctly
- [ ] Verify that a YouTube URL is converted to an embed iframe when inserted
- [ ] Verify that the spoiler block blurs content and reveals on click
- [ ] Verify that a code block with syntax highlighting renders correctly in both light and dark mode
- [ ] Verify that `PostBody` renders the saved JSON correctly in read-only mode (no toolbar, no cursor)
