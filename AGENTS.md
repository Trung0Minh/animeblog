# AGENTS.md

## Project Overview

This is an **invite-only anime analysis and review blog** built with Next.js 16 (App Router), React 19, Prisma, PostgreSQL (Supabase), Cloudflare R2, NextAuth.js v5, Tiptap, Resend, and Tailwind CSS + shadcn/ui.

Before writing any code, read the relevant plan file for the feature you are implementing. All plan files are in the `plan/` directory.

---

## Documentation Map

| File | What it covers |
|---|---|
| `plan/00_overview.md` | Stack, architecture, directory structure, conventions — **read this first** |
| `plan/01_database_schema.md` | Full Prisma schema, migrations, seed data |
| `plan/02_auth.md` | Invite flow, NextAuth config, proxy |
| `plan/03_editor.md` | Tiptap block editor, media upload, R2 |
| `plan/04_posts.md` | Post CRUD, slug generation, writer dashboard |
| `plan/05_comments.md` | Guest comments, threading, email notifications |
| `plan/06_search.md` | Full-text search, SearchBar, Pagination component |
| `plan/07_newsletter.md` | Subscribe, unsubscribe, broadcast |
| `plan/08_ui_components.md` | Layout, Navbar, Sidebar, dark mode, typography |
| `plan/09_seo.md` | Meta tags, Open Graph, sitemap, JSON-LD |
| `plan/10_admin.md` | Admin panel, writer management, comment moderation |
| `plan/11_testing.md` | Vitest unit/integration tests, Playwright E2E, CI |
| `plan/12_analytics.md` | Umami analytics setup, AnalyticsWidget, custom events |
| `plan/13_autosave_draft_visibility.md` | Autosave hook, draft visibility control |
| `plan/14_writer_profile.md` | Writer edit profile, avatar upload, WriterMenu |
| `plan/15_responsive.md` | Responsive design — mobile vs desktop behavior for every component |
| `plan/DESIGN.md` | Color tokens, typography, spacing, component specs — follow for all UI work |
| `plan/tasks.md` | Ordered task list — check off as you complete each task |

---

## Essential Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Database: create and apply a new migration
npx prisma migrate dev --name <migration_name>

# Database: apply existing migrations (e.g. after pulling new changes)
npx prisma migrate deploy

# Database: open Prisma Studio (visual DB browser)
npx prisma studio

# Database: seed with initial data
npx prisma db seed

# Generate Prisma client after schema changes
npx prisma generate

# Run unit + integration tests
npx vitest run

# Run tests in watch mode
npx vitest

# Run E2E tests (requires dev server running)
npx playwright test

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Architecture Rules

### Never violate these

1. **Read the plan file before implementing any feature.** The plan files contain the exact code structure, API shapes, and business logic. Do not improvise.

2. **Never modify `prisma/schema.prisma` without running a migration immediately after.** Schema changes that are not migrated will break the app silently.

3. **Never use `any` in TypeScript.** Use `unknown` if the type is genuinely unknown.

4. **Never return `authorEmail` in any API response.** This field is private and must never be exposed to clients. Always use explicit `select` in Prisma queries to exclude it.

5. **Never render comment content via `dangerouslySetInnerHTML`.** Comments are plain text — render with `whitespace-pre-wrap`.

6. **The only exception to `dangerouslySetInnerHTML` is search snippets** from PostgreSQL `ts_headline` — this is safe because the HTML is server-generated and only contains `<mark>` tags.

7. **All API routes must return `{ data: T }` on success and `{ error: string }` on failure.** Never return raw objects or arrays at the top level.

8. **Never use `any` type — use `unknown` or create a proper interface.**

9. **The analytics script must not load in development.** Guard with `process.env.NODE_ENV === 'production'`.

10. **Test-only API routes (`/api/test/*`) must be guarded with `NODE_ENV === 'test'` check.** They must never be reachable in production.

11. **Next.js 16 request-time route values are asynchronous.** Page `params`,
    page `searchParams`, and route-handler `context.params` must be typed as
    `Promise<...>` and awaited before use.

12. **Use `proxy.ts`, not `middleware.ts`.** Next.js 16 deprecated the
    middleware file convention in favor of proxy.

---

## Project Conventions

