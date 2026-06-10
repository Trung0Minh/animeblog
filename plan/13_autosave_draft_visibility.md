# 13 — Autosave & Draft Visibility

## 1. Overview

Two features are covered in this file:

1. **Autosave** — the editor automatically saves content to the server so writers never lose work. Uses a two-layer approach: debounce save (fires 3 seconds after the writer stops typing) + periodic save (fires every 30 seconds regardless, as a safety net).

2. **Draft visibility** — writers control who can see their draft. By default a draft is private (hidden from co-authors). The primary author can explicitly share it with specific co-authors. Admins always see everything regardless of visibility settings.

---

## 2. Database Schema Changes

Add the following to `prisma/schema.prisma` (extends the existing `Post` model):

```prisma
model Post {
  // ... all existing fields ...

  // Autosave
  lastSavedAt     DateTime?    // Timestamp of last successful autosave

  // Draft visibility
  // Who can see this draft besides the primary author and admin?
  // null = only primary author + admin (default)
  // 'co-authors' = all co-authors can see it
  draftVisibility DraftVisibility @default(PRIVATE)
}

enum DraftVisibility {
  PRIVATE      // Only primary author + admin can see the draft
  CO_AUTHORS   // Primary author + all co-authors + admin
}
```

Run migration after schema change:
```bash
npx prisma migrate dev --name add_autosave_draft_visibility
```

---

## 3. Autosave

### How it works

```
Writer types in the editor
        │
        ├── Debounce timer resets on every keystroke
        │
        └── Timer fires after 3 seconds of inactivity
                │
                ▼
        PATCH /api/posts/[id]  { content, contentText, title, excerpt }
                │
                ├── On success → show "Saved" indicator
                └── On failure → show "Save failed" indicator, retry after 5s

Simultaneously, every 30 seconds:
        │
        ▼
Periodic save fires regardless of debounce state
        └── Same PATCH call — acts as safety net for continuous typing
```

### Autosave hook

```typescript
// hooks/useAutosave.ts
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutosaveOptions {
  postId: string | null      // null = post not yet created (new post)
  onSave: () => Promise<void>
  debounceMs?: number        // default: 3000
  intervalMs?: number        // default: 30000
}

export function useAutosave({
  postId,
  onSave,
  debounceMs = 3000,
  intervalMs = 30_000,
}: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSavingRef = useRef(false)
  const pendingRef = useRef(false)   // True if content changed while a save was in-flight

  const save = useCallback(async () => {
    // Don't attempt autosave if the post hasn't been created yet
    if (!postId) return
    // Don't stack saves — if one is already in-flight, mark pending
    if (isSavingRef.current) {
      pendingRef.current = true
      return
    }

    isSavingRef.current = true
    setStatus('saving')

    try {
      await onSave()
      setStatus('saved')

      // If content changed while we were saving, trigger another save
      if (pendingRef.current) {
        pendingRef.current = false
        isSavingRef.current = false
        await save()
        return
      }
    } catch {
      setStatus('error')
    } finally {
      isSavingRef.current = false
    }
  }, [postId, onSave])

  // Called by the editor's onChange — resets the debounce timer
  const scheduleDebounce = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(save, debounceMs)
  }, [save, debounceMs])

  // Start and stop the periodic save interval
  useEffect(() => {
    if (!postId) return

    intervalRef.current = setInterval(save, intervalMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [postId, save, intervalMs])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return { status, scheduleDebounce }
}
```

### SaveStatusIndicator component

```typescript
// components/editor/SaveStatusIndicator.tsx
'use client'

import { Check, Loader2, AlertCircle } from 'lucide-react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {status === 'saving' && (
        <>
          <Loader2 size={12} className="animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check size={12} className="text-green-500" />
          <span className="text-green-600 dark:text-green-400">Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle size={12} className="text-destructive" />
          <span className="text-destructive">Save failed — retrying...</span>
        </>
      )}
    </div>
  )
}
```

### Integration in PostEditor

Update `PostEditor` from `04_posts.md` to wire in autosave:

