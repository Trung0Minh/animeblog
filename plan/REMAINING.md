# Remaining Tasks Handoff

Last updated: 2026-06-12

This file tracks the remaining unchecked work from `plan/tasks.md` and the current blockers.

## Resend + Invite E2E

Unchecked tasks:

- `3.12` Verify end-to-end: send invite from admin, receive email, create account, login, reach `/dashboard`
- `17.3` Test full invite flow end-to-end in production environment

Current blocker:

- The Resend sending domain was configured as `mail.eizou.blog`, but `eizou.blog` is not registered/owned yet.
- Because the domain is not owned, its DNS records cannot be made authoritative, so Resend cannot verify it.
- The production site currently uses `animeblog-six.vercel.app`; that domain cannot be used as a Resend sender domain because its DNS is not controlled here.

What to do next:

1. Register `eizou.blog` or choose another domain that is already owned.
2. Point that domain's nameservers to Cloudflare or manage DNS at its current DNS provider.
3. In Resend, verify a sending subdomain such as `mail.eizou.blog`.
4. Add the Resend DNS records exactly as shown in Resend:
   - DKIM TXT
   - return-path MX
   - SPF TXT
   - DMARC TXT, optional but recommended
5. Click "I've added the records" in Resend and wait for verified status.
6. Set `RESEND_FROM_EMAIL` to a sender on the verified domain, for example:
   - `Eizou Blog <noreply@mail.eizou.blog>`
7. Update `RESEND_FROM_EMAIL` in `.env.local`.
8. Update `RESEND_FROM_EMAIL` in Vercel Production, Preview, and Development env vars.
9. Redeploy production.
10. Run invite E2E with a real recipient inbox that is not already in the `users` table.

Notes from latest attempt:

- Invite API was tested in production with a temporary admin session.
- The API returned `500` because Resend rejected sending.
- Vercel runtime logs showed the failure was a Resend error inside `POST /api/invite`.
- The route deleted the failed invite, so there was no leftover pending invite for the test alias.
- Temporary admin session was deleted after testing.

## Local Environment

Unchecked task:

- `1.9` Create `.env.local` from `.env.example` and fill in actual values

Current state:

- `.env.local` exists and contains all `.env.example` keys except `UMAMI_WEBSITE_ID`.
- `UMAMI_API_URL` is present but empty.
- Current code falls back from `UMAMI_WEBSITE_ID` to `NEXT_PUBLIC_UMAMI_WEBSITE_ID` in `lib/umami.ts`, but the task should remain unchecked until the final analytics decision is made.

What to do next:

- If staying with tracking-only Umami Cloud, update `.env.example` and task expectations to remove unused server-side Umami API variables.
- If self-hosting Umami later, fill:
  - `UMAMI_API_URL`
  - `UMAMI_USERNAME`
  - `UMAMI_PASSWORD`
  - `UMAMI_WEBSITE_ID`

## Umami Analytics

Unchecked tasks:

- `13.1` Deploy Umami on Railway and configure website entry
- `13.2` Add Umami env variables to `.env.local`
- `13.11` Verify page views appear in Umami realtime dashboard

Current blocker:

- Railway currently has no projects available under the authenticated account.
- Earlier decision was to keep Umami Cloud tracking only because the API key/admin analytics path required a paid plan.

What to do next:

Option A: tracking only

1. Keep only:
   - `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
   - `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
2. Verify page views in Umami Cloud dashboard manually.
3. Update tasks/docs to reflect that server-side admin analytics is intentionally disabled.

Option B: self-hosted Umami

1. Deploy Umami on Railway.
2. Configure the Umami website entry.
3. Fill local and Vercel env vars:
   - `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
   - `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
   - `UMAMI_API_URL`
   - `UMAMI_USERNAME`
   - `UMAMI_PASSWORD`
   - `UMAMI_WEBSITE_ID`
4. Redeploy Vercel.
5. Verify page views appear in the realtime dashboard.

## Vercel Environment Variables

Unchecked task:

- `17.10` Add all env variables to Vercel project settings

Current state from `npx vercel env ls`:

- Vercel has core production/preview/development env vars for:
  - database
  - Auth.js
  - R2
  - Resend
  - public app config
  - public Umami tracking
- Vercel does not have:
  - `UMAMI_API_URL`
  - `UMAMI_USERNAME`
  - `UMAMI_PASSWORD`
  - `UMAMI_WEBSITE_ID`

What to do next:

- If using tracking-only Umami, update docs/tasks so these variables are not required.
- If using self-hosted Umami/admin analytics, add the four server-side Umami env vars to Vercel and redeploy.

## Production QA Already Completed

Recently completed:

- `17.6` Test comment + reply + email notification flow

Evidence:

- Parent comment API returned `201`.
- Reply API returned `201`.
- Production DB contained both comment rows.
- API responses did not expose `authorEmail`.
- Vercel logs showed no `Failed to send reply email` error.

Limit:

- Resend API key is send-only, so inbox delivery can only be confirmed by checking the recipient inbox manually.
