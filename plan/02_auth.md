# 02 — Authentication & Invite Flow

## 1. Overview

Authentication is handled by **NextAuth.js v5 (Auth.js)**. There is no public registration — only admins can onboard new writers by sending invite links via email. Once a writer has an account, they log in using an **email magic link** (no password needed).

---

## 2. Auth Flows

### 2.1 Invite Flow (Admin → New Writer)

```
Admin navigates to /admin/writers
        │
        ▼
Admin enters the target email address
        │
        ▼
POST /api/invite
        ├── Validate: email not already registered
        ├── Validate: no pending invite exists for this email
        ├── Create Invite record { email, token, expiresAt: now + 7 days, status: PENDING }
        └── Send invite email via Resend: link = /invite/[token]
        │
        ▼
Writer receives email → clicks /invite/[token]
        │
        ▼
GET /invite/[token]  (Server Component)
        ├── Look up invite by token
        ├── If expired or not PENDING → redirect to /login?error=invite-invalid
        └── If valid → render InviteForm (email pre-filled, read-only)
        │
        ▼
Writer fills in: Display Name, Username
        │
        ▼
POST /api/invite/accept
        ├── Validate token still PENDING and not expired
        ├── Validate username is unique and matches format rules
        ├── Create User { email, name, username, role: WRITER }
        ├── Update Invite.status = ACCEPTED
        └── Return 201 → client calls signIn() → redirect to /dashboard
```

### 2.2 Login Flow (Returning Writer / Admin)

```
Navigate to /login
        │
        ▼
Enter email address → click "Send login link"
        │
        ▼
POST /api/auth/signin  (NextAuth Resend provider)
        ├── NextAuth checks: does a User exist with this email?
        ├── No  → return error (handled in signIn callback)
        └── Yes → send magic link email via Resend
        │
        ▼
Writer clicks magic link in email
        │
        ▼
NextAuth verifies token → creates Session record in DB
        │
        ▼
Redirect based on role:
        ├── WRITER → /dashboard
        └── ADMIN  → /admin
```

---

## 3. NextAuth Configuration

```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Resend from 'next-auth/providers/resend'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL,
    }),
  ],

  // Store sessions in the database (not JWT)
  // Safer for invite-only systems — sessions can be revoked server-side
  session: {
    strategy: 'database',
  },

  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/login?verify=1',  // Shown after magic link is sent
  },

  callbacks: {
    // Block sign-in attempts from emails that don't have an account yet.
    // This prevents anyone who discovers the magic link endpoint from getting in.
    async signIn({ user }) {
      if (!user.email) return false
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      })
      return !!existing
    },

    // Attach role, username, and avatarUrl to the session object.
    // Without this, session.user only contains id, name, email.
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, username: true, avatarUrl: true },
      })
      if (dbUser) {
        session.user.role = dbUser.role
        session.user.username = dbUser.username
        session.user.avatarUrl = dbUser.avatarUrl ?? null
      }
      return session
    },
  },
})
```

### Extend NextAuth Session Types

```typescript
// types/next-auth.d.ts
import type { Role } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: Role
    username?: string
    avatarUrl?: string | null
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: Role
      username: string
      avatarUrl?: string | null
    }
  }
}
```

### App Router Handler

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

---

## 4. Proxy — Route Protection

```typescript
// proxy.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isWriterRoute = pathname.startsWith('/dashboard')
  const isAdminRoute = pathname.startsWith('/admin')

  // Not logged in → redirect to /login
  if ((isWriterRoute || isAdminRoute) && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logged in but not admin → redirect to homepage
  if (isAdminRoute && session?.user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Only run proxy on these paths — skip static files and API routes
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
```

---

## 5. API Routes

### POST /api/invite

Creates a new invite link. Admin only.

```typescript
// app/api/invite/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendInviteEmail } from '@/lib/resend'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    // Check: already has an account
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (existingUser) {
      return Response.json({ error: 'This email already has an account' }, { status: 400 })
    }

    // Check: already has a pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: { email, status: 'PENDING' },
    })
    if (existingInvite) {
      return Response.json({ error: 'A pending invite already exists for this email' }, { status: 400 })
    }

    // Create invite (token auto-generated via cuid default)
    const invite = await prisma.invite.create({
      data: {
        email,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdById: session.user.id,
      },
    })

    await sendInviteEmail({
      to: email,
      inviteToken: invite.token,
      invitedByName: session.user.name,
    })

    return Response.json(
      { data: { message: 'Invite sent successfully' } },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/invite]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

### POST /api/invite/accept

Writer submits account creation form after clicking the invite link.

```typescript
// app/api/invite/accept/route.ts
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1),
  name: z.string().min(2).max(50).trim(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-z0-9_-]+$/,
      'Username may only contain lowercase letters, numbers, hyphens, and underscores'
    ),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, name, username } = schema.parse(body)

    // Validate invite
    const invite = await prisma.invite.findUnique({ where: { token } })

    if (!invite) {
      return Response.json({ error: 'Invalid invite link' }, { status: 400 })
    }
    if (invite.status !== 'PENDING') {
      return Response.json({ error: 'This invite has already been used' }, { status: 400 })
    }
    if (invite.expiresAt < new Date()) {
      // Mark expired so it doesn't clutter the pending list
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      })
      return Response.json({ error: 'This invite link has expired' }, { status: 400 })
    }

    // Validate username uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })
    if (existingUsername) {
      return Response.json({ error: 'Username is already taken' }, { status: 400 })
    }

    // Create user and mark invite accepted — do both in a transaction
    await prisma.$transaction([
      prisma.user.create({
        data: {
          email: invite.email,
          name,
          username,
          role: 'WRITER',
        },
      }),
      prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      }),
    ])

    return Response.json(
      { data: { message: 'Account created successfully' } },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/invite/accept]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

