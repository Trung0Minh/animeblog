# tasks.md — Implementation Task List

Work through tasks in order. Do not skip ahead — later tasks depend on earlier ones.
Mark each task `[x]` when complete before moving to the next.

Reference `AGENTS.md` for commands and conventions.
Reference the linked `plan/` file for detailed implementation instructions for each task.

---

## Phase 1 — Project Bootstrap

- [x] **1.1** Initialize Next.js 16 project with React 19, TypeScript, and App Router
  ```bash
  npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"
  ```

- [x] **1.2** Install all core dependencies
  ```bash
  npm install @prisma/client prisma \
    next-auth@beta @auth/prisma-adapter \
    @tiptap/react @tiptap/pm @tiptap/starter-kit \
    @tiptap/extension-image @tiptap/extension-link \
    @tiptap/extension-placeholder @tiptap/extension-typography \
    @tiptap/extension-character-count \
    @aws-sdk/client-s3 \
    resend @react-email/components \
    next-themes \
    github-slugger nanoid \
    clsx tailwind-merge \
    lucide-react \
    zod
  ```

- [x] **1.3** Install dev dependencies
  ```bash
  npm install -D \
    @tailwindcss/typography \
    vitest @vitejs/plugin-react \
    @testing-library/react @testing-library/jest-dom \
    @testing-library/user-event \
    msw \
    @playwright/test \
    @types/github-slugger
  ```

- [x] **1.4** Initialize shadcn/ui (choose Default style, Zinc base color, yes to CSS variables)
  ```bash
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button input textarea badge separator sheet dropdown-menu
  ```

- [x] **1.5** Configure `tailwind.config.ts` — add typography plugin, Inter font family, dark mode via class
  → `plan/08_ui_components.md` section 3

- [x] **1.6** Create `app/globals.css` with CSS variables for light and dark mode color tokens
  → `plan/08_ui_components.md` section 11

- [x] **1.7** Create `vitest.config.ts` and `playwright.config.ts`
  → `plan/11_testing.md` section 2

- [x] **1.8** Create `.env.example` with all required variable names (values empty)
  → `AGENTS.md` environment variables table

- [ ] **1.9** Create `.env.local` from `.env.example` and fill in actual values

- [x] **1.10** Add `/docs`, `.env.local`, `playwright-report/` to `.gitignore`

---

## Phase 2 — Database

> Reference: `plan/01_database_schema.md`

- [x] **2.1** Create `prisma/schema.prisma` with the full schema — all models, enums, indexes
  → `plan/01_database_schema.md` section 2

- [x] **2.2** Run initial migration
  ```bash
  npx prisma migrate dev --name init
  ```

- [x] **2.3** Create the full-text search migration SQL file and apply it
  → `plan/01_database_schema.md` section 3

- [x] **2.4** Create `lib/prisma.ts` with the singleton pattern

- [x] **2.5** Create `prisma/seed.ts` with admin user, categories, and tags

- [x] **2.6** Run seed
  ```bash
  npx prisma db seed
  ```

- [x] **2.7** Verify in Supabase dashboard: all tables exist and `posts_search_vector_trigger` is active

- [x] **2.8** Enable RLS on every table in the exposed `public` schema before using Supabase API keys

---

## Phase 3 — Authentication

> Reference: `plan/02_auth.md`

- [x] **3.1** Create `lib/auth.ts` with NextAuth config (Resend provider, PrismaAdapter, signIn + session callbacks)

- [x] **3.2** Create `types/next-auth.d.ts` to extend session with `role`, `username`, `avatarUrl`

- [x] **3.3** Create `app/api/auth/[...nextauth]/route.ts` exporting handlers

- [x] **3.4** Create `proxy.ts` with route protection for `/dashboard/*` and `/admin/*`

- [x] **3.5** Create `POST /api/invite/route.ts` — admin creates invite link

- [x] **3.6** Create `POST /api/invite/accept/route.ts` — writer accepts invite and creates account

- [x] **3.7** Create `app/(auth)/login/page.tsx`

- [x] **3.8** Create `app/(auth)/invite/[token]/page.tsx` (Server Component, validates token)

- [x] **3.9** Create `components/auth/InviteForm.tsx` (Client Component)

- [x] **3.10** Create `emails/InviteEmail.tsx`

- [x] **3.11** Create `lib/resend.ts` with `sendInviteEmail` helper

