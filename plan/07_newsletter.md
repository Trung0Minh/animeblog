# 07 — Newsletter

## 1. Overview

The newsletter allows visitors to subscribe with their email and receive a notification whenever a new post is published. Subscribers can unsubscribe at any time via a one-click link in every email. Broadcasts are triggered manually by the admin from the admin panel — there is no automatic send on publish.

---

## 2. Flows

### 2.1 Subscribe Flow

```
Visitor fills in email in NewsletterForm (on homepage sidebar)
        │
        ▼
POST /api/newsletter/subscribe
        ├── Validate email
        ├── If email already ACTIVE → return "already subscribed" (200, not error)
        ├── If email previously UNSUBSCRIBED → set status back to ACTIVE
        └── If email new → create NewsletterSubscriber record
        │
        ▼
Send confirmation email via Resend
(no double opt-in required — single opt-in is sufficient for this use case)
        │
        ▼
Show success message in the form
```

### 2.2 Unsubscribe Flow

```
Subscriber clicks unsubscribe link in any newsletter email
Link format: /unsubscribe?token=[subscriber.token]
        │
        ▼
GET /unsubscribe?token=...  (Server Component)
        ├── Find subscriber by token
        ├── If not found → show "invalid link" message
        ├── If already UNSUBSCRIBED → show "already unsubscribed" message
        └── If ACTIVE → set status = UNSUBSCRIBED, set unsubscribedAt = now()
        │
        ▼
Show confirmation page: "You have been unsubscribed."
(no login, no confirmation dialog — one click is enough)
```

### 2.3 Broadcast Flow (Admin)

```
Admin navigates to /admin/newsletter
        │
        ▼
Fills in: Subject, preview text, selects a post to feature (optional)
OR writes a custom message body
        │
        ▼
Clicks "Send broadcast"
        │
        ▼
POST /api/newsletter/broadcast
        ├── Fetch all ACTIVE subscribers
        ├── For each subscriber, send email via Resend
        │       └── Each email contains a unique unsubscribe link using subscriber.token
        └── Return { sent: N } count
```

> **Note on batch sending:** Resend supports sending to up to 100 recipients per API call via the `to` array. For larger lists, send in batches of 50–100 with a small delay between batches to avoid rate limits. Implement this with a simple loop — no queue system needed at this scale.

---

## 3. API Routes

### POST /api/newsletter/subscribe

