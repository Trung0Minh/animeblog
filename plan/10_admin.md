# 10 — Admin Panel

## 1. Overview

The admin panel lives under `/admin/*` and is accessible only to users with `role = ADMIN`. It provides five management areas:

- **Dashboard** — overview stats + analytics widget (Umami, see `12_analytics.md`)
- **Posts** — view and delete all posts (including other writers' drafts)
- **Writers** — view all writers, send new invite links, revoke access
- **Comments** — moderate comments, mark as spam
- **Newsletter** — view subscriber count, send broadcast

All admin pages are Server Components by default. Actions (delete, invite, broadcast) are handled via the existing API routes established in previous files.

---

## 2. Admin Layout

```typescript
// app/(admin)/admin/layout.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/admin/AdminNav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Double-check auth in layout (proxy already handles this,
  // but layout provides a safety net for direct RSC renders)
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      <AdminNav />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </div>
    </div>
  )
}
```

---

## 3. AdminNav

```typescript
// components/admin/AdminNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, FileText, Users, MessageSquare,
  Mail, LogOut, BarChart2,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/admin',            icon: LayoutDashboard },
  { label: 'Posts',      href: '/admin/posts',       icon: FileText },
  { label: 'Writers',    href: '/admin/writers',     icon: Users },
  { label: 'Comments',   href: '/admin/comments',    icon: MessageSquare },
  { label: 'Newsletter', href: '/admin/newsletter',  icon: Mail },
  { label: 'Analytics',  href: '/admin/analytics',   icon: BarChart2 },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 max-w-6xl h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="text-sm font-semibold mr-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Blog
          </Link>
          <nav className="flex items-center gap-0.5">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              // Exact match for dashboard, prefix match for others
              const isActive =
                href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(href)

              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
                    isActive
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </header>
  )
}
```

---

## 4. Admin Dashboard — /admin

Overview stats fetched in a single parallel query.

```typescript
// app/(admin)/admin/page.tsx
import { prisma } from '@/lib/prisma'
import { FileText, Users, MessageSquare, Mail } from 'lucide-react'
import { AnalyticsWidget } from '@/components/admin/AnalyticsWidget'
import { Suspense } from 'react'

export default async function AdminDashboardPage() {
  const [postCount, draftCount, writerCount, commentCount, subscriberCount] =
    await Promise.all([
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.post.count({ where: { status: 'DRAFT' } }),
      prisma.user.count({ where: { role: 'WRITER' } }),
      prisma.comment.count({ where: { status: 'APPROVED' } }),
      prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } }),
    ])

  const stats = [
    { label: 'Published posts', value: postCount,        icon: FileText },
    { label: 'Drafts',          value: draftCount,        icon: FileText },
    { label: 'Writers',         value: writerCount,       icon: Users },
    { label: 'Comments',        value: commentCount,      icon: MessageSquare },
    { label: 'Subscribers',     value: subscriberCount,   icon: Mail },
  ]

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Site stats from DB */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Icon size={14} className="text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics from Umami — wrapped in Suspense so slow API doesn't block page */}
      {/* Full implementation in 12_analytics.md */}
      <Suspense fallback={
        <div className="p-4 border rounded-lg text-sm text-muted-foreground animate-pulse">
          Loading analytics...
        </div>
      }>
        <AnalyticsWidget />
      </Suspense>
    </div>
  )
}
```

---

## 5. Posts Management — /admin/posts

Admin can see all posts (published + drafts from all writers) and delete any of them.

```typescript
// app/(admin)/admin/posts/page.tsx
import { prisma } from '@/lib/prisma'
import { AdminPostsTable } from '@/components/admin/AdminPostsTable'

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

const PAGE_SIZE = 20

export default async function AdminPostsPage({ searchParams }: Props) {
  const { page: pageParam, status: statusParam } = await searchParams
  const page = Number(pageParam ?? 1)
  const status = statusParam as 'PUBLISHED' | 'DRAFT' | undefined

  const where = status ? { status } : {}

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        author: { select: { name: true, username: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Posts</h1>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { label: 'All',       value: undefined },
          { label: 'Published', value: 'PUBLISHED' },
          { label: 'Drafts',    value: 'DRAFT' },
        ].map(({ label, value }) => (
          <a
            key={label}
            href={value ? `/admin/posts?status=${value}` : '/admin/posts'}
            className={[
              'px-3 py-1.5 text-sm rounded-md border transition-colors',
              status === value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-muted',
            ].join(' ')}
          >
            {label}
          </a>
        ))}
      </div>

      <AdminPostsTable posts={posts} />

      {total > PAGE_SIZE && (
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
      )}
    </div>
  )
}
```

```typescript
// components/admin/AdminPostsTable.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Post {
  id: string
  title: string
  slug: string
  status: 'PUBLISHED' | 'DRAFT'
  publishedAt: Date | null
  updatedAt: Date
  author: { name: string; username: string }
  _count: { comments: number }
}

export function AdminPostsTable({ posts }: { posts: Post[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.refresh()
    } catch {
      alert('Failed to delete post')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium">Title</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Author</th>
            <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Date</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <span className="font-medium line-clamp-1">{post.title}</span>
                <span className="text-xs text-muted-foreground block mt-0.5">
                  {post._count.comments} comment{post._count.comments !== 1 ? 's' : ''}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                {post.author.name}
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                {formatDate(post.publishedAt ?? post.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <span className={[
                  'text-xs px-2 py-0.5 rounded-full',
                  post.status === 'PUBLISHED'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-muted text-muted-foreground',
                ].join(' ')}>
                  {post.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {post.status === 'PUBLISHED' && (
                    <Link
                      href={`/${post.slug}`}
                      target="_blank"
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(post.id, post.title)}
                    disabled={deletingId === post.id}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {posts.length === 0 && (
        <p className="text-center text-muted-foreground py-8 text-sm">No posts found.</p>
      )}
    </div>
  )
}
```

---

## 6. Writers Management — /admin/writers

Admin can view all writers, send invite links, and revoke writer access (downgrade role).

```typescript
// app/(admin)/admin/writers/page.tsx
import { prisma } from '@/lib/prisma'
import { InviteWriterForm } from '@/components/admin/InviteWriterForm'
import { WritersTable } from '@/components/admin/WritersTable'
import { PendingInvitesTable } from '@/components/admin/PendingInvitesTable'

export default async function AdminWritersPage() {
  const [writers, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'WRITER' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.invite.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
  ])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-6">Writers</h1>
        <WritersTable writers={writers} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Invite a New Writer</h2>
        <InviteWriterForm />
      </div>

      {pendingInvites.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Invites</h2>
          <PendingInvitesTable invites={pendingInvites} />
        </div>
      )}
    </div>
  )
}
```

```typescript
// components/admin/InviteWriterForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function InviteWriterForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setMessage({ type: 'success', text: `Invite sent to ${email}` })
      setEmail('')
      router.refresh()  // Refresh pending invites list
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3 max-w-md">
      <div className="flex-1">
        {message && (
          <p className={`text-sm mb-2 ${message.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
            {message.text}
          </p>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="writer@example.com"
          required
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
      >
        {loading ? 'Sending...' : 'Send invite'}
      </button>
    </form>
  )
}
```

```typescript
// components/admin/WritersTable.tsx
// Lists all writers with post count and a "Remove access" button

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

