# 14 — Writer Profile

## 1. Overview

Each writer has a public profile page at `/authors/[username]` (implemented in `04_posts.md`). This file covers the **edit profile** feature — a private page at `/dashboard/profile` where writers can update their own display name, bio, and avatar. Username and email cannot be changed (username is part of the public URL; email is tied to auth).

---

## 2. Flow

```
Writer navigates to /dashboard/profile
        │
        ▼
Sees current: avatar, display name, bio
(username and email shown as read-only)
        │
        ▼
Updates any field → clicks "Save changes"
        │
        ▼
PATCH /api/profile
        ├── Validate inputs
        ├── If new avatar file uploaded → upload to R2 under /avatars/
        ├── Update User record
        └── Return updated user
        │
        ▼
Show success message
Page reflects new data immediately
```

---

## 3. API Route

### PATCH /api/profile

Updates the currently authenticated writer's own profile. Writers can only update their own profile — not other writers'.

```typescript
// app/api/profile/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(50).trim(),
  bio: z.string().max(500).trim().optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        bio: data.bio ?? null,
        avatarUrl: data.avatarUrl ?? null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        email: true,
      },
    })

    return Response.json({ data: user })
  } catch (error) {
    console.error('[PATCH /api/profile]', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

---

## 4. Pages

### /dashboard/profile

```typescript
// app/(writer)/dashboard/profile/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/profile/ProfileForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Profile',
  robots: { index: false, follow: false },
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      email: true,
      bio: true,
      avatarUrl: true,
    },
  })

  if (!user) redirect('/login')

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-8">Edit Profile</h1>
      <ProfileForm user={user} />
    </div>
  )
}
```

---

## 5. Components

### ProfileForm

```typescript
// components/profile/ProfileForm.tsx
'use client'

import { useState } from 'react'
import { AvatarUpload } from './AvatarUpload'

interface ProfileFormProps {
  user: {
    name: string
    username: string
    email: string
    bio: string | null
    avatarUrl: string | null
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bio: bio || undefined,
          avatarUrl: avatarUrl || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Something went wrong',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-destructive/10 text-destructive border border-destructive/20'
        }`}>
          {message.text}
        </div>
      )}

      {/* Avatar */}
      <div>
        <label className="text-sm font-medium block mb-2">Avatar</label>
        <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} name={name} />
      </div>

      {/* Display name */}
      <div>
        <label className="text-sm font-medium">
          Display Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="text-sm font-medium">
          Bio <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Tell readers a little about yourself..."
          className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
        />
        <p className="mt-0.5 text-xs text-muted-foreground text-right">
          {bio.length}/500
        </p>
      </div>

      {/* Read-only fields */}
      <div className="space-y-4 pt-2 border-t">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Username</label>
          <p className="mt-1 text-sm px-3 py-2 border rounded-md bg-muted text-muted-foreground">
            @{user.username}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Username cannot be changed — it is part of your public profile URL.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <p className="mt-1 text-sm px-3 py-2 border rounded-md bg-muted text-muted-foreground">
            {user.email}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Email cannot be changed — contact an admin if needed.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
```

### AvatarUpload

```typescript
// components/profile/AvatarUpload.tsx
'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'

interface AvatarUploadProps {
  value: string        // Current avatar URL (empty string = no avatar)
  onChange: (url: string) => void
  name: string         // Used to generate initials fallback
}

export function AvatarUpload({ value, onChange, name }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'avatars')

      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      onChange(json.data.url)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar preview */}
      <div className="relative group w-16 h-16 shrink-0">
        {value ? (
          <img
            src={value}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
            {initials}
          </div>
        )}

        {/* Overlay: upload button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
        >
          {uploading
            ? <Loader2 size={18} className="text-white animate-spin" />
            : <Camera size={18} className="text-white" />
          }
        </button>
      </div>

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload new avatar'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <X size={12} />
            Remove avatar
          </button>
        )}
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP · Max 10MB · Shown as circle
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
```

---

## 6. Navbar — Profile Link for Writers

Add a profile dropdown to the Navbar when a writer is logged in. This is only visible on writer/dashboard pages, or can be shown site-wide for logged-in users.

```typescript
// components/layout/WriterMenu.tsx
'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { User, FileText, LogOut, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function WriterMenu() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!session) return null

  const avatarUrl = session.user.avatarUrl
  const name = session.user.name ?? ''
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
        )}
        <ChevronDown size={13} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-background border rounded-md shadow-md z-50 py-1">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <FileText size={14} />
            My posts
          </Link>
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <User size={14} />
            Edit profile
          </Link>
          <div className="border-t my-1" />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
```

Add `WriterMenu` to `Navbar` — render it on the right side when user is logged in, replacing or alongside `ThemeToggle`:

```typescript
// In Navbar.tsx, right side:
import { WriterMenu } from './WriterMenu'

// ...
<div className="flex items-center gap-2">
  <div className="hidden md:block">
    <SearchBar />
  </div>
  <ThemeToggle />
  <WriterMenu />       {/* Only renders when session exists */}
  <MobileNav links={NAV_LINKS} />
</div>
```

---

## 7. Dashboard Layout — Profile Link in Sidebar

Add a quick link to edit profile in the writer dashboard navigation.

```typescript
// app/(writer)/dashboard/layout.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Simple dashboard nav */}
      <nav className="flex items-center gap-4 mb-8 pb-4 border-b text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          My posts
        </Link>
        <Link
          href="/dashboard/profile"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Edit profile
        </Link>
        <Link
          href={`/authors/${session.user.username}`}
          target="_blank"
          className="text-muted-foreground hover:text-foreground transition-colors ml-auto text-xs"
        >
          View public profile →
        </Link>
      </nav>
      {children}
    </div>
  )
}
```

---

## 8. Checklist

- [ ] Create `PATCH /api/profile/route.ts`
- [ ] Create `app/(writer)/dashboard/profile/page.tsx`
- [ ] Create `app/(writer)/dashboard/layout.tsx` with dashboard nav
- [ ] Create `components/profile/ProfileForm.tsx`
- [ ] Create `components/profile/AvatarUpload.tsx`
- [ ] Create `components/layout/WriterMenu.tsx`
- [ ] Add `WriterMenu` to `Navbar`
- [ ] Verify: writer can update display name and see it reflected on their public profile page
- [ ] Verify: writer can upload a new avatar — it appears in the Navbar dropdown and public profile
- [ ] Verify: writer can remove their avatar — initials fallback is shown
- [ ] Verify: username and email fields are read-only and cannot be submitted to the API
- [ ] Verify: writer cannot update another writer's profile (API uses `session.user.id`, not a param)