- [ ] **3.12** Verify end-to-end: send invite from admin → receive email → create account → login → reach `/dashboard`

---

## Phase 4 — Core Layout & UI

> Reference: `plan/08_ui_components.md`, `plan/DESIGN.md`

- [x] **4.1** Create `components/layout/ThemeProvider.tsx`

- [x] **4.2** Update `app/layout.tsx` — Inter font (with Vietnamese subset), ThemeProvider, Navbar, Footer

- [x] **4.3** Create `components/layout/Navbar.tsx`

- [x] **4.4** Create `components/layout/ThemeToggle.tsx`

- [x] **4.5** Create `components/layout/MobileNav.tsx` (shadcn/ui Sheet drawer)

- [x] **4.6** Create `components/layout/Sidebar.tsx`

- [x] **4.7** Create `components/layout/Footer.tsx`

- [x] **4.8** Create `lib/utils.ts` with `cn`, `formatDate`, `generateSlug`, `ensureUniqueSlug`

- [x] **4.9** Verify dark/light mode toggle works and persists on reload

- [x] **4.10** Verify Navbar is sticky and Sidebar hidden on mobile

---

## Phase 5 — Editor & Media Upload

> Reference: `plan/03_editor.md`

- [x] **5.1** Create `components/editor/extensions/SpoilerExtension.ts`

- [x] **5.2** Create `components/editor/extensions/VideoEmbedExtension.ts`

- [x] **5.3** Create `components/editor/SpoilerView.tsx` (React NodeView)

- [x] **5.4** Create `components/editor/TiptapEditor.tsx` with all extensions wired in

- [x] **5.5** Create `components/editor/EditorToolbar.tsx`

- [x] **5.6** Create `components/editor/BubbleMenu.tsx`

- [x] **5.7** Create `lib/r2.ts` with `uploadToR2` function

- [x] **5.8** Create `app/api/upload/route.ts`

- [x] **5.9** Create `components/editor/MediaUpload.tsx`

- [x] **5.10** Create `components/editor/VideoEmbedModal.tsx`

- [x] **5.11** Create `components/posts/PostBody.tsx` (read-only Tiptap renderer)

- [x] **5.12** Complete R2 bucket setup in Cloudflare dashboard (public access, CORS policy)

- [x] **5.13** Verify: upload a GIF in the editor → it appears inline with correct URL

- [x] **5.14** Verify: insert a YouTube URL → rendered as iframe embed

- [x] **5.15** Verify: spoiler block blurs content and reveals on click

---

## Phase 6 — Posts

> Reference: `plan/04_posts.md`

- [x] **6.1** Create `GET + POST /api/posts/route.ts`

- [x] **6.2** Create `GET + PATCH + DELETE /api/posts/[id]/route.ts`

- [x] **6.3** Create `GET + POST /api/tags/route.ts` — tag search + inline creation by writers

- [x] **6.4** Create `components/posts/PostHeader.tsx`

- [x] **6.5** Create `components/posts/PostCard.tsx`

- [x] **6.6** Create `components/posts/PostList.tsx`

- [x] **6.7** Create `components/ui/Pagination.tsx`

- [x] **6.8** Create `components/posts/CoverImageUpload.tsx`

- [x] **6.9** Create `components/posts/TagInput.tsx` — autocomplete + inline tag creation

- [x] **6.10** Create `components/posts/TableOfContents.tsx`

- [x] **6.11** Create `components/posts/PostEditor.tsx`

- [x] **6.12** Create `app/(public)/page.tsx` — Homepage

- [x] **6.13** Create `app/(public)/[slug]/page.tsx` — Post detail page

- [x] **6.14** Create `app/(public)/authors/[username]/page.tsx` — Author profile

- [x] **6.15** Create `app/(public)/category/[slug]/page.tsx` — Category listing

- [x] **6.16** Create `app/(public)/tag/[slug]/page.tsx` — Tag listing

- [x] **6.17** Create `app/(public)/contributors/page.tsx`

- [x] **6.18** Create `app/(writer)/dashboard/page.tsx`

- [x] **6.19** Create `app/(writer)/dashboard/new/page.tsx`

- [x] **6.20** Create `app/(writer)/dashboard/edit/[id]/page.tsx`

- [x] **6.21** Verify: create post as draft → not visible to visitors → publish → visible