---

## 6. Pages

### /login

```typescript
// app/(auth)/login/page.tsx
'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  const isVerify = searchParams.get('verify') === '1'
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await signIn('resend', { email, callbackUrl, redirect: false })
    setLoading(false)
  }

  if (isVerify) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
        <p className="text-muted-foreground">
          A login link has been sent to your email address.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Writer Login</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your email to receive a login link.
          </p>
        </div>

        {error === 'invite-invalid' && (
          <p className="text-sm text-destructive">
            This invite link is invalid or has expired.
          </p>
        )}

        {/* Generic NextAuth errors (e.g. email not found) */}
        {error && error !== 'invite-invalid' && (
          <p className="text-sm text-destructive">
            This email is not registered. Contact an admin to get an invite.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send login link'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### /invite/[token]

```typescript
// app/(auth)/invite/[token]/page.tsx
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { InviteForm } from '@/components/auth/InviteForm'

interface Props {
  params: Promise<{ token: string }>
}

// Server Component — validates token before rendering the form
export default async function InvitePage({ params }: Props) {
  const { token } = await params

  const invite = await prisma.invite.findUnique({
    where: { token },
    select: { email: true, status: true, expiresAt: true },
  })

  const isValid =
    invite &&
    invite.status === 'PENDING' &&
    invite.expiresAt > new Date()

  if (!isValid) {
    redirect('/login?error=invite-invalid')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">
            You've been invited to write on Anime Blog.
          </p>
        </div>
        <InviteForm token={token} email={invite.email} />
      </div>
    </div>
  )
}
```

### InviteForm Client Component

```typescript
// components/auth/InviteForm.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface InviteFormProps {
  token: string
  email: string
}

export function InviteForm({ token, email }: InviteFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, username }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Something went wrong')
        return
      }

      // Account created — trigger magic link sign-in automatically
      await signIn('resend', { email, callbackUrl: '/dashboard', redirect: true })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-muted text-muted-foreground"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Display Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name or pen name"
          required
          minLength={2}
          maxLength={50}
          className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Username</label>
        <p className="text-xs text-muted-foreground mb-1">
          Used in your public profile URL: /authors/[username]
        </p>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="e.g. sakuga_fan"
          required
          minLength={3}
          maxLength={30}
          pattern="^[a-z0-9_-]+$"
          className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}
```

---

## 7. Email Templates

### Invite Email

```tsx
// emails/InviteEmail.tsx
import {
  Html, Head, Body, Container,
  Text, Button, Preview, Hr,
} from '@react-email/components'

interface InviteEmailProps {
  invitedByName: string
  inviteUrl: string
}

export function InviteEmail({ invitedByName, inviteUrl }: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to write on Anime Blog</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5' }}>
        <Container style={{ maxWidth: '520px', margin: '40px auto', backgroundColor: '#fff', borderRadius: '8px', padding: '40px' }}>
          <Text style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            You're invited ✉️
          </Text>
          <Text style={{ color: '#52525b', lineHeight: '1.6' }}>
            <strong>{invitedByName}</strong> has invited you to become a writer on Anime Blog.
            Click the button below to create your account.
          </Text>
          <Button
            href={inviteUrl}
            style={{
              display: 'inline-block',
              marginTop: '24px',
              backgroundColor: '#18181b',
              color: '#fff',
              padding: '12px 28px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Accept invitation
          </Button>
          <Hr style={{ margin: '32px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>
            This link expires in 7 days. If you didn't expect this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

---

## 8. Resend Helper

```typescript
// lib/resend.ts
import { Resend } from 'resend'
import { InviteEmail } from '@/emails/InviteEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteEmail({
  to,
  inviteToken,
  invitedByName,
}: {
  to: string
  inviteToken: string
  invitedByName: string
}) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteToken}`

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `${invitedByName} invited you to write on Anime Blog`,
    react: InviteEmail({ invitedByName, inviteUrl }),
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
```

---

## 9. Checklist

- [ ] Install packages: `npm install next-auth@beta @auth/prisma-adapter resend @react-email/components zod`
- [ ] Create `lib/auth.ts` with NextAuth config
- [ ] Create `types/next-auth.d.ts` to extend session types
- [ ] Create `app/api/auth/[...nextauth]/route.ts` exporting `handlers`
- [ ] Create `proxy.ts` with route protection logic
- [ ] Create `POST /api/invite/route.ts`
- [ ] Create `POST /api/invite/accept/route.ts`
- [ ] Create `app/(auth)/login/page.tsx`
- [ ] Create `app/(auth)/invite/[token]/page.tsx` (Server Component)
- [ ] Create `components/auth/InviteForm.tsx` (Client Component)
- [ ] Create `emails/InviteEmail.tsx`
- [ ] Create `lib/resend.ts` with `sendInviteEmail` helper
- [ ] Set all required env variables: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- [ ] Test full invite flow end-to-end: send invite → receive email → create account → login → reach dashboard
- [ ] Test that unregistered emails cannot sign in via the magic link endpoint
