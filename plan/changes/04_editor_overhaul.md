# changes/04_editor_overhaul.md — Editor Overhaul

## Problem

The current editor has several UX issues:

1. **Not fullscreen** — editor shares the page with Navbar and other UI elements, feels cramped
2. **Writing area not visually defined** — no clear boundary showing where the content area is
3. **Line spacing too loose** — `leading-relaxed` (1.75) + large paragraph margins create too much space between lines and paragraphs
4. **Enter key creates double spacing** — pressing Enter creates a new paragraph with extra margin, should behave like a normal line break visually unless intentionally creating a new section
5. **No distinction between soft return and paragraph break** — Shift+Enter (soft return) and Enter (new paragraph) should look different but currently both feel the same because of excessive margins

---

## Fix 1 — Fullscreen editor mode

The editor should take over the entire screen when writing. The page's Navbar, Sidebar, and Footer should be hidden. Only a minimal bar at the top with Save Draft, Publish, and Exit buttons.

**File to change:** `components/posts/PostEditor.tsx`, `app/(writer)/dashboard/new/page.tsx`, `app/(writer)/dashboard/edit/[id]/page.tsx`

### Fullscreen layout structure

```
┌─────────────────────────────────────────────────────┐
│  [← Exit]   "Editing: Post Title"   [Save draft] [Publish] │  ← EditorTopBar (48px)
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  [Toolbar]                                   │   │
│  ├─────────────────────────────────────────────┤   │
│  │                                             │   │
│  │  Title...                                   │   │
│  │  Excerpt...                                 │   │
│  │                                             │   │
│  │  Start writing your post...                 │   │  ← Content area with visible border
│  │                                             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Cover] [Category] [Tags] [Co-authors] [Visibility]│  ← Metadata bar at bottom (collapsible)
└─────────────────────────────────────────────────────┘
```

### EditorTopBar component

```typescript
// components/editor/EditorTopBar.tsx
'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SaveStatusIndicator } from './SaveStatusIndicator'

interface EditorTopBarProps {
  postTitle: string
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  isPublished: boolean
  isPending: boolean
  onSaveDraft: () => void
  onPublish: () => void
  exitHref: string   // /dashboard
}

export function EditorTopBar({
  postTitle,
  saveStatus,
  isPublished,
  isPending,
  onSaveDraft,
  onPublish,
  exitHref,
}: EditorTopBarProps) {
  return (
    <div className="h-12 border-b bg-background flex items-center justify-between px-4 shrink-0">
      {/* Left: exit button */}
      <Link
        href={exitHref}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>

      {/* Center: save status + title hint */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <SaveStatusIndicator status={saveStatus} />
        {postTitle && (
          <span className="hidden md:inline truncate max-w-[300px]">
            {postTitle}
          </span>
        )}
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isPending}
          className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={isPending}
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPublished ? 'Update' : 'Publish'}
        </button>
      </div>
    </div>
  )
}
```

### PostEditor — fullscreen layout

```typescript
// components/posts/PostEditor.tsx — replace existing layout with fullscreen

export function PostEditor({ initialData, categories, writers }: PostEditorProps) {
  // ... existing state ...
  const [metaOpen, setMetaOpen] = useState(false)

  return (
    // Fixed fullscreen overlay — covers Navbar and everything
    <div className="fixed inset-0 z-50 bg-background flex flex-col">

      {/* Top bar */}
      <EditorTopBar
        postTitle={title}
        saveStatus={saveStatus}
        isPublished={initialData?.status === 'PUBLISHED'}
        isPending={isPending}
        onSaveDraft={() => handleSave('DRAFT')}
        onPublish={() => handleSave('PUBLISHED')}
        exitHref="/dashboard"
      />

      {/* Main editing area — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">

          {/* Tiptap toolbar — sticky within scroll area */}
          <EditorToolbar editor={editor} />

          {/* Visible writing area with border */}
          <div className="mt-3 border rounded-lg bg-background shadow-sm">
            <div className="p-6 sm:p-8">

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Post title..."
                className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-2"
              />

              {/* Excerpt */}
              <textarea
                value={excerpt}
                onChange={(e) => { setExcerpt(e.target.value); scheduleDebounce() }}
                placeholder="Short excerpt (optional)..."
                rows={1}
                maxLength={500}
                className="w-full text-base text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/40 resize-none mb-4 leading-normal"
                onInput={(e) => {
                  // Auto-resize textarea
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = el.scrollHeight + 'px'
                }}
              />

              {/* Divider between meta and content */}
              <div className="border-t mb-6" />

              {/* Tiptap content */}
              <EditorContent editor={editor} />

            </div>
          </div>

          {/* Bottom padding so content doesn't hide behind meta bar */}
          <div className="h-20" />
        </div>
      </div>

      {/* Bottom metadata bar */}
      <div className="border-t bg-background shrink-0">
        <button
          type="button"
          onClick={() => setMetaOpen((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronUp size={13} className={metaOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
          {metaOpen ? 'Hide settings' : 'Post settings (cover, category, tags, co-authors)'}
        </button>

        {metaOpen && (
          <div className="px-6 pb-6 pt-2 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 border-t">
            <CoverImageUpload value={coverUrl} onChange={setCoverUrl} />

            <div className="space-y-4">
              {/* Category select */}
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <optgroup key={cat.id} label={cat.name}>
                      <option value={cat.id}>{cat.name}</option>
                      {cat.children.map((child) => (
                        <option key={child.id} value={child.id}>
                          &nbsp;&nbsp;{child.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <TagInput selectedTags={selectedTags} onChange={setSelectedTags} />

              {/* Co-authors */}
              <CoAuthorPicker writers={writers} value={coAuthorIds} onChange={setCoAuthorIds} />

              {/* Draft visibility */}
              <DraftVisibilityToggle
                value={draftVisibility}
                onChange={setDraftVisibility}
                hasCoAuthors={coAuthorIds.length > 0}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Hide Navbar when editor is open

Since `PostEditor` uses `fixed inset-0 z-50`, it already covers the Navbar. No changes needed to Navbar — the editor overlay sits on top.

---

## Fix 2 — Editor spacing

Current prose styles use `leading-relaxed` (1.75) and large `margin-bottom` between paragraphs. Reduce these significantly.

**File to change:** `app/globals.css`

```css
/* Replace existing .post-content and .ProseMirror prose styles */