- [x] **6.22** Verify: two posts with same title get unique slugs (`my-title` and `my-title-1`)

---

## Phase 7 — Autosave & Draft Visibility

> Reference: `plan/13_autosave_draft_visibility.md`

- [x] **7.1** Add `lastSavedAt` and `draftVisibility` fields to `prisma/schema.prisma`

- [x] **7.2** Run migration
  ```bash
  npx prisma migrate dev --name add_autosave_draft_visibility
  ```

- [x] **7.3** Create `hooks/useAutosave.ts`

- [x] **7.4** Create `hooks/useWarnUnsaved.ts`

- [x] **7.5** Create `components/editor/SaveStatusIndicator.tsx`

- [x] **7.6** Create `lib/postAccess.ts` with `canViewPost` helper

- [x] **7.7** Update `GET /api/posts/[id]` to use `canViewPost`

- [x] **7.8** Update `GET /api/posts` list filter to respect `draftVisibility` for writers

- [x] **7.9** Add `draftVisibility` to `updateSchema` in `PATCH /api/posts/[id]`

- [x] **7.10** Create `components/posts/DraftVisibilityToggle.tsx`

- [x] **7.11** Update `PostEditor` to wire in autosave, warn-unsaved, save indicator, and visibility toggle

- [x] **7.12** Verify: typing then pausing 3 seconds triggers a PATCH request

- [x] **7.13** Verify: typing continuously for 35 seconds triggers at least one periodic save

- [x] **7.14** Verify: a PRIVATE draft returns 404 for co-authors

---

## Phase 8 — Writer Profile

> Reference: `plan/14_writer_profile.md`

- [x] **8.1** Create `PATCH /api/profile/route.ts`

- [x] **8.2** Create `app/(writer)/dashboard/layout.tsx` with dashboard nav (My posts, Edit profile, View public profile)

- [x] **8.3** Create `app/(writer)/dashboard/profile/page.tsx`

- [x] **8.4** Create `components/profile/ProfileForm.tsx`

- [x] **8.5** Create `components/profile/AvatarUpload.tsx`

- [x] **8.6** Create `components/layout/WriterMenu.tsx` (dropdown: My posts, Edit profile, Sign out)

- [x] **8.7** Add `WriterMenu` to `Navbar`

- [x] **8.8** Verify: writer can update display name, bio, and avatar

- [x] **8.9** Verify: avatar upload appears in Navbar and public profile page

- [x] **8.10** Verify: username and email are read-only

---

## Phase 9 — Comments

> Reference: `plan/05_comments.md`

- [x] **8.1** Create `POST /api/comments/route.ts`

- [x] **8.2** Create `DELETE /api/comments/[id]/route.ts`

- [x] **8.3** Add `CommentWithReplies` type to `types/index.ts`

- [x] **8.4** Create `components/comments/CommentSection.tsx`

- [x] **8.5** Create `components/comments/CommentForm.tsx`

- [x] **8.6** Create `components/comments/CommentList.tsx`

- [x] **8.7** Create `emails/CommentReplyEmail.tsx`

- [x] **8.8** Add `sendCommentReplyEmail` to `lib/resend.ts`

- [x] **8.9** Add `CommentSection` to the post detail page

- [x] **8.10** Verify: guest posts a comment → appears immediately

- [x] **8.11** Verify: reply triggers notification email to parent author

- [x] **8.12** Verify: `authorEmail` is never in any API response

- [x] **8.13** Verify: reply-to-reply returns 400

---

## Phase 9 — Search

> Reference: `plan/06_search.md`

- [x] **9.1** Create `lib/search.ts` with `buildSearchQuery` and `SearchResult` type

- [x] **9.2** Create `hooks/useDebounce.ts`

- [x] **9.3** Create `GET /api/search/route.ts`

- [x] **9.4** Create `components/search/SearchBar.tsx`

- [x] **9.5** Add `SearchBar` to `Navbar`

- [x] **9.6** Create `app/(public)/search/page.tsx`

- [x] **9.7** Verify: search "frieren" returns posts containing "Frieren"

- [x] **9.8** Verify: partial query "ufota" returns posts containing "ufotable" (prefix matching)

- [x] **9.9** Verify: draft posts do not appear in results

---

## Phase 10 — Newsletter

> Reference: `plan/07_newsletter.md`

