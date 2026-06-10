# 08 — UI Components & Layout

## 1. Overview

The blog UI follows a clean, content-focused aesthetic inspired by `blog.sakugabooru.com`. The layout has three main contexts:

- **Homepage / listing pages** — two-column layout: main content area (post list) + sidebar
- **Post detail page** — single centered column, max-width constrained, no sidebar
- **Dashboard / Admin pages** — full-width with a simple top nav, no sidebar

Global UI features:
- **Dark / Light mode** toggle, respects OS preference on first load
- **Sticky Navbar** with logo, navigation links, and search bar
- **sans-serif typography** throughout (Inter font)
- Consistent spacing, border-radius, and color tokens via Tailwind + shadcn/ui

---

## 2. shadcn/ui Setup

Initialize shadcn/ui first before building any components:

```bash
npx shadcn-ui@latest init
```

Configuration choices during init:
- Style: **Default**
- Base color: **Zinc**
- CSS variables: **Yes**
- Tailwind config: **Yes**
- Components directory: `components/ui`

Then install the specific components used throughout the project:

```bash
npx shadcn-ui@latest add button input textarea badge separator sheet dropdown-menu
```

---

## 3. Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],   // Dark mode via class on <html>
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './emails/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            // Override prose defaults to match the blog's color tokens
            '--tw-prose-body': 'hsl(var(--foreground))',
            '--tw-prose-headings': 'hsl(var(--foreground))',
            '--tw-prose-links': 'hsl(var(--primary))',
            '--tw-prose-code': 'hsl(var(--foreground))',
            '--tw-prose-quotes': 'hsl(var(--muted-foreground))',
            '--tw-prose-hr': 'hsl(var(--border))',
            maxWidth: 'none',   // Controlled by the container, not prose itself
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
```

Install:
```bash
npm install @tailwindcss/typography
```

---

## 4. Root Layout

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    default: process.env.NEXT_PUBLIC_APP_NAME ?? 'Anime Blog',
  },
  description: 'In-depth anime analysis and reviews.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## 5. ThemeProvider

```typescript
// components/layout/ThemeProvider.tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

Install:
```bash
npm install next-themes
```

---

## 6. Navbar

The Navbar is sticky, full-width, and contains:
- **Left**: Blog logo / name (links to `/`)
- **Center**: Navigation links (Contributors, About, and any custom links set by admin)
- **Right**: SearchBar + ThemeToggle

```typescript
// components/layout/Navbar.tsx
import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import { ThemeToggle } from './ThemeToggle'
import { MobileNav } from './MobileNav'

// Static nav links — can be made dynamic later from DB/config
const NAV_LINKS = [
  { label: 'Contributors', href: '/contributors' },
  { label: 'About', href: '/about' },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-lg shrink-0 hover:text-primary transition-colors"
        >
          {process.env.NEXT_PUBLIC_APP_NAME ?? 'Anime Blog'}
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search — hidden on mobile, shown on md+ */}
          <div className="hidden md:block">
            <SearchBar />
          </div>
          <ThemeToggle />
          {/* Mobile nav toggle — visible on mobile only */}
          <MobileNav links={NAV_LINKS} />
        </div>

      </div>
    </header>
  )
}
```

---

## 7. ThemeToggle

```typescript
// components/layout/ThemeToggle.tsx
'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // Avoid hydration mismatch — only render after mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="w-8 h-8" />  // Placeholder to prevent layout shift
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
```

---

## 8. MobileNav

Slide-out drawer for mobile navigation (uses shadcn/ui Sheet component).

```typescript
// components/layout/MobileNav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Search } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

interface MobileNavProps {
  links: { label: string; href: string }[]
}

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 pt-10">
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile search */}
        <div className="mt-6 px-1">
          <Link
            href="/search"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground rounded-md hover:bg-muted transition-colors"
          >
            <Search size={15} />
            Search posts...
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

---

## 9. Sidebar

The sidebar appears on the homepage and listing pages (category, tag, author). It contains:
- **Newsletter subscribe form**
- **Categories** with sub-category tree
- **Recent posts** list

```typescript
// components/layout/Sidebar.tsx
import Link from 'next/link'
import { NewsletterForm } from '@/components/newsletter/NewsletterForm'
import { formatDate } from '@/lib/utils'

