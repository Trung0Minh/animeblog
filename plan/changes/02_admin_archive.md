# changes/02_admin_archive.md — Admin Post Archive

## Problem

Admin currently can only delete posts. Delete is permanent and irreversible. An archive feature is needed to hide posts from public view without destroying them — useful when a post needs to be pulled temporarily, reviewed, or the writer leaves the platform.

## Delete vs Archive

| | Delete | Archive |
|---|---|---|
| Post remains in DB | ❌ | ✅ |
| Visible to public | ❌ | ❌ |
| Visible to admin | ❌ | ✅ |
| Writer can still edit | ❌ | ❌ (admin-only) |
| Reversible | ❌ | ✅ (unarchive) |
| Use when | 100% sure not needed | Temporary removal, review |

---

## Schema Change

Add `ARCHIVED` to the `PostStatus` enum in `prisma/schema.prisma`:

```prisma
enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED   // ← add this
}
```

Run migration:
```bash
npx prisma migrate dev --name add_archived_post_status
```

---

## Files to Change

### 1. `app/api/posts/[id]/route.ts` — PATCH handler

The existing PATCH route already handles status updates. No new route needed — just ensure `ARCHIVED` is accepted in the schema:

```typescript
// In updateSchema:
const updateSchema = z.object({
  // ...existing fields...
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})
```

Add a dedicated archive/unarchive API for clarity and to enforce admin-only access:

```typescript
// app/api/posts/[id]/archive/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

// POST /api/posts/[id]/archive — archive a post (admin only)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    })

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }
    if (post.status === 'ARCHIVED') {
      return Response.json({ error: 'Post is already archived' }, { status: 400 })
    }

    await prisma.post.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    })

    revalidateTag('posts')
    return Response.json({ data: { message: 'Post archived' } })
  } catch (error) {
    console.error('[POST /api/posts/[id]/archive]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// DELETE /api/posts/[id]/archive — unarchive a post (restore to previous status)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    })

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }
    if (post.status !== 'ARCHIVED') {
      return Response.json({ error: 'Post is not archived' }, { status: 400 })
    }

    // Restore to DRAFT — safer than restoring to PUBLISHED automatically
    await prisma.post.update({
      where: { id: params.id },
      data: { status: 'DRAFT' },
    })

    revalidateTag('posts')
    return Response.json({ data: { message: 'Post restored to draft' } })
  } catch (error) {
    console.error('[DELETE /api/posts/[id]/archive]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

> **Why restore to DRAFT instead of PUBLISHED?** Restoring directly to PUBLISHED could re-expose content that was archived for review. Restoring to DRAFT lets the admin or writer review before re-publishing.

---

### 2. `app/api/posts/[id]/route.ts` — GET handler access control

Archived posts should be visible to admin but not to visitors or writers:

```typescript
// In GET /api/posts/[id]:
// Update the access control check:
if (post.status === 'DRAFT' || post.status === 'ARCHIVED') {
  const isOwner = session?.user.id === post.authorId
  const isAdmin = session?.user.role === 'ADMIN'

  // Archived posts: admin only (writer cannot see their own archived post)
  if (post.status === 'ARCHIVED' && !isAdmin) {
    return Response.json({ error: 'Post not found' }, { status: 404 })
  }

  // Draft posts: owner or admin
  if (post.status === 'DRAFT' && !isOwner && !isAdmin) {
    return Response.json({ error: 'Post not found' }, { status: 404 })
  }
}
```

### 3. `app/api/posts/route.ts` — GET list

Archived posts must never appear in public listing, category/tag pages, or search results:

```typescript
// Visitor and unauthenticated: only PUBLISHED
{ status: { equals: 'PUBLISHED' } }

// Writer: own DRAFTs + all PUBLISHED (no ARCHIVED)
{
  OR: [
    { status: 'PUBLISHED' },
    { status: 'DRAFT', authorId: session.user.id },
  ]
}

// Admin: everything including ARCHIVED
{}  // no status filter, or filter by explicit status param
```

### 4. `lib/search.ts` — exclude archived from search

```typescript
// In GET /api/search/route.ts, update the WHERE clause:
WHERE p.status = 'PUBLISHED'
-- ARCHIVED posts are already excluded since we only search PUBLISHED
```

No change needed here — search already filters by `status = 'PUBLISHED'`.

---

### 5. `components/admin/AdminPostsTable.tsx` — Archive/Unarchive buttons

Add archive and unarchive buttons alongside the existing delete button:

```typescript
// components/admin/AdminPostsTable.tsx
import { Archive, ArchiveRestore, Trash2, ExternalLink } from 'lucide-react'