- [x] **10.1** Create `POST /api/newsletter/subscribe/route.ts`

- [x] **10.2** Create `POST /api/newsletter/unsubscribe/route.ts`

- [x] **10.3** Create `POST /api/newsletter/broadcast/route.ts`

- [x] **10.4** Create `app/(public)/unsubscribe/page.tsx`

- [x] **10.5** Create `components/newsletter/NewsletterForm.tsx`

- [x] **10.6** Add `NewsletterForm` to `Sidebar`

- [x] **10.7** Create `emails/SubscribeConfirmationEmail.tsx`

- [x] **10.8** Create `emails/NewsletterEmail.tsx`

- [x] **10.9** Add `sendSubscribeConfirmationEmail` and `sendNewsletterBroadcast` to `lib/resend.ts`

- [x] **10.10** Verify: new subscriber receives confirmation email

- [x] **10.11** Verify: previously unsubscribed email is reactivated on re-subscribe

- [x] **10.12** Verify: unsubscribe link sets status to UNSUBSCRIBED

---

## Phase 11 — SEO

> Reference: `plan/09_seo.md`

- [x] **11.1** Create `lib/seo.ts` with `buildMetadata` helper

- [x] **11.2** Add `generateMetadata` to all public pages: `/`, `/[slug]`, `/category/[slug]`, `/tag/[slug]`, `/authors/[username]`, `/search`, `/contributors`

- [x] **11.3** Add `robots: { index: false }` to all dashboard and admin layouts

- [x] **11.4** Create `app/sitemap.ts`

- [x] **11.5** Create `app/robots.ts`

- [x] **11.6** Create `components/posts/PostJsonLd.tsx` and add to post detail page

- [x] **11.7** Place `public/og-default.png` fallback OG image (1200×630px) — create manually

- [x] **11.8** Verify: `/sitemap.xml` lists all published posts

- [x] **11.9** Verify: `/robots.txt` disallows `/dashboard/` and `/admin/`

- [x] **11.10** Verify OG tags with https://opengraph.xyz

---

## Phase 12 — Admin Panel

> Reference: `plan/10_admin.md`

- [x] **12.1** Create `app/(admin)/admin/layout.tsx` with auth guard + `AdminNav`

- [x] **12.2** Create `components/admin/AdminNav.tsx`

- [x] **12.3** Create `app/(admin)/admin/page.tsx` — stats grid (Umami widget added in Phase 13)

- [x] **12.4** Create `app/(admin)/admin/posts/page.tsx`

- [x] **12.5** Create `components/admin/AdminPostsTable.tsx`

- [x] **12.6** Create `app/(admin)/admin/writers/page.tsx`

- [x] **12.7** Create `components/admin/InviteWriterForm.tsx`

- [x] **12.8** Create `components/admin/WritersTable.tsx`

- [x] **12.9** Create `components/admin/PendingInvitesTable.tsx`

- [x] **12.10** Create `DELETE /api/admin/writers/[id]/route.ts`

- [x] **12.11** Create `app/(admin)/admin/comments/page.tsx`

- [x] **12.12** Create `components/admin/AdminCommentsTable.tsx`

- [x] **12.13** Create `app/(admin)/admin/newsletter/page.tsx`

- [x] **12.14** Create `components/admin/NewsletterBroadcastForm.tsx`

- [x] **12.15** Verify: admin can delete any post regardless of author

- [x] **12.16** Verify: removing writer with posts revokes login only (posts remain)

---

## Phase 13 — Analytics

> Reference: `plan/12_analytics.md`

- [ ] **13.1** Deploy Umami on Railway and configure website entry

- [ ] **13.2** Add Umami env variables to `.env.local`

- [x] **13.3** Add Umami `<Script>` to `app/layout.tsx` (production only)

- [x] **13.4** Create `lib/analytics.ts` with `trackEvent` helper

- [x] **13.5** Create `lib/umami.ts` with `getUmamiStats`, `getUmamiTopPages`, `getPostViewCount`

- [x] **13.6** Create `components/posts/PostReadTracker.tsx` and add to post detail page

- [x] **13.7** Add `trackEvent` calls to `CommentForm` and `NewsletterForm`

- [x] **13.8** Create `components/admin/AnalyticsWidget.tsx`

- [x] **13.9** Add `AnalyticsWidget` to `/admin` page wrapped in `<Suspense>`