interface Writer {
  id: string
  name: string
  username: string
  email: string
  createdAt: Date
  _count: { posts: number }
}

export function WritersTable({ writers }: { writers: Writer[] }) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove writer access for ${name}? They will no longer be able to log in.`)) return

    setRemovingId(id)
    try {
      const res = await fetch(`/api/admin/writers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove writer')
      router.refresh()
    } catch {
      alert('Failed to remove writer access')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium">Writer</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Email</th>
            <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Joined</th>
            <th className="text-left px-4 py-3 font-medium">Posts</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {writers.map((writer) => (
            <tr key={writer.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3">
                <p className="font-medium">{writer.name}</p>
                <p className="text-xs text-muted-foreground">@{writer.username}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                {writer.email}
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                {formatDate(writer.createdAt)}
              </td>
              <td className="px-4 py-3">{writer._count.posts}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleRemove(writer.id, writer.name)}
                  disabled={removingId === writer.id}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  Remove access
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### API Route: DELETE /api/admin/writers/[id]

Remove writer access by deleting their account. Their posts remain but are marked as orphaned (handled by DB cascade rules — posts remain, authorId foreign key will need onDelete: SetNull or the admin should reassign posts first).

```typescript
// app/api/admin/writers/[id]/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const writer = await prisma.user.findUnique({
      where: { id },
      select: { role: true, _count: { select: { posts: true } } },
    })

    if (!writer) {
      return Response.json({ error: 'Writer not found' }, { status: 404 })
    }
    if (writer.role === 'ADMIN') {
      return Response.json({ error: 'Cannot remove admin accounts' }, { status: 400 })
    }
    if (writer._count.posts > 0) {
      // Rather than delete, just revoke login access by removing all sessions and accounts.
      // Posts remain intact and attributed to the writer.
      await prisma.$transaction([
        prisma.session.deleteMany({ where: { userId: id } }),
        prisma.account.deleteMany({ where: { userId: id } }),
      ])
    } else {
      // No posts — safe to fully delete
      await prisma.user.delete({ where: { id } })
    }

    return Response.json({ data: { message: 'Writer access removed' } })
  } catch (error) {
    console.error('[DELETE /api/admin/writers/[id]]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

---

## 7. Comments Moderation — /admin/comments

```typescript
// app/(admin)/admin/comments/page.tsx
import { prisma } from '@/lib/prisma'
import { AdminCommentsTable } from '@/components/admin/AdminCommentsTable'

interface Props {
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 30

export default async function AdminCommentsPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page = Number(pageParam ?? 1)

  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        authorName: true,
        content: true,
        createdAt: true,
        status: true,
        post: { select: { title: true, slug: true } },
      },
    }),
    prisma.comment.count({ where: { status: 'APPROVED' } }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Comments</h1>
      <AdminCommentsTable comments={comments} />
      {total > PAGE_SIZE && (
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
      )}
    </div>
  )
}
```

```typescript
// components/admin/AdminCommentsTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Comment {
  id: string
  authorName: string
  content: string
  createdAt: Date
  status: string
  post: { title: string; slug: string }
}