/* Editor write mode */
.ProseMirror {
  font-size: 1rem;
  line-height: 1.6;       /* reduced from 1.75 */
  color: var(--color-text);
  outline: none;
  min-height: 300px;
}

.ProseMirror p {
  margin-top: 0;
  margin-bottom: 0.5em;   /* reduced from 1.5em — tight paragraph spacing */
}

/* Empty line between paragraphs = 1 blank line = visual paragraph break */
.ProseMirror p.is-empty + p,
.ProseMirror p + p {
  margin-top: 0;
}

/* Soft return (Shift+Enter) vs hard return (Enter) */
/* Shift+Enter creates <br> — same line visually */
/* Enter creates new <p> — slight gap, not a full double-space */

.ProseMirror h2 {
  font-size: 1.375rem;
  font-weight: 700;
  margin-top: 1.75em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.ProseMirror h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.4em;
  line-height: 1.3;
}

.ProseMirror blockquote {
  border-left: 3px solid var(--color-border-strong);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--color-text-muted);
  font-style: italic;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.ProseMirror li {
  margin-bottom: 0.25em;
}

.ProseMirror li p {
  margin-bottom: 0;
}

/* Read mode (PostBody) — slightly more relaxed for reading */
.post-content {
  font-size: clamp(1rem, 0.34vw + 0.91rem, 1.125rem);
  line-height: 1.7;
}

.post-content p {
  margin-bottom: 1em;   /* slightly more than editor mode, less than before */
}
```

---

## Fix 3 — Visible content area boundary

The editor writing area must have a clear visual boundary. Already handled in Fix 1 by wrapping the editor in a `border rounded-lg shadow-sm` div.

Additionally, style the Tiptap editor container to fill the space properly:

```typescript
// In TiptapEditor.tsx — update editorProps:
editorProps: {
  attributes: {
    class: [
      'outline-none',
      'min-h-[400px]',
      editable ? 'prose-editor' : 'prose prose-lg dark:prose-invert max-w-none',
    ].join(' '),
  },
},
```

```css
/* globals.css */
.prose-editor {
  /* Matches the read-mode prose styles but without the prose class */
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text);
}
```

---

## Fix 4 — Dashboard pages no longer need full layout

Since the editor is fullscreen (fixed overlay), the dashboard layout wrapper (`app/(writer)/dashboard/layout.tsx`) no longer needs to render the editor page inside the standard page container. The editor takes over everything.

The dashboard list page (`/dashboard`) stays as-is. Only the new/edit pages render the fullscreen editor.

```typescript
// app/(writer)/dashboard/new/page.tsx
// This page renders ONLY the PostEditor — no wrapper needed
// PostEditor itself is fixed fullscreen

export default async function NewPostPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [categories, writers] = await Promise.all([
    prisma.category.findMany({ include: { children: true } }),
    prisma.user.findMany({
      where: { role: 'WRITER' },
      select: { id: true, name: true, username: true },
    }),
  ])

  return (
    <PostEditor
      categories={categories}
      writers={writers}
    />
  )
}
```

---

## Checklist

- [x] Create `components/editor/EditorTopBar.tsx`
- [x] Update `PostEditor` to use `fixed inset-0 z-50` fullscreen layout
- [x] Add collapsible metadata panel at bottom of editor
- [x] Update `app/globals.css` — reduce editor line-height to 1.6, paragraph margin-bottom to 0.5em
- [x] Update `app/globals.css` — reduce read-mode (`.post-content`) paragraph margin-bottom to 1em
- [x] Add `border rounded-lg shadow-sm` wrapper around editor content area
- [x] Update `TiptapEditor` editorProps class for write mode vs read mode
- [x] Update `/dashboard/new` and `/dashboard/edit/[id]` pages to render PostEditor directly without layout wrapper
- [x] Verify: editor covers full viewport including Navbar when open
- [x] Verify: Exit button returns to `/dashboard`
- [x] Verify: Save draft and Publish buttons work from EditorTopBar
- [x] Verify: metadata panel (cover, category, tags) is accessible via bottom toggle
- [x] Verify: pressing Enter creates a new paragraph with tight spacing (not double-spaced)
- [x] Verify: pressing Shift+Enter creates a soft line break on the same visual line
- [x] Verify: editor writing area has a visible border/boundary
- [x] Verify: autosave still works in fullscreen mode