### File naming
- Components: `PascalCase.tsx` (e.g. `PostCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g. `useAutosave.ts`)
- Utilities: `camelCase.ts` (e.g. `utils.ts`, `search.ts`)
- API routes: follow Next.js App Router convention (`route.ts`)

### Import aliases
All imports use the `@/` alias pointing to the project root:
```typescript
import { prisma } from '@/lib/prisma'
import { PostCard } from '@/components/posts/PostCard'
```

### API response format
```typescript
// Always return this shape:
Response.json({ data: result })           // success
Response.json({ error: 'message' }, { status: 4xx | 5xx })  // error
```

### Prisma queries
- Always use `select` to limit returned fields — never return entire records with sensitive fields
- Always wrap multi-step operations in `prisma.$transaction([])`
- Log errors with `console.error('[ROUTE_NAME]', error)` before returning 500

### Authentication in API routes
```typescript
const session = await auth()
if (!session) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Tailwind + shadcn/ui
- Use CSS variables defined in `globals.css` for colors — never hardcode hex values in components
- Use `cn()` from `lib/utils.ts` for conditional class merging
- Dark mode is handled via the `dark` class on `<html>` — always test both modes

---

## Environment Variables

All required environment variables are listed in `.env.example`. Copy to `.env.local` and fill in values before running the app.

**Never commit `.env.local` to git.**

Key variables and where they are used:

| Variable | Used in |
|---|---|
| `DATABASE_URL` | Prisma (pooled connection) |
| `DIRECT_URL` | Prisma migrations (Supabase direct) |
| `NEXTAUTH_SECRET` | NextAuth session signing |
| `NEXTAUTH_URL` | NextAuth redirect URLs |
| `RESEND_API_KEY` | Email sending (invites, comments, newsletter) |
| `RESEND_FROM_EMAIL` | Sender address for all emails |
| `R2_ACCOUNT_ID` | Cloudflare R2 file uploads |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 file uploads |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 file uploads |
| `R2_BUCKET_NAME` | Cloudflare R2 file uploads |
| `R2_PUBLIC_URL` | Public base URL for uploaded files |
| `NEXT_PUBLIC_APP_URL` | Canonical URL used in emails and SEO |
| `NEXT_PUBLIC_APP_NAME` | Blog name shown in UI and emails |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Umami analytics tracking script |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami website identifier |
| `UMAMI_API_URL` | Umami API for admin analytics widget |
| `UMAMI_USERNAME` | Umami API auth |
| `UMAMI_PASSWORD` | Umami API auth |

---

## Database Notes

- Database is **PostgreSQL on Supabase**
- Use `DATABASE_URL` for the app (pooled via PgBouncer) and `DIRECT_URL` for migrations
- After any schema change: `npx prisma migrate dev --name <name>` then `npx prisma generate`
- The full-text search trigger is in a separate migration SQL file — do not delete it
- To verify the search trigger is active:
  ```sql
  SELECT tgname FROM pg_trigger WHERE tgrelid = 'posts'::regclass;
  ```
- Seed data (categories, tags, admin user) is in `prisma/seed.ts` — run with `npx prisma db seed`

---

## Common Mistakes to Avoid

- **Do not use the Pages Router.** This project uses the App Router exclusively. All pages go under `app/`, not `pages/`.
- **Do not use `useRouter` from `next/router`.** Use `next/navigation` instead.
- **Do not use `<img>` for cover images and avatars that are uploaded files.** Use a standard `<img>` tag with explicit width/height or Tailwind aspect-ratio classes. Do not use `next/image` for R2-hosted files unless the R2 domain is added to `next.config.mjs`.
- **Do not use `localStorage` or `sessionStorage`.** They are not available during SSR and will cause hydration errors.
- **Do not add `'use client'` to a component unless it genuinely needs browser APIs or React state/effects.** Prefer Server Components by default.
- **Do not import server-only modules (prisma, auth, resend) inside Client Components.** Keep data fetching in Server Components or API routes.
- **Do not write desktop-only styles and try to undo them on mobile.** Always write mobile-first base styles and override upward with `md:`, `lg:`, `xl:` prefixes. See `plan/15_responsive.md` for per-component responsive behavior.
- **Do not forget to wrap Tiptap editor components in `'use client'`** — Tiptap uses browser APIs and cannot run on the server.
- **Do not start autosave before the post has been created** (i.e. before the first manual save that returns a `postId`).

---

## External Services Setup (Manual Steps)

These must be completed manually before the app will work end-to-end. They cannot be automated by the agent:

1. **Supabase** — Create a project, copy `DATABASE_URL` and `DIRECT_URL`
2. **Cloudflare R2** — Create a bucket, enable public access, set CORS policy, copy credentials
3. **Resend** — Create an account, verify a sending domain, copy API key
4. **Umami on Railway** — Deploy using Railway template, change default password, create website entry, copy Website ID
5. **Vercel** — Connect GitHub repo, add all env variables from `.env.example`

Detailed instructions for each service are in the relevant plan files.
