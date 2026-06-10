# 00 — Project Overview & Architecture

## 1. Project Description

A community blog platform for publishing anime analysis and review articles. Inspired by `blog.sakugabooru.com`, but with modern features: block editor, dark/light mode, full-text search, guest comments with email notifications, newsletter, and automated CI/CD deployment.

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend + Backend | Next.js 16 + React 19 (App Router) | SSR for SEO, integrated Route Handlers, single repo |
| Language | TypeScript (everywhere) | Type-safe end-to-end, easier to maintain |
| ORM | Prisma | Type-safe queries, clear migrations, schema as source of truth |
| Database | PostgreSQL (Supabase) | Built-in full-text search, generous free tier |
| File Storage | Cloudflare R2 | Free 10GB, zero egress fee, S3-compatible API |
| Auth | NextAuth.js v5 (Auth.js) | Invite flow, magic link, session management |
| Editor | Tiptap | Most extensible block editor for React |
| Email | Resend + React Email | Free 3k/month, simple API, beautiful templates |
| Styling | Tailwind CSS + shadcn/ui | Built-in dark mode, non-locked-in components |
| Deploy | Vercel + Supabase | Auto-deploy from GitHub, zero config |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    GitHub Repo                       │
│           (git push → auto deploy Vercel)            │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                 Vercel (Next.js 16)                  │
│                                                      │
│  ┌──────────────────┐    ┌────────────────────────┐ │
│  │   App Router      │    │      API Routes         │ │
│  │  (RSC + Pages)    │    │  /api/posts             │ │
│  │                  │    │  /api/comments          │ │
│  │  / (homepage)    │    │  /api/auth              │ │
│  │  /[slug]         │    │  /api/upload            │ │
│  │  /authors/[id]   │    │  /api/newsletter        │ │
│  │  /admin/*        │    │  /api/search            │ │
│  └──────────────────┘    └────────────────────────┘ │
└──────────┬───────────────────────┬──────────────────┘
           │                       │
           ▼                       ▼
┌─────────────────────┐  ┌──────────────────────────┐
│ Supabase            │  │ Cloudflare R2             │
│ (PostgreSQL)        │  │ (File Storage)            │
│                     │  │                           │
│ - posts             │  │ /covers/                  │
│ - users             │  │ /content-images/          │
│ - comments          │  │ /avatars/                 │
│ - tags              │  │                           │
│ - categories        │  └──────────────────────────┘
│ - newsletters       │
│ Full-text index     │  ┌──────────────────────────┐
└─────────────────────┘  │ Resend                    │
                         │ (Transactional Email)     │
                         │                           │
                         │ - Writer invite           │
                         │ - Comment notification    │
                         │ - Newsletter broadcast    │
                         └──────────────────────────┘
```

---

## 4. Project Directory Structure

```
animeblog/
├── app/                            # Next.js App Router
│   ├── (public)/                   # Route group: public pages
│   │   ├── page.tsx                # Homepage
│   │   ├── [slug]/
│   │   │   └── page.tsx            # Post detail page
│   │   ├── authors/
│   │   │   └── [username]/
│   │   │       └── page.tsx        # Writer profile page
│   │   ├── category/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Category listing
│   │   └── tag/
│   │       └── [slug]/
│   │           └── page.tsx        # Tag listing
│   │
│   ├── (auth)/                     # Route group: auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── invite/
│   │       └── [token]/
│   │           └── page.tsx        # Accept invite, create account
│   │
│   ├── (writer)/                   # Route group: writer dashboard
│   │   └── dashboard/
│   │       ├── page.tsx            # Writer's post list
│   │       ├── new/
│   │       │   └── page.tsx        # Create new post
│   │       └── edit/
│   │           └── [id]/
│   │               └── page.tsx    # Edit post
│   │
│   ├── (admin)/                    # Route group: admin panel
│   │   └── admin/
│   │       ├── page.tsx            # Admin dashboard
│   │       ├── posts/
│   │       │   └── page.tsx        # Manage all posts
│   │       ├── writers/
│   │       │   └── page.tsx        # Manage writers, send invites
│   │       ├── comments/
│   │       │   └── page.tsx        # Moderate comments
│   │       └── newsletter/
│   │           └── page.tsx        # Manage newsletter broadcasts
│   │
│   ├── api/                        # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── posts/
│   │   │   ├── route.ts            # GET list, POST create
│   │   │   └── [id]/
│   │   │       └── route.ts        # GET one, PATCH, DELETE
│   │   ├── comments/
│   │   │   ├── route.ts            # POST create comment
│   │   │   └── [id]/
│   │   │       └── route.ts        # DELETE (admin only)
│   │   ├── upload/
│   │   │   └── route.ts            # Upload image/GIF to R2
│   │   ├── search/
│   │   │   └── route.ts            # Full-text search
│   │   ├── newsletter/
│   │   │   ├── subscribe/
│   │   │   │   └── route.ts
│   │   │   └── unsubscribe/
│   │   │       └── route.ts
│   │   └── invite/
│   │       ├── route.ts            # Admin creates invite link
│   │       └── accept/
│   │           └── route.ts        # Writer accepts invite
│   │
│   ├── layout.tsx                  # Root layout
│   └── globals.css
│
├── components/
│   ├── ui/                         # shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── ThemeToggle.tsx
│   ├── posts/
│   │   ├── PostCard.tsx            # Post card on homepage
│   │   ├── PostList.tsx            # List + pagination
│   │   ├── PostHeader.tsx          # Cover + title + meta
│   │   ├── PostBody.tsx            # Render Tiptap JSON content
│   │   ├── TableOfContents.tsx     # Auto-generated TOC
│   │   └── SpoilerBlock.tsx        # Spoiler reveal component
│   ├── editor/
│   │   ├── TiptapEditor.tsx        # Main block editor
│   │   ├── EditorToolbar.tsx
│   │   ├── MediaUpload.tsx         # Upload image/GIF
│   │   ├── VideoEmbed.tsx          # Embed video from URL
│   │   └── extensions/             # Custom Tiptap extensions
│   │       ├── SpoilerExtension.ts
│   │       ├── CaptionExtension.ts
│   │       └── VideoEmbedExtension.ts
│   ├── comments/
│   │   ├── CommentSection.tsx
│   │   ├── CommentForm.tsx
│   │   └── CommentList.tsx
│   ├── search/
│   │   └── SearchBar.tsx
│   └── newsletter/
│       └── NewsletterForm.tsx
│
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # NextAuth config
│   ├── r2.ts                       # Cloudflare R2 client
│   ├── resend.ts                   # Resend email client + helpers
│   ├── search.ts                   # Full-text search helpers
│   └── utils.ts                    # Shared utilities (cn, slugify, etc.)
│
├── emails/                         # React Email templates
│   ├── InviteEmail.tsx
│   ├── CommentNotificationEmail.tsx
│   └── NewsletterEmail.tsx
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── types/
│   ├── index.ts                    # Shared TypeScript types
│   └── next-auth.d.ts              # Extend NextAuth session types
│
├── proxy.ts                        # Route protection
├── next.config.mjs
├── tailwind.config.ts
└── .env.example
```

---

## 5. Roles & Permissions

| Action | Visitor | Writer | Admin |
|---|:---:|:---:|:---:|
| Read published posts | ✅ | ✅ | ✅ |
| Post guest comment | ✅ | ✅ | ✅ |
| Subscribe newsletter | ✅ | ✅ | ✅ |
| Create / edit own posts | ❌ | ✅ | ✅ |
| Delete own posts | ❌ | ✅ | ✅ |
| View all posts (incl. drafts) | ❌ | ❌ | ✅ |
| Delete other writers' posts | ❌ | ❌ | ✅ |
| Delete comments | ❌ | ❌ | ✅ |
| Invite new writers | ❌ | ❌ | ✅ |
| Manage newsletter broadcasts | ❌ | ❌ | ✅ |
| Manage categories and tags | ❌ | ❌ | ✅ |

---

## 6. Environment Variables

Create `.env.local` from `.env.example`:

```env
# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."         # Supabase direct URL for Prisma migrations

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"    # Generate with: openssl rand -base64 32

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="animeblog"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# Resend
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="no-reply@yourdomain.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Anime Blog"
```

---

## 7. Implementation Order

Follow this order strictly to avoid dependency issues:

```
Phase 1 — Foundation
  1. Bootstrap Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui
  2. Prisma schema + database migrations       → see 01_database_schema.md
  3. NextAuth + invite flow                    → see 02_auth.md
  4. Core layout: Navbar, Sidebar, Footer      → see 08_ui_components.md

Phase 2 — Core Content
  5. Tiptap editor + R2 media upload           → see 03_editor.md
  6. Post CRUD: create, edit, publish, draft   → see 04_posts.md
  7. Public pages: homepage, post detail, author profile

Phase 3 — Community Features
  8. Guest comment + email notification        → see 05_comments.md
  9. Full-text search                          → see 06_search.md
  10. Newsletter subscribe / broadcast         → see 07_newsletter.md

Phase 4 — Polish
  11. SEO + Open Graph                         → see 09_seo.md
  12. Admin panel                              → see 10_admin.md

Phase 5 — Testing
  13. Write and run all tests                  → see 11_testing.md
```

---

## 8. Code Conventions

### Next.js 16 conventions

- Dynamic page `params` and `searchParams` are promises and must be awaited.
- Route Handler `context.params` is a promise and must be awaited.
- Use `proxy.ts` for route protection. Do not create `middleware.ts`.

### Naming
- Components: PascalCase (`PostCard.tsx`)
- Hooks: camelCase with `use` prefix (`useSearch.ts`)
- API routes: kebab-case URL (`/api/newsletter/subscribe`)
- Database fields: snake_case in Prisma schema
- TypeScript types: PascalCase (`PostWithAuthor`)

### API Response Format
All API routes return a consistent shape:

```typescript
// Success
{ data: T, message?: string }

// Error
{ error: string, details?: unknown }
```

### Error Handling
- Wrap all API route bodies in `try/catch`
- Log errors server-side with `console.error('[ROUTE_NAME]', error)`
- Return generic messages to the client, never raw error objects
- Use standard HTTP status codes: 200, 201, 400, 401, 403, 404, 500

### TypeScript
- Enable `strict: true` in `tsconfig.json`
- Never use `any` — use `unknown` when type is truly unknown
- All Prisma query results must be explicitly typed

### Git Commits
Use conventional commits format:
```
feat: add newsletter subscribe endpoint
fix: correct slug generation for Vietnamese titles
chore: update Prisma schema with cascade delete
docs: add API usage examples to README
```