```typescript
// components/posts/PostEditor.tsx  (update existing component)
import { useAutosave } from '@/hooks/useAutosave'
import { SaveStatusIndicator } from '@/components/editor/SaveStatusIndicator'

export function PostEditor({ initialData, categories, writers }: PostEditorProps) {
  // ... all existing state ...

  // postId is null for a new post until first save
  const [postId, setPostId] = useState<string | null>(initialData?.id ?? null)

  // Autosave function — only saves title + content + excerpt (not status/tags/co-authors)
  // Status, tags, and co-authors are only changed via explicit button clicks
  const performAutosave = useCallback(async () => {
    if (!postId) return

    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, contentText, excerpt }),
    })

    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error ?? 'Autosave failed')
    }
  }, [postId, title, content, contentText, excerpt])

  const { status: saveStatus, scheduleDebounce } = useAutosave({
    postId,
    onSave: performAutosave,
  })

  // Wire editor onChange to trigger autosave debounce
  const handleEditorChange = (json: JSONContent, text: string) => {
    setContent(json)
    setContentText(text)
    scheduleDebounce()
  }

  // Also trigger debounce on title and excerpt change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    scheduleDebounce()
  }

  // On first save (new post), set postId so autosave can start
  const handleFirstSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    // ... existing handleSave logic ...
    const json = await res.json()
    if (!postId) {
      setPostId(json.data.id)  // Enable autosave after first save
    }
    // ...
  }

  return (
    <div>
      {/* Save status indicator — shown in the sticky footer bar */}
      <div className="sticky bottom-0 flex justify-between items-center py-4 px-0 bg-background/95 backdrop-blur border-t mt-8">
        <SaveStatusIndicator status={saveStatus} />
        <div className="flex gap-3">
          {/* ... existing Save draft / Publish buttons ... */}
        </div>
      </div>
    </div>
  )
}
```

### Warn before leaving with unsaved changes

```typescript
// hooks/useWarnUnsaved.ts
'use client'

import { useEffect } from 'react'

/**
 * Show a browser confirmation dialog if the user tries to leave
 * while there are unsaved changes.
 */
export function useWarnUnsaved(hasUnsaved: boolean) {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsaved) return
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsaved])
}
```

Add to `PostEditor`:

```typescript
// In PostEditor, track whether there are unsaved changes:
const [isDirty, setIsDirty] = useState(false)

// Mark dirty when content changes
const handleEditorChange = (json: JSONContent, text: string) => {
  setContent(json)
  setContentText(text)
  setIsDirty(true)
  scheduleDebounce()
}

// Mark clean after successful save
const performAutosave = async () => {
  // ...save logic...
  setIsDirty(false)
}

useWarnUnsaved(isDirty)
```

---

## 4. Draft Visibility

### Access Control Rules

| Who | Can see PRIVATE draft | Can see CO_AUTHORS draft |
|---|:---:|:---:|
| Primary author | ✅ | ✅ |
| Listed co-author | ❌ | ✅ |
| Other writers | ❌ | ❌ |
| Admin | ✅ | ✅ |
| Visitor | ❌ | ❌ |

### API Changes

Update the access control check in `GET /api/posts/[id]` and `GET /api/posts` to respect `draftVisibility`:

```typescript
// lib/postAccess.ts

import type { Post, User } from '@prisma/client'

interface PostWithCoAuthors extends Post {
  coAuthors: { userId: string }[]
}

/**
 * Returns true if the given user can view the post in its current state.
 */
export function canViewPost(
  post: PostWithCoAuthors,
  userId: string | undefined,
  userRole: string | undefined
): boolean {
  // Published posts are always public
  if (post.status === 'PUBLISHED') return true

  // Admin sees everything
  if (userRole === 'ADMIN') return true

  // Not logged in — cannot see any draft
  if (!userId) return false

  // Primary author always sees their own draft
  if (post.authorId === userId) return true

  // CO_AUTHORS visibility — check if user is a co-author
  if (post.draftVisibility === 'CO_AUTHORS') {
    return post.coAuthors.some((ca) => ca.userId === userId)
  }

  // PRIVATE — only primary author + admin (already handled above)
  return false
}
```

Update `GET /api/posts/[id]/route.ts`:

```typescript
// app/api/posts/[id]/route.ts  (update GET handler)
import { canViewPost } from '@/lib/postAccess'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      coAuthors: { select: { userId: true } },
      // ... other includes ...
    },
  })

  if (!post) {
    return Response.json({ error: 'Post not found' }, { status: 404 })
  }

  if (!canViewPost(post, session?.user.id, session?.user.role)) {
    // Return 404 rather than 403 to avoid leaking that the post exists
    return Response.json({ error: 'Post not found' }, { status: 404 })
  }

  return Response.json({ data: post })
}
```

### Draft Visibility Toggle in PostEditor

Add a visibility control to the post editor metadata panel:

```typescript
// components/posts/DraftVisibilityToggle.tsx
'use client'

import { useState } from 'react'
import { Lock, Users } from 'lucide-react'

interface DraftVisibilityToggleProps {
  value: 'PRIVATE' | 'CO_AUTHORS'
  onChange: (v: 'PRIVATE' | 'CO_AUTHORS') => void
  hasCoAuthors: boolean
}

export function DraftVisibilityToggle({
  value,
  onChange,
  hasCoAuthors,
}: DraftVisibilityToggleProps) {
  // Only show if there are co-authors — no point showing if solo post
  if (!hasCoAuthors) return null

  return (
    <div>
      <label className="text-sm font-medium block mb-2">
        Draft visibility
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('PRIVATE')}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors',
            value === 'PRIVATE'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-muted',
          ].join(' ')}
        >
          <Lock size={13} />
          Private
        </button>
        <button
          type="button"
          onClick={() => onChange('CO_AUTHORS')}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors',
            value === 'CO_AUTHORS'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-muted',
          ].join(' ')}
        >
          <Users size={13} />
          Visible to co-authors
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        {value === 'PRIVATE'
          ? 'Only you and admins can see this draft.'
          : 'Co-authors can view and edit this draft.'}
      </p>
    </div>
  )
}
```