export function AdminCommentsTable({ comments }: { comments: Comment[] }) {
  const router = useRouter()
  const [spammingId, setSpammingId] = useState<string | null>(null)

  const handleMarkSpam = async (id: string) => {
    if (!confirm('Mark this comment as spam and hide it?')) return

    setSpammingId(id)
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      router.refresh()
    } catch {
      alert('Failed to hide comment')
    } finally {
      setSpammingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="border rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{comment.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
                <span className="text-xs text-muted-foreground">on</span>
                <Link
                  href={`/${comment.post.slug}`}
                  className="text-xs text-primary hover:underline truncate max-w-[200px]"
                  target="_blank"
                >
                  {comment.post.title}
                </Link>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {comment.content}
              </p>
            </div>
            <button
              onClick={() => handleMarkSpam(comment.id)}
              disabled={spammingId === comment.id}
              title="Mark as spam"
              className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0 disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {comments.length === 0 && (
        <p className="text-center text-muted-foreground py-8 text-sm">No comments found.</p>
      )}
    </div>
  )
}
```

---

## 8. Newsletter Management — /admin/newsletter

```typescript
// app/(admin)/admin/newsletter/page.tsx
import { prisma } from '@/lib/prisma'
import { NewsletterBroadcastForm } from '@/components/admin/NewsletterBroadcastForm'

