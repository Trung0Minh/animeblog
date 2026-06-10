# Anime Blog

An invite-only editorial publication for long-form anime analysis, interviews,
and reviews.

## Stack

- Next.js 16 App Router with React 19 and TypeScript
- Tailwind CSS and shadcn/ui
- Prisma with PostgreSQL on Supabase
- Auth.js, Tiptap, Cloudflare R2, Resend, and Umami
- Vitest and Playwright

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

External-service credentials are required before database, authentication,
media upload, email, analytics, and deployment flows work end to end.

## Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Implementation requirements and ordered tasks live in [`plan/`](plan/).
