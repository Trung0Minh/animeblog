# 05 — Comments

## 1. Overview

Comments are open to anyone — no account required. Guests enter a display name and email address to post. Email is never shown publicly; it is used only to send reply notifications. Comments support one level of threading: top-level comments and direct replies. Replies to replies are not allowed.

---

## 2. Comment Flow

```
Visitor reads a post
        │
        ▼
Fills in: Name, Email, Comment text
(optional checkbox: "Notify me when someone replies")
        │
        ▼
POST /api/comments
        ├── Validate inputs (name, email, content, postId)
        ├── If parentId is provided:
        │       ├── Verify parent comment exists and belongs to same post
        │       └── Verify parent comment has no parentId (no nested replies)
        ├── Create Comment { status: APPROVED }
        ├── If parentId is set AND parent.notifyReply = true:
        │       └── Send reply notification email to parent.authorEmail
        └── Return created comment
        │
        ▼
Comment appears immediately below the post
(no moderation queue — admin can mark SPAM retroactively)
```

---

## 3. API Routes

### POST /api/comments

```typescript
// app/api/comments/route.ts
import { prisma } from '@/lib/prisma'
import { sendCommentReplyEmail } from '@/lib/resend'
import { z } from 'zod'

const schema = z.object({
  postId: z.string().min(1),
  parentId: z.string().optional(),
  authorName: z.string().min(1).max(80).trim(),
  authorEmail: z.string().email(),
  content: z.string().min(1).max(2000).trim(),
  notifyReply: z.boolean().default(true),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Verify the post exists and is published
    const post = await prisma.post.findUnique({
      where: { id: data.postId, status: 'PUBLISHED' },
      select: { id: true, title: true, slug: true },
    })
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    // Validate threading rules if this is a reply
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: data.parentId },
        select: { id: true, postId: true, parentId: true, authorEmail: true, notifyReply: true, authorName: true },
      })

      if (!parent) {
        return Response.json({ error: 'Parent comment not found' }, { status: 404 })
      }
      if (parent.postId !== data.postId) {
        return Response.json({ error: 'Parent comment does not belong to this post' }, { status: 400 })
      }
      // Enforce max 1 level of nesting
      if (parent.parentId) {
        return Response.json(
          { error: 'Replies to replies are not allowed' },
          { status: 400 }
        )
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        postId: data.postId,
        parentId: data.parentId ?? null,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        content: data.content,
        notifyReply: data.notifyReply,
        status: 'APPROVED',
      },
    })

    // Send reply notification if applicable
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: data.parentId },
        select: { authorEmail: true, authorName: true, notifyReply: true },
      })

      // Only notify if parent author wants it AND they are not replying to themselves
      if (
        parent &&
        parent.notifyReply &&
        parent.authorEmail.toLowerCase() !== data.authorEmail.toLowerCase()
      ) {
        await sendCommentReplyEmail({
          to: parent.authorEmail,
          toName: parent.authorName,
          repliedByName: data.authorName,
          replyContent: data.content,
          postTitle: post.title,
          postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${post.slug}#comment-${comment.id}`,
        }).catch((err) => {
          // Non-fatal: log but don't fail the request if email sending fails
          console.error('[POST /api/comments] Failed to send reply email:', err)
        })
      }
    }

    return Response.json({ data: comment }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/comments]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

### DELETE /api/comments/[id]

Admin only — marks a comment as SPAM (soft delete) rather than removing it from the database.

```typescript
// app/api/comments/[id]/route.ts
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
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!comment) {
      return Response.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Soft delete: mark as SPAM instead of deleting the row.
    // This preserves the threading structure — replies to a spam comment
    // still exist in the DB but are not rendered on the frontend.
    await prisma.comment.update({
      where: { id },
      data: { status: 'SPAM' },
    })

    return Response.json({ data: { message: 'Comment hidden' } })
  } catch (error) {
    console.error('[DELETE /api/comments/[id]]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

---

## 4. Frontend Components

### CommentSection

Top-level container rendered at the bottom of every post detail page.

```typescript
// components/comments/CommentSection.tsx
'use client'

import { useState } from 'react'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'
import type { CommentWithReplies } from '@/types'

interface CommentSectionProps {
  postId: string
  initialComments: CommentWithReplies[]
}

