# 04 — Posts (CRUD, Draft/Publish, Writer Dashboard)

## 1. Overview

Writers can create, edit, and delete their own posts. Each post can be saved as a **draft** (private, only visible to the author and admin) or **published** (public). A post has one primary author and optionally multiple co-authors. The writer dashboard lists all posts belonging to the logged-in writer.

---

## 2. Post Lifecycle

```
Writer navigates to /dashboard/new
        │
        ▼
Fill in: title, excerpt, cover image, category, tags, co-authors
        │
        ▼
Write content in Tiptap block editor
        │
        ├── Click "Save draft"
        │       └── POST /api/posts  { status: DRAFT }
        │               └── Redirect to /dashboard/edit/[id]
        │
        └── Click "Publish"
                └── POST /api/posts  { status: PUBLISHED }
                        └── Redirect to /[slug]  (live post)

Writer edits existing post at /dashboard/edit/[id]
        │
        ├── Click "Save"
        │       └── PATCH /api/posts/[id]  (keeps current status)
        │
        ├── Click "Publish" (if currently draft)
        │       └── PATCH /api/posts/[id]  { status: PUBLISHED, publishedAt: now() }
        │
        └── Click "Unpublish" (if currently published)
                └── PATCH /api/posts/[id]  { status: DRAFT, publishedAt: null }

Writer deletes post from dashboard
        └── DELETE /api/posts/[id]
                └── Soft check: only own post, or admin
```

---

## 3. Slug Generation

Slugs are generated from the post title. Because posts can be written in Vietnamese or other languages, the slug must be properly transliterated.

```typescript
// lib/utils.ts  (add to existing file)
import { slug as githubSlug } from 'github-slugger'

/**
 * Generate a URL-safe slug from a title.
 * Handles Vietnamese diacritics and unicode characters.
 *
 * Example:
 *   "Phân tích Animation trong Frieren" → "phan-tich-animation-trong-frieren"
 *   "Why Ufotable's Fight Scenes Work" → "why-ufotable-s-fight-scenes-work"
 */
export function generateSlug(title: string): string {
  // Normalize unicode: decompose diacritics (e.g. ề → e + combining chars)
  const normalized = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // Strip combining diacritical marks
    .replace(/đ/gi, 'd')               // Vietnamese đ → d
    .replace(/[^\w\s-]/g, '')          // Remove remaining non-word chars

  return githubSlug(normalized)
}

/**
 * Ensure slug uniqueness by appending a counter suffix if needed.
 * Call this when creating a new post, not on updates.
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  prisma: PrismaClient,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing || existing.id === excludeId) break

    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}
```

Install required package:
```bash
npm install github-slugger
```

---

## 4. API Routes

### GET /api/posts

Returns a paginated list of posts. Behavior differs by auth state:
- **Unauthenticated / Visitor** → only `PUBLISHED` posts
- **Writer (authenticated)** → own drafts + all published posts
- **Admin** → all posts regardless of status

```typescript
// app/api/posts/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  authorUsername: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  const { searchParams } = new URL(req.url)

  try {
    const { page, limit, categorySlug, tagSlug, authorUsername, status } =
      querySchema.parse(Object.fromEntries(searchParams))

    // Build visibility filter based on role
    let statusFilter: { status?: object } = { status: { equals: 'PUBLISHED' } }

    if (session?.user.role === 'ADMIN') {
      // Admin sees everything — apply explicit status filter only if requested
      statusFilter = status ? { status: { equals: status } } : {}
    } else if (session) {
      // Writer sees own drafts + all published
      statusFilter = {
        status: status
          ? { equals: status }
          : {
              OR: [
                { equals: 'PUBLISHED' },
                { equals: 'DRAFT', author: { id: session.user.id } },
              ],
            },
      }
    }

    const where = {
      ...statusFilter,
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(tagSlug && { tags: { some: { tag: { slug: tagSlug } } } }),
      ...(authorUsername && { author: { username: authorUsername } }),
    }

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverUrl: true,
          coverAlt: true,
          status: true,
          publishedAt: true,
          author: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
          coAuthors: {
            include: {
              user: { select: { id: true, name: true, username: true } },
            },
            orderBy: { order: 'asc' },
          },
          category: { select: { id: true, name: true, slug: true } },
          tags: {
            include: { tag: { select: { id: true, name: true, slug: true } } },
          },
          _count: { select: { comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ])

    return Response.json({
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('[GET /api/posts]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

### POST /api/posts

Creates a new post. Writer or Admin only.

```typescript
// app/api/posts/route.ts  (continued — add POST handler)
import { generateSlug, ensureUniqueSlug } from '@/lib/utils'

const createSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  excerpt: z.string().max(500).trim().optional(),
  coverUrl: z.string().url().optional(),
  coverAlt: z.string().max(200).optional(),
  content: z.record(z.unknown()),        // Tiptap JSONContent
  contentText: z.string().optional(),    // Plain text extracted from editor
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  coAuthorIds: z.array(z.string()).default([]),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const baseSlug = generateSlug(data.title)
    const slug = await ensureUniqueSlug(baseSlug, prisma)

    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        coverUrl: data.coverUrl,
        coverAlt: data.coverAlt,
        content: data.content,
        contentText: data.contentText,
        status: data.status,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        authorId: session.user.id,
        // Connect tags
        tags: {
          create: data.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
        },
        // Connect category
        ...(data.categoryId && { category: { connect: { id: data.categoryId } } }),
        // Connect co-authors with order
        coAuthors: {
          create: data.coAuthorIds.map((userId, index) => ({
            user: { connect: { id: userId } },
            order: index,
          })),
        },
      },
      select: { id: true, slug: true, status: true },
    })

    return Response.json({ data: post }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/posts]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

### GET /api/posts/[id]

Returns a single post by ID. Drafts are only accessible by the author or admin.

```typescript
// app/api/posts/[id]/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true, bio: true } },
        coAuthors: {
          include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
          orderBy: { order: 'asc' },
        },
        category: true,
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
    })

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    // Access control for drafts
    if (post.status === 'DRAFT') {
      const isOwner = session?.user.id === post.authorId
      const isAdmin = session?.user.role === 'ADMIN'
      if (!isOwner && !isAdmin) {
        return Response.json({ error: 'Post not found' }, { status: 404 })
      }
    }

    return Response.json({ data: post })
  } catch (error) {
    console.error('[GET /api/posts/[id]]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

### PATCH /api/posts/[id]

Updates an existing post. Writers can only update their own posts.

```typescript
// app/api/posts/[id]/route.ts  (continued)
const updateSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  excerpt: z.string().max(500).trim().optional(),
  coverUrl: z.string().url().nullable().optional(),
  coverAlt: z.string().max(200).optional(),
  content: z.record(z.unknown()).optional(),
  contentText: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  coAuthorIds: z.array(z.string()).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true, status: true },
    })

    if (!existing) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    const isOwner = session.user.id === existing.authorId
    const isAdmin = session.user.role === 'ADMIN'
    if (!isOwner && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    // Determine publishedAt: set when first publishing, clear when unpublishing
    let publishedAt: Date | null | undefined = undefined
    if (data.status === 'PUBLISHED' && existing.status === 'DRAFT') {
      publishedAt = new Date()
    } else if (data.status === 'DRAFT' && existing.status === 'PUBLISHED') {
      publishedAt = null
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
        ...(data.coverAlt !== undefined && { coverAlt: data.coverAlt }),
        ...(data.content && { content: data.content }),
        ...(data.contentText !== undefined && { contentText: data.contentText }),
        ...(data.status && { status: data.status }),
        ...(publishedAt !== undefined && { publishedAt }),
        ...(data.categoryId !== undefined && {
          category: data.categoryId
            ? { connect: { id: data.categoryId } }
            : { disconnect: true },
        }),
        // Replace all tags when tagIds is provided
        ...(data.tagIds && {
          tags: {
            deleteMany: {},
            create: data.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        }),
        // Replace all co-authors when coAuthorIds is provided
        ...(data.coAuthorIds && {
          coAuthors: {
            deleteMany: {},
            create: data.coAuthorIds.map((userId, index) => ({
              user: { connect: { id: userId } },
              order: index,
            })),
          },
        }),
      },
      select: { id: true, slug: true, status: true, updatedAt: true },
    })

    return Response.json({ data: post })
  } catch (error) {
    console.error('[PATCH /api/posts/[id]]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

### DELETE /api/posts/[id]

Permanently deletes a post. Writers can only delete their own posts.

```typescript
// app/api/posts/[id]/route.ts  (continued)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!existing) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    const isOwner = session.user.id === existing.authorId
    const isAdmin = session.user.role === 'ADMIN'
    if (!isOwner && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.post.delete({ where: { id } })

    return Response.json({ data: { message: 'Post deleted' } })
  } catch (error) {
    console.error('[DELETE /api/posts/[id]]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

---

## 5. Public Pages

### Homepage — /

```typescript
// app/(public)/page.tsx
import { prisma } from '@/lib/prisma'
import { PostList } from '@/components/posts/PostList'
import { Sidebar } from '@/components/layout/Sidebar'

interface HomePageProps {
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 10

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page: pageParam } = await searchParams
  const page = Number(pageParam ?? 1)

  const [posts, total, categories, recentPosts] = await Promise.all([
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: { select: { name: true, username: true, avatarUrl: true } },
        coAuthors: {
          include: { user: { select: { name: true, username: true } } },
          orderBy: { order: 'asc' },
        },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    // Sidebar: top-level categories with post count
    prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
        _count: { select: { posts: { where: { status: 'PUBLISHED' } } } },
      },
    }),
    // Sidebar: 5 most recent posts (for "Recent Posts" widget)
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: { title: true, slug: true, publishedAt: true },
    }),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        <main className="flex-1 min-w-0">
          <PostList
            posts={posts}
            pagination={{ page, total, pageSize: PAGE_SIZE }}
          />
        </main>
        <Sidebar categories={categories} recentPosts={recentPosts} />
      </div>
    </div>
  )
}
```

### Post Detail Page — /[slug]

```typescript
// app/(public)/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PostHeader } from '@/components/posts/PostHeader'
import { PostBody } from '@/components/posts/PostBody'
import { TableOfContents } from '@/components/posts/TableOfContents'
import { CommentSection } from '@/components/comments/CommentSection'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const post = await prisma.post.findUnique({
    where: { slug, status: 'PUBLISHED' },
    select: { title: true, excerpt: true, coverUrl: true },
  })
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverUrl ? [post.coverUrl] : [],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params

  const post = await prisma.post.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true, bio: true } },
      coAuthors: {
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
        orderBy: { order: 'asc' },
      },
      category: true,
      tags: { include: { tag: true } },
    },
  })

  if (!post) notFound()

  const comments = await prisma.comment.findMany({
    where: { postId: post.id, status: 'APPROVED', parentId: null },
    include: {
      replies: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      <PostHeader post={post} />
      <div className="mt-8 flex gap-8">
        <div className="flex-1 min-w-0">
          <PostBody content={post.content as JSONContent} />
        </div>
        <aside className="hidden xl:block w-56 shrink-0">
          <TableOfContents content={post.content as JSONContent} />
        </aside>
      </div>
      <CommentSection postId={post.id} initialComments={comments} />
    </article>
  )
}
```

### Author Profile Page — /authors/[username]

```typescript
// app/(public)/authors/[username]/page.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PostCard } from '@/components/posts/PostCard'

interface Props {
  params: Promise<{ username: string }>
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 10

export default async function AuthorPage({ params, searchParams }: Props) {
  const [{ username }, { page: pageParam }] = await Promise.all([params, searchParams])
  const page = Number(pageParam ?? 1)

  const author = await prisma.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true, bio: true, avatarUrl: true, createdAt: true },
  })

  if (!author) notFound()

  // Posts where this user is either primary author or co-author
  const where = {
    status: 'PUBLISHED' as const,
    OR: [
      { authorId: author.id },
      { coAuthors: { some: { userId: author.id } } },
    ],
  }

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: { select: { name: true, username: true, avatarUrl: true } },
        coAuthors: {
          include: { user: { select: { name: true, username: true } } },
          orderBy: { order: 'asc' },
        },
        category: { select: { name: true, slug: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ])

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Author bio section */}
      <div className="flex items-start gap-4 mb-10 pb-8 border-b">
        {author.avatarUrl && (
          <img
            src={author.avatarUrl}
            alt={author.name}
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{author.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">@{author.username}</p>
          {author.bio && <p className="mt-3 text-sm leading-relaxed">{author.bio}</p>}
        </div>
      </div>

      {/* Post list */}
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
      )}
    </div>
  )
}
```

---

## 6. Writer Dashboard Pages

### /dashboard — Post List

```typescript
// app/(writer)/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const posts = await prisma.post.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      _count: { select: { comments: true } },
    },
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">My Posts</h1>
        <Link
          href="/dashboard/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          New post
        </Link>
      </div>

      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id} className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50">
            <div className="min-w-0">
              <p className="font-medium truncate">{post.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {post.status === 'PUBLISHED'
                  ? `Published ${formatDate(post.publishedAt!)}`
                  : `Draft · Updated ${formatDate(post.updatedAt)}`}
                {' · '}
                {post._count.comments} comment{post._count.comments !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                post.status === 'PUBLISHED'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {post.status === 'PUBLISHED' ? 'Published' : 'Draft'}
              </span>
              <Link href={`/dashboard/edit/${post.id}`} className="text-sm text-primary hover:underline">
                Edit
              </Link>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No posts yet.{' '}
            <Link href="/dashboard/new" className="text-primary hover:underline">
              Write your first post
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
```

### /dashboard/new and /dashboard/edit/[id] — PostEditor

Both new and edit pages use the same `PostEditor` client component. The difference is only in the initial data passed and which API is called.

```typescript
// components/posts/PostEditor.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import type { JSONContent } from '@tiptap/react'

interface PostEditorProps {
  // undefined = new post; provided = editing existing post
  initialData?: {
    id: string
    title: string
    excerpt: string
    coverUrl: string | null
    content: JSONContent
    status: 'DRAFT' | 'PUBLISHED'
    categoryId: string | null
    tagIds: string[]
    coAuthorIds: string[]
  }
  categories: { id: string; name: string; slug: string; children: { id: string; name: string }[] }[]
  writers: { id: string; name: string; username: string }[]  // For co-author picker
}

export function PostEditor({ initialData, categories, writers }: PostEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl ?? '')
  const [content, setContent] = useState<JSONContent>(initialData?.content ?? {})
  const [contentText, setContentText] = useState('')
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '')
  const [tagIds, setTagIds] = useState<string[]>(initialData?.tagIds ?? [])
  const [coAuthorIds, setCoAuthorIds] = useState<string[]>(initialData?.coAuthorIds ?? [])
  const [error, setError] = useState('')

  const isEditing = !!initialData

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setError('')

    const payload = {
      title,
      excerpt,
      coverUrl: coverUrl || undefined,
      content,
      contentText,
      status,
      categoryId: categoryId || undefined,
      tagIds,
      coAuthorIds,
    }

    startTransition(async () => {
      try {
        const res = await fetch(
          isEditing ? `/api/posts/${initialData.id}` : '/api/posts',
          {
            method: isEditing ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        )

        const json = await res.json()
        if (!res.ok) throw new Error(json.error)

        if (status === 'PUBLISHED') {
          router.push(`/${json.data.slug}`)
        } else {
          // After first save of a new post, redirect to edit page
          if (!isEditing) {
            router.push(`/dashboard/edit/${json.data.id}`)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {error && (
        <div className="mb-4 p-3 text-sm text-destructive border border-destructive/30 rounded-md bg-destructive/5">
          {error}
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title..."
        className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground mb-4"
      />

      {/* Excerpt */}
      <textarea
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="Short excerpt shown on the homepage (optional)..."
        rows={2}
        maxLength={500}
        className="w-full text-base bg-transparent border-none outline-none placeholder:text-muted-foreground resize-none mb-6"
      />

      {/* Cover image upload */}
      <CoverImageUpload value={coverUrl} onChange={setCoverUrl} />

      {/* Metadata: category, tags, co-authors */}
      <PostMetaFields
        categories={categories}
        writers={writers}
        categoryId={categoryId}
        tagIds={tagIds}
        coAuthorIds={coAuthorIds}
        onCategoryChange={setCategoryId}
        onTagsChange={setTagIds}
        onCoAuthorsChange={setCoAuthorIds}
        currentUserId={''} // injected from session
      />

      {/* Main content editor */}
      <div className="mt-6 border-t pt-6">
        <TiptapEditor
          content={content}
          onChange={(json, text) => {
            setContent(json)
            setContentText(text)
          }}
          editable
        />
      </div>

      {/* Action buttons */}
      <div className="sticky bottom-0 flex justify-end gap-3 py-4 bg-background/95 backdrop-blur border-t mt-8">
        <button
          type="button"
          onClick={() => handleSave('DRAFT')}
          disabled={isPending || !title.trim()}
          className="px-4 py-2 text-sm border rounded-md hover:bg-muted disabled:opacity-50 transition-colors"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => handleSave('PUBLISHED')}
          disabled={isPending || !title.trim()}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {initialData?.status === 'PUBLISHED' ? 'Update' : 'Publish'}
        </button>
      </div>
    </div>
  )
}
```

---

## 7. PostCard Component

Used on the homepage, category/tag listing, and author profile pages.

```typescript
// components/posts/PostCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface PostCardProps {
  post: {
    title: string
    slug: string
    excerpt: string | null
    coverUrl: string | null
    coverAlt: string | null
    publishedAt: Date | null
    author: { name: string; username: string; avatarUrl: string | null }
    coAuthors: { user: { name: string; username: string } }[]
    category: { name: string; slug: string } | null
    tags: { tag: { name: string; slug: string } }[]
    _count: { comments: number }
  }
}

export function PostCard({ post }: PostCardProps) {
  const allAuthors = [
    post.author,
    ...post.coAuthors.map((ca) => ca.user),
  ]

  return (
    <article className="group border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover image — 16:9 ratio */}
      {post.coverUrl && (
        <Link href={`/${post.slug}`}>
          <div className="relative w-full aspect-video overflow-hidden bg-muted">
            <img
              src={post.coverUrl}
              alt={post.coverAlt ?? post.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
          </div>
        </Link>
      )}

      <div className="p-5">
        {/* Category badge */}
        {post.category && (
          <Link
            href={`/category/${post.category.slug}`}
            className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
          >
            {post.category.name}
          </Link>
        )}

        {/* Title */}
        <Link href={`/${post.slug}`}>
          <h2 className="mt-1 text-xl font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {/* Author avatars */}
            <div className="flex -space-x-1.5">
              {allAuthors.slice(0, 3).map((a) => (
                a.avatarUrl
                  ? <img key={a.username} src={a.avatarUrl} alt={a.name} className="w-5 h-5 rounded-full ring-1 ring-background object-cover" />
                  : <span key={a.username} className="w-5 h-5 rounded-full ring-1 ring-background bg-muted flex items-center justify-center text-[10px] font-medium">{a.name[0]}</span>
              ))}
            </div>
            <span>
              {allAuthors.map((a, i) => (
                <span key={a.username}>
                  {i > 0 && ', '}
                  <Link href={`/authors/${a.username}`} className="hover:text-foreground transition-colors">
                    {a.name}
                  </Link>
                </span>
              ))}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
            <span>{post._count.comments} comment{post._count.comments !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map(({ tag }) => (
              <Link
                key={tag.slug}
                href={`/tag/${tag.slug}`}
                className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
```

---

## 8. TableOfContents Component

Automatically parses headings from the Tiptap JSON content and renders a sticky navigation list.

```typescript
// components/posts/TableOfContents.tsx
'use client'

import { useEffect, useState } from 'react'
import type { JSONContent } from '@tiptap/react'

interface Heading {
  level: number
  text: string
  id: string  // slug of text, used as anchor href
}

function extractHeadings(content: JSONContent): Heading[] {
  const headings: Heading[] = []

  const walk = (node: JSONContent) => {
    if (node.type === 'heading' && node.attrs?.level && node.content) {
      const text = node.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text ?? '')
        .join('')
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      headings.push({ level: node.attrs.level as number, text, id })
    }
    node.content?.forEach(walk)
  }

  walk(content)
  return headings
}

interface TableOfContentsProps {
  content: JSONContent
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const headings = extractHeadings(content)

  // Highlight active heading based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-20% 0% -60% 0%' }
    )

    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 2) return null

  return (
    <nav className="sticky top-24 text-sm">
      <p className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground">
        Contents
      </p>
      <ul className="space-y-1.5">
        {headings.map(({ level, text, id }) => (
          <li key={id} style={{ paddingLeft: `${(level - 2) * 12}px` }}>
            <a
              href={`#${id}`}
              className={`block leading-snug transition-colors hover:text-foreground ${
                activeId === id
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

> **Note:** For TOC anchor links to work, the Tiptap `renderHTML` for heading nodes must output the corresponding `id` attribute. Add this to the `StarterKit` heading configuration or create a custom Heading extension that injects the id.

---

## 9. Utility Functions

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}
```

Install:
```bash
npm install clsx tailwind-merge github-slugger
npm install -D @types/github-slugger
```

---

## 10. Tag Input — Autocomplete with Inline Creation

Writers can select existing tags or create new ones directly from the post editor. The input shows autocomplete suggestions from existing tags. If a typed tag doesn't exist yet, the writer can create it inline — no need to go to the admin panel.

### GET /api/tags — Search existing tags

```typescript
// app/api/tags/route.ts
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const querySchema = z.object({
  q: z.string().max(50).default(''),
})

// GET: search tags for autocomplete
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const { q } = querySchema.parse(Object.fromEntries(searchParams))

  const tags = await prisma.tag.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
    orderBy: { name: 'asc' },
    take: 20,
    select: { id: true, name: true, slug: true },
  })

  return Response.json({ data: tags })
}

// POST: create a new tag (writer or admin)
export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const name = (body.name as string ?? '').trim()

    if (!name || name.length > 50) {
      return Response.json({ error: 'Invalid tag name' }, { status: 400 })
    }

    // Generate slug from name
    const { generateSlug } = await import('@/lib/utils')
    const slug = generateSlug(name)

    // Upsert — if tag already exists with this slug, return it
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
      select: { id: true, name: true, slug: true },
    })

    return Response.json({ data: tag }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/tags]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

### TagInput Component

```typescript
// components/posts/TagInput.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

interface Tag {
  id: string
  name: string
  slug: string
}

interface TagInputProps {
  selectedTags: Tag[]
  onChange: (tags: Tag[]) => void
}

export function TagInput({ selectedTags, onChange }: TagInputProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const debouncedQuery = useDebounce(query, 250)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([])
      setOpen(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`/api/tags?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          // Filter out already-selected tags
          const filtered = (json.data as Tag[]).filter(
            (t) => !selectedTags.some((s) => s.id === t.id)
          )
          setSuggestions(filtered)
          setOpen(true)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [debouncedQuery, selectedTags])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addTag = (tag: Tag) => {
    if (!selectedTags.some((t) => t.id === tag.id)) {
      onChange([...selectedTags, tag])
    }
    setQuery('')
    setSuggestions([])
    setOpen(false)
  }

  const removeTag = (tagId: string) => {
    onChange(selectedTags.filter((t) => t.id !== tagId))
  }

  const handleCreateTag = async () => {
    const name = query.trim()
    if (!name) return

    setCreating(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      addTag(json.data)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create tag')
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // If there's exactly one suggestion, select it
      if (suggestions.length === 1) {
        addTag(suggestions[0])
      } else if (suggestions.length === 0 && query.trim()) {
        // No suggestions — create new tag
        handleCreateTag()
      }
    }
    if (e.key === 'Escape') setOpen(false)
  }

  // Check if typed query exactly matches an existing suggestion (case-insensitive)
  const exactMatch = suggestions.some(
    (s) => s.name.toLowerCase() === query.toLowerCase()
  )

  return (
    <div ref={containerRef}>
      <label className="text-sm font-medium block mb-2">Tags</label>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-muted border"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          placeholder="Search or create tags..."
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {loading && (
          <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {/* Dropdown */}
        {open && (query.trim()) && (
          <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => addTag(tag)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                {tag.name}
              </button>
            ))}

            {/* Create new tag option — only show if no exact match */}
            {!exactMatch && query.trim() && (
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={creating}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-sm text-primary hover:bg-muted transition-colors border-t disabled:opacity-50"
              >
                {creating
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Plus size={13} />
                }
                Create tag "{query.trim()}"
              </button>
            )}

            {suggestions.length === 0 && !query.trim() && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Type to search existing tags
              </p>
            )}
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Search for an existing tag or type a new name to create one.
      </p>
    </div>
  )
}
```

Update `PostEditor` to use `TagInput` instead of a plain tag ID array. Replace the `tagIds` state with a `selectedTags` state of type `Tag[]`, and pass full tag objects to/from the API.

---

## 11. Checklist

- [ ] Install packages: `github-slugger`, `clsx`, `tailwind-merge`
- [ ] Create `lib/utils.ts` with `cn`, `formatDate`, `generateSlug`, `ensureUniqueSlug`
- [ ] Create `app/api/posts/route.ts` (GET + POST)
- [ ] Create `app/api/posts/[id]/route.ts` (GET + PATCH + DELETE)
- [ ] Create `app/api/tags/route.ts` (GET search + POST create)
- [ ] Create `components/posts/TagInput.tsx`
- [ ] Update `PostEditor` to use `TagInput` component
- [ ] Create `app/(public)/page.tsx` — Homepage
- [ ] Create `app/(public)/[slug]/page.tsx` — Post detail
- [ ] Create `app/(public)/authors/[username]/page.tsx` — Author profile
- [ ] Create `app/(public)/category/[slug]/page.tsx` — Category listing (same pattern as homepage)
- [ ] Create `app/(public)/tag/[slug]/page.tsx` — Tag listing (same pattern as homepage)
- [ ] Create `app/(writer)/dashboard/page.tsx` — Writer post list
- [ ] Create `app/(writer)/dashboard/new/page.tsx` — loads PostEditor with no initial data
- [ ] Create `app/(writer)/dashboard/edit/[id]/page.tsx` — fetches post, loads PostEditor with initial data
- [ ] Create `components/posts/PostEditor.tsx`
- [ ] Create `components/posts/PostCard.tsx`
- [ ] Create `components/posts/PostList.tsx` — renders a list of PostCards + Pagination
- [ ] Create `components/posts/PostHeader.tsx` — cover image, title, author row, category/tags
- [ ] Create `components/posts/TableOfContents.tsx`
- [ ] Add `id` attribute to heading nodes in Tiptap so TOC anchor links work
- [ ] Verify slug uniqueness logic: creating two posts with the same title should produce `my-title` and `my-title-1`
- [ ] Verify draft visibility: drafts are not visible to visitors or other writers
- [ ] Verify that unpublishing a post sets `publishedAt` back to null
- [ ] Verify: typing a new tag name and pressing Enter (or clicking "Create tag") creates it and adds it to the post
- [ ] Verify: typing a partial tag name shows matching existing tags in the dropdown
- [ ] Verify: selecting an existing tag does not create a duplicate