// Add to action buttons cell:
{post.status !== 'ARCHIVED' ? (
  <button
    onClick={() => handleArchive(post.id, post.title)}
    disabled={archivingId === post.id}
    title="Archive post"
    className="p-1.5 rounded text-muted-foreground hover:text-orange-500 transition-colors disabled:opacity-50"
  >
    <Archive size={14} />
  </button>
) : (
  <button
    onClick={() => handleUnarchive(post.id, post.title)}
    disabled={archivingId === post.id}
    title="Restore post to draft"
    className="p-1.5 rounded text-muted-foreground hover:text-green-500 transition-colors disabled:opacity-50"
  >
    <ArchiveRestore size={14} />
  </button>
)}

// Add handlers:
const [archivingId, setArchivingId] = useState<string | null>(null)

const handleArchive = async (id: string, title: string) => {
  if (!confirm(`Archive "${title}"? It will be hidden from public view but can be restored later.`)) return

  setArchivingId(id)
  try {
    const res = await fetch(`/api/posts/${id}/archive`, { method: 'POST' })
    if (!res.ok) throw new Error('Archive failed')
    router.refresh()
  } catch {
    alert('Failed to archive post')
  } finally {
    setArchivingId(null)
  }
}

const handleUnarchive = async (id: string, title: string) => {
  if (!confirm(`Restore "${title}" to draft?`)) return

  setArchivingId(id)
  try {
    const res = await fetch(`/api/posts/${id}/archive`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Unarchive failed')
    router.refresh()
  } catch {
    alert('Failed to restore post')
  } finally {
    setArchivingId(null)
  }
}
```

### 6. Status badge — add ARCHIVED style

```typescript
// In AdminPostsTable.tsx status badge:
const statusStyles = {
  PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  DRAFT:     'bg-muted text-muted-foreground',
  ARCHIVED:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

const statusLabels = {
  PUBLISHED: 'Published',
  DRAFT:     'Draft',
  ARCHIVED:  'Archived',
}

<span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[post.status]}`}>
  {statusLabels[post.status]}
</span>
```

### 7. Admin posts filter tabs — add Archived tab

```typescript
// app/(admin)/admin/posts/page.tsx
{[
  { label: 'All',      value: undefined },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Drafts',   value: 'DRAFT' },
  { label: 'Archived', value: 'ARCHIVED' },   // ← add this
].map(({ label, value }) => (
  <a
    key={label}
    href={value ? `/admin/posts?status=${value}` : '/admin/posts'}
    className={...}
  >
    {label}
  </a>
))}
```

### 8. Writer dashboard — hide archived posts

Writers should not see archived posts in their own dashboard (only admin can see and manage them):

```typescript
// app/(writer)/dashboard/page.tsx
const posts = await prisma.post.findMany({
  where: {
    authorId: session.user.id,
    status: { not: 'ARCHIVED' },   // ← exclude archived
  },
  ...
})
```

---

## Checklist

- [x] Add `ARCHIVED` to `PostStatus` enum in `schema.prisma`
- [x] Run migration for `add_archived_post_status` (`migrate deploy` used because `migrate dev` hit Supabase shadow DB failure)
- [x] Create `app/api/posts/[id]/archive/route.ts` (POST to archive, DELETE to unarchive)
- [x] Update `GET /api/posts/[id]` access control to handle ARCHIVED status
- [x] Update `GET /api/posts` list filter to exclude ARCHIVED for visitors and writers
- [x] Update `updateSchema` in `PATCH /api/posts/[id]` to accept `ARCHIVED` status
- [x] Add archive/unarchive buttons to `AdminPostsTable`
- [x] Add ARCHIVED status badge style (orange)
- [x] Add Archived filter tab to `/admin/posts` page
- [x] Exclude ARCHIVED posts from writer dashboard list
- [x] Verify: archived post returns 404 for visitors and writers
- [x] Verify: archived post is visible in `/admin/posts?status=ARCHIVED`
- [x] Verify: unarchiving restores post to DRAFT, not PUBLISHED
- [x] Verify: archived posts do not appear in search results
- [x] Verify: archived posts do not appear in sitemap