interface SidebarProps {
  categories: {
    id: string
    name: string
    slug: string
    _count: { posts: number }
    children: { id: string; name: string; slug: string }[]
  }[]
  recentPosts: {
    title: string
    slug: string
    publishedAt: Date | null
  }[]
}

export function Sidebar({ categories, recentPosts }: SidebarProps) {
  return (
    <aside className="hidden lg:block w-64 xl:w-72 shrink-0 space-y-8">

      {/* Newsletter */}
      <SidebarSection title="Newsletter">
        <NewsletterForm />
      </SidebarSection>

      {/* Categories */}
      {categories.length > 0 && (
        <SidebarSection title="Categories">
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/category/${cat.slug}`}
                  className="flex items-center justify-between text-sm py-1 hover:text-primary transition-colors"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat._count.posts}</span>
                </Link>
                {/* Sub-categories */}
                {cat.children.length > 0 && (
                  <ul className="mt-1 ml-3 space-y-1 border-l pl-3">
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/category/${child.slug}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5 block"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </SidebarSection>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <SidebarSection title="Recent Posts">
          <ul className="space-y-3">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/${post.slug}`}
                  className="text-sm hover:text-primary transition-colors line-clamp-2 leading-snug"
                >
                  {post.title}
                </Link>
                {post.publishedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(post.publishedAt)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </SidebarSection>
      )}

    </aside>
  )
}

function SidebarSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h3>
      {children}
    </div>
  )
}
```

---

## 10. Footer

```typescript
// components/layout/Footer.tsx
import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Anime Blog'

  return (
    <footer className="border-t mt-16">
      <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>© {year} {appName}</p>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link href="/contributors" className="hover:text-foreground transition-colors">Contributors</Link>
        </div>
      </div>
    </footer>
  )
}
```

---

## 11. Global CSS

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --ring: 240 10% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Smooth scroll for TOC anchor links */
  html {
    scroll-behavior: smooth;
  }

  /* Custom scrollbar — subtle, matches dark/light mode */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-border rounded-full;
  }
}

/* Post cover image hover effect (applied in PostCard) */
@layer components {
  .cover-zoom {
    @apply overflow-hidden;
  }
  .cover-zoom img {
    @apply transition-transform duration-300;
  }
  .cover-zoom:hover img {
    @apply scale-[1.02];
  }
}
```

---

## 12. Contributors Page

A simple static-like page that lists all writers. Data is fetched server-side.

```typescript
// app/(public)/contributors/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contributors' }

export default async function ContributorsPage() {
  const writers = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      _count: {
        select: { posts: { where: { status: 'PUBLISHED' } } },
      },
    },
  })

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Contributors</h1>
      <p className="text-muted-foreground mb-10">
        The writers behind {process.env.NEXT_PUBLIC_APP_NAME}.
      </p>

      <div className="space-y-8">
        {writers.map((writer) => (
          <div key={writer.username} className="flex items-start gap-4">
            {writer.avatarUrl ? (
              <img
                src={writer.avatarUrl}
                alt={writer.name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg shrink-0">
                {writer.name[0]}
              </div>
            )}
            <div>
              <Link
                href={`/authors/${writer.username}`}
                className="font-semibold hover:text-primary transition-colors"
              >
                {writer.name}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                @{writer.username} · {writer._count.posts} post{writer._count.posts !== 1 ? 's' : ''}
              </p>
              {writer.bio && (
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {writer.bio}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 13. PostHeader Component

Shown at the top of every post detail page. Displays the cover image, title, category, author row, and tags.

```typescript
// components/posts/PostHeader.tsx
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface PostHeaderProps {
  post: {
    title: string
    coverUrl: string | null
    coverAlt: string | null
    publishedAt: Date | null
    author: { name: string; username: string; avatarUrl: string | null }
    coAuthors: { user: { name: string; username: string; avatarUrl: string | null } }[]
    category: { name: string; slug: string } | null
    tags: { tag: { name: string; slug: string } }[]
  }
}