export function CommentSection({ postId, initialComments }: CommentSectionProps) {
  // Optimistically add new comments without a full page reload
  const [comments, setComments] = useState<CommentWithReplies[]>(initialComments)

  const handleNewComment = (comment: CommentWithReplies) => {
    if (comment.parentId) {
      // Insert as a reply under the correct parent
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.parentId
            ? { ...c, replies: [...(c.replies ?? []), comment] }
            : c
        )
      )
    } else {
      // Append as a new top-level comment
      setComments((prev) => [...prev, comment])
    }
  }

  return (
    <section className="mt-16 border-t pt-10">
      <h2 className="text-xl font-bold mb-8">
        {comments.length} Comment{comments.length !== 1 ? 's' : ''}
      </h2>

      {/* New top-level comment form */}
      <CommentForm postId={postId} onSuccess={handleNewComment} />

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="mt-10">
          <CommentList
            comments={comments}
            postId={postId}
            onReply={handleNewComment}
          />
        </div>
      )}
    </section>
  )
}
```

### CommentForm

Used for both new top-level comments and inline replies. The `parentId` prop is set when replying.

```typescript
// components/comments/CommentForm.tsx
'use client'

import { useState } from 'react'
import type { CommentWithReplies } from '@/types'

interface CommentFormProps {
  postId: string
  parentId?: string               // Set when this form is a reply form
  onSuccess: (comment: CommentWithReplies) => void
  onCancel?: () => void           // Used to close inline reply forms
}