export default async function AdminNewsletterPage() {
  const [activeCount, recentPosts] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 10,
      select: { id: true, title: true },
    }),
  ])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Newsletter</h1>
      <p className="text-muted-foreground mb-8">
        {activeCount.toLocaleString()} active subscriber{activeCount !== 1 ? 's' : ''}
      </p>

      <NewsletterBroadcastForm recentPosts={recentPosts} />
    </div>
  )
}
```

```typescript
// components/admin/NewsletterBroadcastForm.tsx
'use client'

import { useState } from 'react'

interface Post { id: string; title: string }

export function NewsletterBroadcastForm({ recentPosts }: { recentPosts: Post[] }) {
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [postId, setPostId] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postId && !customBody.trim()) {
      setError('Select a featured post or write a custom message.')
      return
    }

    if (!confirm(`Send this newsletter to all active subscribers?`)) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/newsletter/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          previewText,
          postId: postId || undefined,
          customBody: customBody || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setResult(json.data)
      setSubject('')
      setPreviewText('')
      setPostId('')
      setCustomBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {result && (
        <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            ✓ Sent to {result.sent} of {result.total} subscribers
          </p>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <label className="text-sm font-medium">Subject *</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          placeholder="New post: ..."
          className="mt-1 w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          Preview text <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Short text shown in email clients before opening..."
          className="mt-1 w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          Featured post <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <select
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
          className="mt-1 w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
        >
          <option value="">— None —</option>
          {recentPosts.map((post) => (
            <option key={post.id} value={post.id}>{post.title}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">
          Custom message <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          value={customBody}
          onChange={(e) => setCustomBody(e.target.value)}
          rows={5}
          placeholder="Write a personal message to your subscribers..."
          className="mt-1 w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !subject.trim()}
        className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
      >
        {loading ? 'Sending...' : 'Send broadcast'}
      </button>
    </form>
  )
}
```

---

## 9. Checklist

- [ ] Create `app/(admin)/admin/layout.tsx` with auth guard + `AdminNav`
- [ ] Create `components/admin/AdminNav.tsx` (includes Analytics nav link)
- [ ] Create `app/(admin)/admin/page.tsx` — Dashboard stats + `AnalyticsWidget`
- [ ] Create `app/(admin)/admin/posts/page.tsx` + `components/admin/AdminPostsTable.tsx`
- [ ] Create `app/(admin)/admin/writers/page.tsx`
- [ ] Create `components/admin/InviteWriterForm.tsx`
- [ ] Create `components/admin/WritersTable.tsx`
- [ ] Create `components/admin/PendingInvitesTable.tsx` — lists pending invites with expiry date
- [ ] Create `app/api/admin/writers/[id]/route.ts` (DELETE)
- [ ] Create `app/(admin)/admin/comments/page.tsx` + `components/admin/AdminCommentsTable.tsx`
- [ ] Create `app/(admin)/admin/newsletter/page.tsx` + `components/admin/NewsletterBroadcastForm.tsx`
- [ ] Create `app/(admin)/admin/analytics/page.tsx` — full-page analytics view linking to Umami dashboard (see `12_analytics.md`)
- [ ] Verify: admin can delete any post regardless of author
- [ ] Verify: admin cannot remove other admin accounts
- [ ] Verify: removing a writer with posts only revokes login access (sessions + accounts deleted), posts remain
- [ ] Verify: removing a writer with no posts deletes the user record entirely
- [ ] Verify: marking a comment as spam hides it from the public post page immediately after refresh
- [ ] Verify: newsletter broadcast shows correct sent count and handles partial failures gracefully
- [ ] Verify: `AnalyticsWidget` renders on the dashboard and falls back gracefully if Umami is unavailable