Add to `PostEditor` in the metadata panel alongside category/tags:

```typescript
// In PostEditor component:
const [draftVisibility, setDraftVisibility] = useState<'PRIVATE' | 'CO_AUTHORS'>(
  initialData?.draftVisibility ?? 'PRIVATE'
)

// Include in PATCH/POST payload:
body: JSON.stringify({
  // ...other fields...
  draftVisibility,
})

// In JSX:
<DraftVisibilityToggle
  value={draftVisibility}
  onChange={setDraftVisibility}
  hasCoAuthors={coAuthorIds.length > 0}
/>
```

### Writer Dashboard — Visibility Indicator

Show a lock icon on private drafts in the writer's dashboard post list:

```typescript
// In app/(writer)/dashboard/page.tsx, update the post row:
<span className="text-xs text-muted-foreground flex items-center gap-1">
  {post.status === 'DRAFT' && post.draftVisibility === 'PRIVATE' && (
    <Lock size={10} className="inline" />
  )}
  {post.status === 'PUBLISHED'
    ? `Published ${formatDate(post.publishedAt!)}`
    : `Draft · ${post.draftVisibility === 'PRIVATE' ? 'Private' : 'Shared with co-authors'}`
  }
</span>
```

---

## 5. API Changes Summary

### PATCH /api/posts/[id]

Already handles partial updates. Ensure `draftVisibility` is included in the update schema:

```typescript
// In updateSchema (app/api/posts/[id]/route.ts):
const updateSchema = z.object({
  // ... all existing fields ...
  draftVisibility: z.enum(['PRIVATE', 'CO_AUTHORS']).optional(),
})
```

### GET /api/posts (list endpoint)

Update the visibility filter for authenticated writers so they only see drafts they're allowed to see:

```typescript
// In GET /api/posts, replace the writer visibility filter:

// Writer sees:
// 1. All published posts
// 2. Their own drafts (any visibility)
// 3. Drafts they are a co-author on AND draftVisibility = 'CO_AUTHORS'
if (session && session.user.role !== 'ADMIN') {
  statusFilter = {
    OR: [
      { status: 'PUBLISHED' },
      { status: 'DRAFT', authorId: session.user.id },
      {
        status: 'DRAFT',
        draftVisibility: 'CO_AUTHORS',
        coAuthors: { some: { userId: session.user.id } },
      },
    ],
  }
}
```

---

## 6. Checklist

**Autosave:**
- [ ] Add `lastSavedAt` field to Prisma schema, run migration
- [ ] Create `hooks/useAutosave.ts`
- [ ] Create `hooks/useWarnUnsaved.ts`
- [ ] Create `components/editor/SaveStatusIndicator.tsx`
- [ ] Update `PostEditor` to wire in `useAutosave`, `useWarnUnsaved`, and `SaveStatusIndicator`
- [ ] Verify: typing in the editor and waiting 3 seconds triggers a PATCH request
- [ ] Verify: typing continuously for 35 seconds triggers at least one periodic save
- [ ] Verify: closing the tab with unsaved changes shows a browser confirmation dialog
- [ ] Verify: `SaveStatusIndicator` shows "Saving...", "Saved", and "Save failed" correctly
- [ ] Verify: autosave does NOT fire on a new post before first manual save (no postId yet)

**Draft Visibility:**
- [ ] Add `draftVisibility` enum and field to Prisma schema, run migration
- [ ] Create `lib/postAccess.ts` with `canViewPost` helper
- [ ] Update `GET /api/posts/[id]` to use `canViewPost`
- [ ] Update `GET /api/posts` list filter to respect `draftVisibility` for writers
- [ ] Add `draftVisibility` to `updateSchema` in `PATCH /api/posts/[id]`
- [ ] Create `components/posts/DraftVisibilityToggle.tsx`
- [ ] Add `DraftVisibilityToggle` to `PostEditor`
- [ ] Add visibility indicator to writer dashboard post list
- [ ] Verify: a PRIVATE draft is not visible to co-authors (returns 404)
- [ ] Verify: a CO_AUTHORS draft is visible to listed co-authors
- [ ] Verify: a CO_AUTHORS draft is NOT visible to writers who are not co-authors
- [ ] Verify: admin can always see all drafts regardless of visibility setting
- [ ] Verify: published posts are always public regardless of what `draftVisibility` was set to