- [x] **13.10** Create `app/(admin)/admin/analytics/page.tsx` (full-page view with link to Umami)

- [ ] **13.11** Verify: page views appear in Umami realtime dashboard

- [x] **13.12** Verify: `AnalyticsWidget` falls back gracefully if Umami is down

---

## Phase 15 — Responsive Design

> Reference: `plan/15_responsive.md`

- [x] **15.1** Update `Navbar` — hide nav links, SearchBar, WriterMenu on mobile; show hamburger
- [x] **15.2** Update `MobileNav` drawer — add search link and WriterMenu items when logged in
- [x] **15.3** Update homepage layout — sidebar stacks below post list on mobile (`flex-col lg:flex-row`)
- [x] **15.4** Update `PostCard` — smaller title font on mobile, hide excerpt below sm
- [x] **15.5** Update post detail page — TOC `hidden xl:block`, title `text-2xl md:text-3xl`
- [x] **15.6** Update `PostBody` — body font `text-base md:text-lg`
- [x] **15.7** Update `CommentForm` — name/email `grid-cols-1 sm:grid-cols-2`, submit button `w-full sm:w-auto`
- [x] **15.8** Update `PostEditor` — title font `text-xl md:text-3xl`, sticky footer `flex-col sm:flex-row`
- [x] **15.9** Update `AdminNav` — add `overflow-x-auto` to prevent overflow on small screens
- [x] **15.10** Update dashboard layout nav — add `overflow-x-auto whitespace-nowrap`
- [x] **15.11** Update `AvatarUpload` — `flex-col sm:flex-row`
- [x] **15.12** Fix touch targets — tag remove button, comment reply button, pagination buttons
- [x] **15.13** Verify no horizontal scroll at 375px width on any page
- [x] **15.14** Test on Chrome DevTools device emulation: 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1280px (desktop)

---

## Phase 16 — Testing

> Reference: `plan/11_testing.md`

- [x] **16.1** Create `tests/setup.ts`

- [x] **16.2** Create `tests/integration/helpers/db.ts` with truncation and factory functions

- [x] **16.3** Create `tests/unit/utils.test.ts`

- [x] **16.4** Create `tests/unit/search.test.ts`

- [x] **16.5** Create `tests/unit/seo.test.ts`

- [x] **16.6** Create `tests/integration/posts.test.ts`

- [x] **16.7** Create `tests/integration/comments.test.ts`

- [x] **16.8** Create `tests/integration/auth.test.ts`

- [x] **16.9** Create `tests/integration/newsletter.test.ts`

- [x] **16.10** Create `app/api/test/login/route.ts` (NODE_ENV=test only)

- [x] **16.11** Create `app/api/test/newsletter-token/route.ts` (NODE_ENV=test only)

- [x] **16.12** Create `tests/e2e/post-flow.spec.ts`

- [x] **16.13** Create `tests/e2e/comment-flow.spec.ts`

- [x] **16.14** Create `tests/e2e/search-flow.spec.ts`

- [x] **16.15** Create `tests/e2e/newsletter-flow.spec.ts`

- [x] **16.16** Create `.github/workflows/test.yml`

- [x] **16.17** Run all unit + integration tests and confirm they pass
  ```bash
  npx vitest run
  ```

- [x] **16.18** Run E2E tests and confirm they pass
  ```bash
  npx playwright test
  ```

---

## Phase 17 — Final QA & Deploy

- [x] **17.1** Run TypeScript type check — must pass with zero errors
  ```bash
  npx tsc --noEmit
  ```

- [x] **17.2** Run linter — must pass with zero errors
  ```bash
  npm run lint
  ```

- [ ] **17.3** Test full invite flow end-to-end in production environment

- [ ] **17.4** Test dark/light mode on mobile and desktop

- [ ] **17.5** Test post create → autosave → publish flow

- [ ] **17.6** Test comment + reply + email notification flow

- [ ] **17.7** Test newsletter subscribe → broadcast → unsubscribe flow

- [ ] **17.8** Test search with Vietnamese query

- [ ] **17.9** Verify `/sitemap.xml`, `/robots.txt`, and OG tags in production

- [ ] **17.10** Add all env variables to Vercel project settings

- [ ] **17.11** Push to `main` → confirm Vercel auto-deploys successfully

- [ ] **17.12** Confirm GitHub Actions CI pipeline is green