export function CommentForm({ postId, parentId, onSuccess, onCancel }: CommentFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [notifyReply, setNotifyReply] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, parentId, authorName: name, authorEmail: email, content, notifyReply }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      // Reset form on success
      setName('')
      setEmail('')
      setContent('')
      onSuccess({ ...json.data, replies: [] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            placeholder="Your name"
            className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            Email <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-0.5 text-xs text-muted-foreground">
            Not shown publicly. Used only for reply notifications.
          </p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">
          Comment <span className="text-destructive">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          minLength={1}
          maxLength={2000}
          rows={4}
          placeholder={parentId ? 'Write your reply...' : 'Write a comment...'}
          className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
        />
        <p className="mt-0.5 text-xs text-muted-foreground text-right">
          {content.length}/2000
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id={`notify-${parentId ?? 'top'}`}
          type="checkbox"
          checked={notifyReply}
          onChange={(e) => setNotifyReply(e.target.checked)}
          className="rounded"
        />
        <label
          htmlFor={`notify-${parentId ?? 'top'}`}
          className="text-sm text-muted-foreground select-none cursor-pointer"
        >
          Notify me by email when someone replies
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Posting...' : parentId ? 'Post reply' : 'Post comment'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
```

### CommentList

Renders a flat list of top-level comments, each with an inline reply form toggle and a nested reply list.

```typescript
// components/comments/CommentList.tsx
'use client'

import { useState } from 'react'
import { CommentForm } from './CommentForm'
import { formatDate } from '@/lib/utils'
import type { CommentWithReplies } from '@/types'

interface CommentListProps {
  comments: CommentWithReplies[]
  postId: string
  onReply: (comment: CommentWithReplies) => void
}

export function CommentList({ comments, postId, onReply }: CommentListProps) {
  return (
    <div className="space-y-8">
      {comments.map((comment) => (
        <CommentThread
          key={comment.id}
          comment={comment}
          postId={postId}
          onReply={onReply}
        />
      ))}
    </div>
  )
}

function CommentThread({
  comment,
  postId,
  onReply,
}: {
  comment: CommentWithReplies
  postId: string
  onReply: (comment: CommentWithReplies) => void
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)

  const handleReplySuccess = (newComment: CommentWithReplies) => {
    onReply(newComment)
    setShowReplyForm(false)
  }

  return (
    <div id={`comment-${comment.id}`} className="scroll-mt-24">
      {/* Comment bubble */}
      <div className="flex gap-3">
        {/* Avatar placeholder — initials */}
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
          {comment.authorName[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          <button
            type="button"
            onClick={() => setShowReplyForm((v) => !v)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        </div>
      </div>

      {/* Inline reply form */}
      {showReplyForm && (
        <div className="mt-4 ml-11 pl-4 border-l-2 border-muted">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onSuccess={handleReplySuccess}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 ml-11 space-y-4 pl-4 border-l-2 border-muted">
          {comment.replies.map((reply) => (
            <div key={reply.id} id={`comment-${reply.id}`} className="flex gap-3 scroll-mt-24">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                {reply.authorName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">{reply.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {reply.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 5. TypeScript Types

```typescript
// types/index.ts
import type { Comment } from '@prisma/client'

// Comment with its replies pre-loaded (used throughout the comment UI)
export type CommentWithReplies = Comment & {
  replies: Comment[]
}
```

---

## 6. Email Notification

### Reply Notification Email Template

```tsx
// emails/CommentReplyEmail.tsx
import {
  Html, Head, Body, Container,
  Text, Button, Preview, Hr,
} from '@react-email/components'

interface CommentReplyEmailProps {
  toName: string
  repliedByName: string
  replyContent: string
  postTitle: string
  postUrl: string
}

export function CommentReplyEmail({
  toName,
  repliedByName,
  replyContent,
  postTitle,
  postUrl,
}: CommentReplyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{repliedByName} replied to your comment on "{postTitle}"</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5' }}>
        <Container style={{ maxWidth: '520px', margin: '40px auto', backgroundColor: '#fff', borderRadius: '8px', padding: '40px' }}>
          <Text style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
            New reply to your comment
          </Text>
          <Text style={{ color: '#52525b', marginTop: 0 }}>
            Hi {toName}, <strong>{repliedByName}</strong> replied to your comment on{' '}
            <strong>"{postTitle}"</strong>.
          </Text>

          {/* Quoted reply content */}
          <div style={{ margin: '20px 0', padding: '16px', backgroundColor: '#f4f4f5', borderRadius: '6px', borderLeft: '3px solid #a1a1aa' }}>
            <Text style={{ margin: 0, color: '#3f3f46', fontSize: '14px', lineHeight: '1.6' }}>
              {replyContent.length > 300
                ? replyContent.slice(0, 300) + '...'
                : replyContent}
            </Text>
          </div>

          <Button
            href={postUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#18181b',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            View reply
          </Button>

          <Hr style={{ margin: '32px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>
            You're receiving this because you checked "Notify me when someone replies" on your comment.
            To stop receiving these emails, leave the checkbox unchecked on your next comment.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### Resend Helper

```typescript
// lib/resend.ts  (add to existing file)
import { CommentReplyEmail } from '@/emails/CommentReplyEmail'

export async function sendCommentReplyEmail({
  to,
  toName,
  repliedByName,
  replyContent,
  postTitle,
  postUrl,
}: {
  to: string
  toName: string
  repliedByName: string
  replyContent: string
  postTitle: string
  postUrl: string
}) {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `${repliedByName} replied to your comment on "${postTitle}"`,
    react: CommentReplyEmail({ toName, repliedByName, replyContent, postTitle, postUrl }),
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
```

---

## 7. Security Considerations

### Email privacy
- `authorEmail` is **never returned** in any API response or rendered in the UI — it is only used server-side for sending notifications.
- When fetching comments for display, always use `select` to explicitly exclude `authorEmail`:

```typescript
prisma.comment.findMany({
  select: {
    id: true,
    parentId: true,
    authorName: true,   // ✅ safe to expose
    // authorEmail: true  // ❌ never select this for public responses
    content: true,
    createdAt: true,
    status: true,
  },
})
```

### Rate limiting
- Add rate limiting on `POST /api/comments` to prevent spam.
- Recommended: use the `@upstash/ratelimit` package with a Redis store (Upstash free tier).
- Limit: **5 comments per IP per 10 minutes**.

```typescript
// Example rate limit check — add at the top of the POST handler
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'),
})

const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
const { success } = await ratelimit.limit(ip)
if (!success) {
  return Response.json({ error: 'Too many comments. Please wait a moment.' }, { status: 429 })
}
```

> **Note:** Upstash Redis requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env variables. If rate limiting is out of scope for the initial release, skip this and add it later.

### Input sanitization
- Comment `content` is stored as plain text and rendered with `whitespace-pre-wrap` — no HTML parsing, so XSS is not a concern with this approach.
- Do not render comment content as HTML or pass it through `dangerouslySetInnerHTML`.

---

## 8. Checklist

- [ ] Create `app/api/comments/route.ts` (POST)
- [ ] Create `app/api/comments/[id]/route.ts` (DELETE)
- [ ] Create `components/comments/CommentSection.tsx`
- [ ] Create `components/comments/CommentForm.tsx`
- [ ] Create `components/comments/CommentList.tsx`
- [ ] Add `CommentWithReplies` type to `types/index.ts`
- [ ] Create `emails/CommentReplyEmail.tsx`
- [ ] Add `sendCommentReplyEmail` to `lib/resend.ts`
- [ ] Verify: submitting a reply sends a notification email to the parent comment author
- [ ] Verify: no notification is sent when a user replies to their own comment (same email)
- [ ] Verify: `authorEmail` is never included in any API response body
- [ ] Verify: replies to replies return a 400 error
- [ ] Verify: comments on unpublished posts return 404
- [ ] (Optional) Add Upstash rate limiting — requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