export function PostHeader({ post }: PostHeaderProps) {
  const allAuthors = [post.author, ...post.coAuthors.map((ca) => ca.user)]

  return (
    <header>
      {/* Category */}
      {post.category && (
        <Link
          href={`/category/${post.category.slug}`}
          className="text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
        >
          {post.category.name}
        </Link>
      )}

      {/* Title */}
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
        {post.title}
      </h1>

      {/* Author row */}
      <div className="mt-4 flex items-center gap-3">
        {/* Author avatars */}
        <div className="flex -space-x-2">
          {allAuthors.map((a) =>
            a.avatarUrl ? (
              <img
                key={a.username}
                src={a.avatarUrl}
                alt={a.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <div
                key={a.username}
                className="w-8 h-8 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-xs font-semibold"
              >
                {a.name[0]}
              </div>
            )
          )}
        </div>

        <div className="text-sm">
          <span>
            {allAuthors.map((a, i) => (
              <span key={a.username}>
                {i > 0 && (i === allAuthors.length - 1 ? ' & ' : ', ')}
                <Link
                  href={`/authors/${a.username}`}
                  className="font-medium hover:text-primary transition-colors"
                >
                  {a.name}
                </Link>
              </span>
            ))}
          </span>
          {post.publishedAt && (
            <span className="text-muted-foreground">
              {' · '}
              {formatDate(post.publishedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Cover image */}
      {post.coverUrl && (
        <div className="mt-6 relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
          <img
            src={post.coverUrl}
            alt={post.coverAlt ?? post.title}
            className="w-full h-full object-cover"
            priority={true as any}
          />
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map(({ tag }) => (
            <Link
              key={tag.slug}
              href={`/tag/${tag.slug}`}
              className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-muted/70 transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
```

---

## 14. CoverImageUpload Component

Used in `PostEditor` to upload the post cover image.

```typescript
// components/posts/CoverImageUpload.tsx
'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'

interface CoverImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export function CoverImageUpload({ value, onChange }: CoverImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'covers')

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
    <div className="mb-6">
      {value ? (
        <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-muted">
          <img src={value} alt="Cover" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors disabled:opacity-50"
        >
          {uploading
            ? <Loader2 size={20} className="animate-spin" />
            : <ImagePlus size={20} />
          }
          <span className="text-sm">
            {uploading ? 'Uploading...' : 'Add cover image'}
          </span>
          <span className="text-xs opacity-70">JPG, PNG, GIF, WebP · Max 10MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
```

---

## 15. Checklist

- [ ] Install packages: `next-themes`, `@tailwindcss/typography`, `lucide-react`
- [ ] Run `npx shadcn-ui@latest init` and install components listed in section 2
- [ ] Configure `tailwind.config.ts` with typography plugin and font family
- [ ] Create `app/globals.css` with CSS variables for light/dark mode
- [ ] Create `app/layout.tsx` with Inter font, ThemeProvider, Navbar, Footer
- [ ] Create `components/layout/ThemeProvider.tsx`
- [ ] Create `components/layout/Navbar.tsx`
- [ ] Create `components/layout/ThemeToggle.tsx`
- [ ] Create `components/layout/MobileNav.tsx`
- [ ] Create `components/layout/Sidebar.tsx`
- [ ] Create `components/layout/Footer.tsx`
- [ ] Create `components/posts/PostHeader.tsx`
- [ ] Create `components/posts/CoverImageUpload.tsx`
- [ ] Create `app/(public)/contributors/page.tsx`
- [ ] Verify dark mode toggle works and persists across page reloads
- [ ] Verify OS-level dark mode preference is respected on first load
- [ ] Verify Navbar is sticky and does not overlap content
- [ ] Verify Sidebar is hidden on mobile (lg: breakpoint) and shown on desktop
- [ ] Verify MobileNav opens as a slide-out drawer on small screens
- [ ] Verify Inter font loads with Vietnamese subset (for Vietnamese content)
- [ ] Verify cover image aspect ratio stays 16:9 across all screen sizes