```typescript
// app/api/newsletter/subscribe/route.ts
import { prisma } from '@/lib/prisma'
import { sendSubscribeConfirmationEmail } from '@/lib/resend'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    })

    if (existing?.status === 'ACTIVE') {
      // Already subscribed — return success silently to avoid enumeration
      return Response.json(
        { data: { message: 'You are already subscribed.' } },
        { status: 200 }
      )
    }

    if (existing?.status === 'UNSUBSCRIBED') {
      // Re-subscribe: reset status and clear unsubscribedAt
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: 'ACTIVE', unsubscribedAt: null },
      })
    } else {
      // New subscriber
      await prisma.newsletterSubscriber.create({
        data: { email },
      })
    }

    // Send confirmation email — non-fatal if it fails
    await sendSubscribeConfirmationEmail({ to: email }).catch((err) => {
      console.error('[subscribe] Failed to send confirmation email:', err)
    })

    return Response.json(
      { data: { message: 'Subscribed successfully.' } },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/newsletter/subscribe]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

### POST /api/newsletter/unsubscribe

Handles unsubscribe via token. Also reachable via the `/unsubscribe` page which calls this endpoint server-side.

```typescript
// app/api/newsletter/unsubscribe/route.ts
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token } = schema.parse(body)

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { token },
    })

    if (!subscriber) {
      return Response.json({ error: 'Invalid unsubscribe link' }, { status: 404 })
    }

    if (subscriber.status === 'UNSUBSCRIBED') {
      return Response.json(
        { data: { message: 'You are already unsubscribed.' } },
        { status: 200 }
      )
    }

    await prisma.newsletterSubscriber.update({
      where: { token },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
      },
    })

    return Response.json({ data: { message: 'Unsubscribed successfully.' } })
  } catch (error) {
    console.error('[POST /api/newsletter/unsubscribe]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

### POST /api/newsletter/broadcast

Admin only. Sends an email to all active subscribers.

```typescript
// app/api/newsletter/broadcast/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNewsletterBroadcast } from '@/lib/resend'
import { z } from 'zod'

const schema = z.object({
  subject: z.string().min(1).max(200),
  previewText: z.string().max(200).optional(),
  // One of postId or customBody must be provided
  postId: z.string().optional(),
  customBody: z.string().optional(),
}).refine(
  (d) => d.postId || d.customBody,
  { message: 'Either postId or customBody must be provided' }
)

const BATCH_SIZE = 50

export async function POST(req: Request) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Fetch featured post if postId is provided
    let featuredPost: { title: string; slug: string; excerpt: string | null; coverUrl: string | null } | null = null
    if (data.postId) {
      featuredPost = await prisma.post.findUnique({
        where: { id: data.postId, status: 'PUBLISHED' },
        select: { title: true, slug: true, excerpt: true, coverUrl: true },
      })
      if (!featuredPost) {
        return Response.json({ error: 'Post not found or not published' }, { status: 404 })
      }
    }

    // Fetch all active subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { status: 'ACTIVE' },
      select: { email: true, token: true },
    })

    if (subscribers.length === 0) {
      return Response.json({ data: { sent: 0, message: 'No active subscribers' } })
    }

    // Send in batches to avoid Resend rate limits
    let sent = 0
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map((subscriber) =>
          sendNewsletterBroadcast({
            to: subscriber.email,
            subject: data.subject,
            previewText: data.previewText,
            featuredPost: featuredPost
              ? {
                  ...featuredPost,
                  url: `${process.env.NEXT_PUBLIC_APP_URL}/${featuredPost.slug}`,
                }
              : null,
            customBody: data.customBody,
            unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${subscriber.token}`,
          }).catch((err) => {
            // Log individual failures but continue sending to others
            console.error(`[broadcast] Failed to send to ${subscriber.email}:`, err)
          })
        )
      )

      sent += batch.length

      // Small delay between batches to avoid rate limit spikes
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    return Response.json({ data: { sent, total: subscribers.length } })
  } catch (error) {
    console.error('[POST /api/newsletter/broadcast]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

---

## 4. Pages

### /unsubscribe

Server Component — processes the unsubscribe action directly on page load.

```typescript
// app/(public)/unsubscribe/page.tsx
import { prisma } from '@/lib/prisma'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <UnsubscribeResult status="invalid" />
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { token },
  })

  if (!subscriber) {
    return <UnsubscribeResult status="invalid" />
  }

  if (subscriber.status === 'UNSUBSCRIBED') {
    return <UnsubscribeResult status="already" />
  }

  // Process unsubscribe
  await prisma.newsletterSubscriber.update({
    where: { token },
    data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
  })

  return <UnsubscribeResult status="success" />
}

function UnsubscribeResult({ status }: { status: 'success' | 'already' | 'invalid' }) {
  const messages = {
    success: {
      heading: "You've been unsubscribed",
      body: "You won't receive any more newsletter emails from us.",
    },
    already: {
      heading: 'Already unsubscribed',
      body: "This email address is not currently subscribed.",
    },
    invalid: {
      heading: 'Invalid link',
      body: "This unsubscribe link is not valid. It may have already been used.",
    },
  }

  const { heading, body } = messages[status]

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-2xl font-bold">{heading}</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">{body}</p>
      <a href="/" className="mt-6 text-sm text-primary hover:underline">
        ← Back to blog
      </a>
    </div>
  )
}
```

---

## 5. Frontend Components

### NewsletterForm

Shown in the homepage sidebar.

```typescript
// components/newsletter/NewsletterForm.tsx
'use client'

import { useState } from 'react'

type FormState = 'idle' | 'loading' | 'success' | 'error'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('loading')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const json = await res.json()

      if (!res.ok) throw new Error(json.error)

      setState('success')
      setMessage(json.data.message)
      setEmail('')
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (state === 'success') {
    return (
      <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
          ✓ {message}
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        Get notified when new posts are published.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        {state === 'error' && (
          <p className="text-xs text-destructive">{message}</p>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={state === 'loading'}
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="w-full py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
        >
          {state === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
    </div>
  )
}
```

---

## 6. Email Templates

### Subscription Confirmation Email

```tsx
// emails/SubscribeConfirmationEmail.tsx
import {
  Html, Head, Body, Container,
  Text, Button, Preview, Hr,
} from '@react-email/components'

interface Props {
  appName: string
  appUrl: string
}

export function SubscribeConfirmationEmail({ appName, appUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>You're now subscribed to {appName}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5' }}>
        <Container style={{ maxWidth: '520px', margin: '40px auto', backgroundColor: '#fff', borderRadius: '8px', padding: '40px' }}>
          <Text style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            You're subscribed! 🎉
          </Text>
          <Text style={{ color: '#52525b', lineHeight: '1.6' }}>
            Thanks for subscribing to <strong>{appName}</strong>. You'll receive an email
            whenever a new post is published.
          </Text>
          <Button
            href={appUrl}
            style={{
              display: 'inline-block',
              marginTop: '20px',
              backgroundColor: '#18181b',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Read the latest posts
          </Button>
          <Hr style={{ margin: '32px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>
            You can unsubscribe at any time by clicking the unsubscribe link in any newsletter email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### Newsletter Broadcast Email

```tsx
// emails/NewsletterEmail.tsx
import {
  Html, Head, Body, Container,
  Text, Button, Preview, Hr, Img,
} from '@react-email/components'

interface FeaturedPost {
  title: string
  excerpt: string | null
  coverUrl: string | null
  url: string
}

interface NewsletterEmailProps {
  subject: string
  previewText?: string
  featuredPost: FeaturedPost | null
  customBody?: string
  unsubscribeUrl: string
  appName: string
}

export function NewsletterEmail({
  subject,
  previewText,
  featuredPost,
  customBody,
  unsubscribeUrl,
  appName,
}: NewsletterEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText ?? subject}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5' }}>
        <Container style={{ maxWidth: '520px', margin: '40px auto', backgroundColor: '#fff', borderRadius: '8px', padding: '40px' }}>

          {/* Header */}
          <Text style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '24px' }}>
            {appName}
          </Text>

          <Text style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', marginTop: 0 }}>
            {subject}
          </Text>

          {/* Custom body text */}
          {customBody && (
            <Text style={{ color: '#3f3f46', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {customBody}
            </Text>
          )}

          {/* Featured post card */}
          {featuredPost && (
            <div style={{ marginTop: '24px', border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' }}>
              {featuredPost.coverUrl && (
                <Img
                  src={featuredPost.coverUrl}
                  alt={featuredPost.title}
                  width="100%"
                  style={{ display: 'block', width: '100%', maxHeight: '240px', objectFit: 'cover' }}
                />
              )}
              <div style={{ padding: '20px' }}>
                <Text style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px' }}>
                  {featuredPost.title}
                </Text>
                {featuredPost.excerpt && (
                  <Text style={{ color: '#52525b', fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px' }}>
                    {featuredPost.excerpt}
                  </Text>
                )}
                <Button
                  href={featuredPost.url}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#18181b',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Read post →
                </Button>
              </div>
            </div>
          )}

          <Hr style={{ margin: '32px 0', borderColor: '#e4e4e7' }} />

          <Text style={{ color: '#a1a1aa', fontSize: '12px', margin: 0 }}>
            You're receiving this because you subscribed to {appName}.{' '}
            <a href={unsubscribeUrl} style={{ color: '#a1a1aa' }}>Unsubscribe</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

---

## 7. Resend Helpers

```typescript
// lib/resend.ts  (add to existing file)
import { SubscribeConfirmationEmail } from '@/emails/SubscribeConfirmationEmail'
import { NewsletterEmail } from '@/emails/NewsletterEmail'

export async function sendSubscribeConfirmationEmail({ to }: { to: string }) {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `You're now subscribed to ${process.env.NEXT_PUBLIC_APP_NAME}`,
    react: SubscribeConfirmationEmail({
      appName: process.env.NEXT_PUBLIC_APP_NAME!,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    }),
  })
  if (error) throw new Error(`Resend error: ${error.message}`)
}

export async function sendNewsletterBroadcast({
  to,
  subject,
  previewText,
  featuredPost,
  customBody,
  unsubscribeUrl,
}: {
  to: string
  subject: string
  previewText?: string
  featuredPost: { title: string; excerpt: string | null; coverUrl: string | null; url: string } | null
  customBody?: string
  unsubscribeUrl: string
}) {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    react: NewsletterEmail({
      subject,
      previewText,
      featuredPost,
      customBody,
      unsubscribeUrl,
      appName: process.env.NEXT_PUBLIC_APP_NAME!,
    }),
  })
  if (error) throw new Error(`Resend error: ${error.message}`)
}
```

---

## 8. Checklist

- [ ] Create `app/api/newsletter/subscribe/route.ts`
- [ ] Create `app/api/newsletter/unsubscribe/route.ts`
- [ ] Create `app/api/newsletter/broadcast/route.ts`
- [ ] Create `app/(public)/unsubscribe/page.tsx`
- [ ] Create `components/newsletter/NewsletterForm.tsx`
- [ ] Create `emails/SubscribeConfirmationEmail.tsx`
- [ ] Create `emails/NewsletterEmail.tsx`
- [ ] Add `sendSubscribeConfirmationEmail` and `sendNewsletterBroadcast` to `lib/resend.ts`
- [ ] Add `NewsletterForm` to `Sidebar` component (see `08_ui_components.md`)
- [ ] Set env variable: `NEXT_PUBLIC_APP_NAME`
- [ ] Verify: subscribing with a new email creates a record and sends a confirmation email
- [ ] Verify: subscribing with an already-active email returns 200 without error
- [ ] Verify: subscribing with a previously unsubscribed email reactivates the record
- [ ] Verify: clicking the unsubscribe link in an email sets status to UNSUBSCRIBED
- [ ] Verify: the unsubscribe page handles invalid/already-used tokens gracefully
- [ ] Verify: broadcast sends to all ACTIVE subscribers and skips UNSUBSCRIBED ones
- [ ] Verify: each broadcast email contains a unique unsubscribe link (different tokens)
