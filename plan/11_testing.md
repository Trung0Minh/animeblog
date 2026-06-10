# 11 — Testing

## 1. Overview

Testing is split into three layers:

| Layer | Tool | What it tests |
|---|---|---|
| Unit tests | **Vitest** | Pure functions: slug generation, search query builder, date formatter |
| Integration tests | **Vitest + Prisma test DB** | API routes: correct DB writes, auth guards, edge cases |
| End-to-end tests | **Playwright** | Full user flows in a real browser: invite flow, write post, comment |

All tests run in CI on every push to `main` via GitHub Actions.

---

## 2. Setup

### Install packages

```bash
npm install -D vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event \
  msw \
  playwright @playwright/test
```

### Vitest config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

### Test setup file

```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './mocks/server'

// Start MSW mock server for API tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Playwright config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  // Start the dev server before running E2E tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Test directory structure

```
tests/
├── setup.ts                    # Global Vitest setup
├── mocks/
│   ├── server.ts               # MSW server instance
│   └── handlers.ts             # MSW request handlers
├── unit/
│   ├── utils.test.ts           # generateSlug, formatDate, buildSearchQuery
│   └── seo.test.ts             # buildMetadata
├── integration/
│   ├── posts.test.ts           # /api/posts CRUD
│   ├── comments.test.ts        # /api/comments threading + email
│   ├── auth.test.ts            # /api/invite + /api/invite/accept
│   ├── search.test.ts          # /api/search
│   └── newsletter.test.ts      # subscribe / unsubscribe / broadcast
└── e2e/
    ├── invite-flow.spec.ts     # Admin invites writer → writer creates account
    ├── post-flow.spec.ts       # Writer creates, edits, publishes post
    ├── comment-flow.spec.ts    # Visitor posts comment + reply
    ├── search-flow.spec.ts     # Visitor searches and finds a post
    └── newsletter-flow.spec.ts # Visitor subscribes + unsubscribes
```

---

## 3. Unit Tests

### utils.test.ts

```typescript
// tests/unit/utils.test.ts
import { describe, it, expect } from 'vitest'
import { generateSlug, formatDate } from '@/lib/utils'

describe('generateSlug', () => {
  it('converts ASCII title to kebab-case', () => {
    expect(generateSlug('Why Ufotable Fight Scenes Work'))
      .toBe('why-ufotable-fight-scenes-work')
  })

  it('strips Vietnamese diacritics', () => {
    expect(generateSlug('Phân tích Animation trong Frieren'))
      .toBe('phan-tich-animation-trong-frieren')
  })

  it('converts Vietnamese đ to d', () => {
    expect(generateSlug('Đánh giá anime mùa xuân'))
      .toBe('danh-gia-anime-mua-xuan')
  })

  it('removes special characters', () => {
    expect(generateSlug('Ufotable\'s Best Work (2024)'))
      .toBe('ufotables-best-work-2024')
  })

  it('handles multiple consecutive spaces', () => {
    expect(generateSlug('Vinland  Saga   OST'))
      .toBe('vinland-saga-ost')
  })

  it('returns empty string for empty input', () => {
    expect(generateSlug('')).toBe('')
  })
})

describe('formatDate', () => {
  it('formats a date in Vietnamese locale', () => {
    const result = formatDate(new Date('2024-04-01T00:00:00Z'))
    // Should contain year and month — exact format depends on locale
    expect(result).toContain('2024')
  })

  it('accepts a date string', () => {
    expect(() => formatDate('2024-04-01')).not.toThrow()
  })
})
```

### search.test.ts (unit)

```typescript
// tests/unit/search.test.ts
import { describe, it, expect } from 'vitest'
import { buildSearchQuery } from '@/lib/search'

describe('buildSearchQuery', () => {
  it('builds AND query for multiple terms', () => {
    expect(buildSearchQuery('ufotable animation'))
      .toBe('ufotable & animation:*')
  })

  it('adds prefix wildcard to last token only', () => {
    expect(buildSearchQuery('vinland saga'))
      .toBe('vinland & saga:*')
  })

  it('handles single term', () => {
    expect(buildSearchQuery('frieren'))
      .toBe('frieren:*')
  })

  it('strips tsquery special characters', () => {
    expect(buildSearchQuery('ufotable & | ! (test)'))
      .toBe('ufotable & test:*')
  })

  it('handles extra whitespace', () => {
    expect(buildSearchQuery('  mappa   chainsaw  '))
      .toBe('mappa & chainsaw:*')
  })

  it('returns empty string for blank input', () => {
    expect(buildSearchQuery('   ')).toBe('')
  })
})
```

### seo.test.ts

```typescript
// tests/unit/seo.test.ts
import { describe, it, expect } from 'vitest'
import { buildMetadata } from '@/lib/seo'

describe('buildMetadata', () => {
  it('returns default metadata when no options provided', () => {
    const meta = buildMetadata()
    expect(meta.description).toBeTruthy()
    expect(meta.openGraph).toBeTruthy()
    expect(meta.twitter).toBeTruthy()
  })

  it('includes title in openGraph and twitter', () => {
    const meta = buildMetadata({ title: 'Test Post' })
    expect((meta.openGraph as any)?.title).toContain('Test Post')
    expect((meta.twitter as any)?.title).toContain('Test Post')
  })

  it('sets noIndex robots when noIndex is true', () => {
    const meta = buildMetadata({ noIndex: true })
    expect((meta.robots as any)?.index).toBe(false)
  })

  it('does not set noIndex by default', () => {
    const meta = buildMetadata()
    expect(meta.robots).toBeUndefined()
  })

  it('uses provided ogImage', () => {
    const meta = buildMetadata({ ogImage: 'https://example.com/img.jpg' })
    const images = (meta.openGraph as any)?.images as any[]
    expect(images?.[0]?.url).toBe('https://example.com/img.jpg')
  })
})
```

---

## 4. Integration Tests

Integration tests hit the actual API route handler functions directly (not over HTTP), using a test database. Set up a separate test database connection string in `.env.test`.

```
# .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/animeblog_test"
NEXTAUTH_SECRET="test-secret-for-vitest"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Anime Blog Test"
```

### Test DB helper

```typescript
// tests/integration/helpers/db.ts
import { PrismaClient } from '@prisma/client'
import { beforeEach, afterAll } from 'vitest'

export const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

// Truncate all tables before each test to ensure isolation
beforeEach(async () => {
  await testPrisma.$transaction([
    testPrisma.postTag.deleteMany(),
    testPrisma.postAuthor.deleteMany(),
    testPrisma.comment.deleteMany(),
    testPrisma.post.deleteMany(),
    testPrisma.tag.deleteMany(),
    testPrisma.category.deleteMany(),
    testPrisma.newsletterSubscriber.deleteMany(),
    testPrisma.invite.deleteMany(),
    testPrisma.session.deleteMany(),
    testPrisma.account.deleteMany(),
    testPrisma.user.deleteMany(),
  ])
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

// Factory functions for common test fixtures
export async function createTestAdmin() {
  return testPrisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Test Admin',
      username: 'testadmin',
      role: 'ADMIN',
    },
  })
}

export async function createTestWriter() {
  return testPrisma.user.create({
    data: {
      email: 'writer@test.com',
      name: 'Test Writer',
      username: 'testwriter',
      role: 'WRITER',
    },
  })
}

export async function createTestPost(authorId: string, overrides = {}) {
  return testPrisma.post.create({
    data: {
      title: 'Test Post',
      slug: 'test-post',
      content: { type: 'doc', content: [] },
      contentText: 'test content',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId,
      ...overrides,
    },
  })
}
```

### posts.test.ts

```typescript
// tests/integration/posts.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET, POST } from '@/app/api/posts/route'
import { testPrisma, createTestWriter, createTestAdmin, createTestPost } from './helpers/db'

// Mock next-auth so we can control the session in tests
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { auth } from '@/lib/auth'
const mockAuth = vi.mocked(auth)

describe('GET /api/posts', () => {
  it('returns only published posts for unauthenticated visitors', async () => {
    mockAuth.mockResolvedValue(null)
    const writer = await createTestWriter()
    await createTestPost(writer.id, { status: 'PUBLISHED', slug: 'pub-post' })
    await createTestPost(writer.id, { status: 'DRAFT', slug: 'draft-post' })

    const req = new Request('http://localhost/api/posts')
    const res = await GET(req)
    const json = await res.json()

    expect(json.data.posts).toHaveLength(1)
    expect(json.data.posts[0].slug).toBe('pub-post')
  })

  it('returns own drafts for authenticated writer', async () => {
    const writer = await createTestWriter()
    mockAuth.mockResolvedValue({
      user: { id: writer.id, role: 'WRITER', name: writer.name, email: writer.email, username: writer.username },
      expires: '',
    })

    await createTestPost(writer.id, { status: 'DRAFT', slug: 'my-draft' })

    const req = new Request('http://localhost/api/posts')
    const res = await GET(req)
    const json = await res.json()

    const slugs = json.data.posts.map((p: any) => p.slug)
    expect(slugs).toContain('my-draft')
  })

  it('returns all posts for admin', async () => {
    const admin = await createTestAdmin()
    const writer = await createTestWriter()
    mockAuth.mockResolvedValue({
      user: { id: admin.id, role: 'ADMIN', name: admin.name, email: admin.email, username: admin.username },
      expires: '',
    })

    await createTestPost(writer.id, { status: 'DRAFT', slug: 'writer-draft' })
    await createTestPost(admin.id, { status: 'PUBLISHED', slug: 'admin-post' })

    const req = new Request('http://localhost/api/posts')
    const res = await GET(req)
    const json = await res.json()

    expect(json.data.posts).toHaveLength(2)
  })
})

describe('POST /api/posts', () => {
  it('rejects unauthenticated requests', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', content: {}, status: 'DRAFT' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates a draft post for authenticated writer', async () => {
    const writer = await createTestWriter()
    mockAuth.mockResolvedValue({
      user: { id: writer.id, role: 'WRITER', name: writer.name, email: writer.email, username: writer.username },
      expires: '',
    })

    const req = new Request('http://localhost/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'My New Post',
        content: { type: 'doc', content: [] },
        contentText: 'body text',
        status: 'DRAFT',
      }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.data.status).toBe('DRAFT')

    const inDb = await testPrisma.post.findUnique({ where: { id: json.data.id } })
    expect(inDb).not.toBeNull()
    expect(inDb?.authorId).toBe(writer.id)
  })

  it('sets publishedAt when creating a published post', async () => {
    const writer = await createTestWriter()
    mockAuth.mockResolvedValue({
      user: { id: writer.id, role: 'WRITER', name: writer.name, email: writer.email, username: writer.username },
      expires: '',
    })

    const req = new Request('http://localhost/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Published Post',
        content: { type: 'doc', content: [] },
        status: 'PUBLISHED',
      }),
    })
    const res = await POST(req)
    const json = await res.json()

    const inDb = await testPrisma.post.findUnique({ where: { id: json.data.id } })
    expect(inDb?.publishedAt).not.toBeNull()
  })

  it('generates unique slugs for duplicate titles', async () => {
    const writer = await createTestWriter()
    mockAuth.mockResolvedValue({
      user: { id: writer.id, role: 'WRITER', name: writer.name, email: writer.email, username: writer.username },
      expires: '',
    })

    const makeReq = () => new Request('http://localhost/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Same Title', content: {}, status: 'DRAFT' }),
    })

    const res1 = await POST(makeReq())
    const res2 = await POST(makeReq())

    const json1 = await res1.json()
    const json2 = await res2.json()

    expect(json1.data.slug).not.toBe(json2.data.slug)
    expect(json2.data.slug).toMatch(/same-title-\d+/)
  })
})
```

### comments.test.ts

```typescript
// tests/integration/comments.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/comments/route'
import { testPrisma, createTestWriter, createTestPost } from './helpers/db'

// Mock Resend so tests don't actually send emails
vi.mock('@/lib/resend', () => ({
  sendCommentReplyEmail: vi.fn().mockResolvedValue(undefined),
}))

import { sendCommentReplyEmail } from '@/lib/resend'
const mockSendEmail = vi.mocked(sendCommentReplyEmail)

describe('POST /api/comments', () => {
  let postId: string

  beforeEach(async () => {
    const writer = await createTestWriter()
    const post = await createTestPost(writer.id)
    postId = post.id
  })

  it('creates a top-level comment on a published post', async () => {
    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        authorName: 'Test Reader',
        authorEmail: 'reader@test.com',
        content: 'Great post!',
        notifyReply: true,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.data.authorName).toBe('Test Reader')
    expect(json.data.content).toBe('Great post!')
    // Email must never be in the response
    expect(json.data.authorEmail).toBeUndefined()
  })

  it('rejects comments on draft posts', async () => {
    const writer = await createTestWriter()
    const draftPost = await createTestPost(writer.id, {
      status: 'DRAFT',
      slug: 'draft-post-for-comment',
    })

    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: draftPost.id,
        authorName: 'Reader',
        authorEmail: 'reader@test.com',
        content: 'Hello',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('sends reply notification email to parent author', async () => {
    // Create parent comment
    const parent = await testPrisma.comment.create({
      data: {
        postId,
        authorName: 'Parent Author',
        authorEmail: 'parent@test.com',
        content: 'Original comment',
        notifyReply: true,
        status: 'APPROVED',
      },
    })

    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        parentId: parent.id,
        authorName: 'Replier',
        authorEmail: 'replier@test.com',
        content: 'Great point!',
      }),
    })

    await POST(req)
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'parent@test.com' })
    )
  })

  it('does not send notification when replier is the same person', async () => {
    mockSendEmail.mockClear()

    const parent = await testPrisma.comment.create({
      data: {
        postId,
        authorName: 'Same Person',
        authorEmail: 'same@test.com',
        content: 'My comment',
        notifyReply: true,
        status: 'APPROVED',
      },
    })

    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        parentId: parent.id,
        authorName: 'Same Person',
        authorEmail: 'same@test.com',  // Same email as parent
        content: 'Replying to myself',
      }),
    })

    await POST(req)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('rejects replies to replies (max 1 level nesting)', async () => {
    const parent = await testPrisma.comment.create({
      data: { postId, authorName: 'P', authorEmail: 'p@t.com', content: 'parent', status: 'APPROVED' },
    })
    const reply = await testPrisma.comment.create({
      data: { postId, parentId: parent.id, authorName: 'R', authorEmail: 'r@t.com', content: 'reply', status: 'APPROVED' },
    })

    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        parentId: reply.id,  // Replying to a reply
        authorName: 'RR',
        authorEmail: 'rr@t.com',
        content: 'nested reply',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('validates required fields', async () => {
    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        authorName: '',     // Empty name — invalid
        authorEmail: 'not-an-email',
        content: 'hi',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)  // Zod parse error handled by catch
  })
})
```

### auth.test.ts

```typescript
// tests/integration/auth.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST as InvitePost } from '@/app/api/invite/route'
import { POST as AcceptPost } from '@/app/api/invite/accept/route'
import { testPrisma, createTestAdmin, createTestWriter } from './helpers/db'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/resend', () => ({ sendInviteEmail: vi.fn().mockResolvedValue(undefined) }))

import { auth } from '@/lib/auth'
const mockAuth = vi.mocked(auth)

describe('POST /api/invite', () => {
  it('rejects non-admin users', async () => {
    const writer = await createTestWriter()
    mockAuth.mockResolvedValue({
      user: { id: writer.id, role: 'WRITER', name: writer.name, email: writer.email, username: writer.username },
      expires: '',
    })

    const req = new Request('http://localhost/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@test.com' }),
    })

    const res = await InvitePost(req)
    expect(res.status).toBe(401)
  })

  it('creates invite and sends email for admin', async () => {
    const admin = await createTestAdmin()
    mockAuth.mockResolvedValue({
      user: { id: admin.id, role: 'ADMIN', name: admin.name, email: admin.email, username: admin.username },
      expires: '',
    })

    const req = new Request('http://localhost/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'newwriter@test.com' }),
    })

    const res = await InvitePost(req)
    expect(res.status).toBe(201)

    const invite = await testPrisma.invite.findFirst({
      where: { email: 'newwriter@test.com' },
    })
    expect(invite).not.toBeNull()
    expect(invite?.status).toBe('PENDING')
  })

  it('rejects duplicate pending invite for same email', async () => {
    const admin = await createTestAdmin()
    mockAuth.mockResolvedValue({
      user: { id: admin.id, role: 'ADMIN', name: admin.name, email: admin.email, username: admin.username },
      expires: '',
    })

    // Create existing pending invite
    await testPrisma.invite.create({
      data: {
        email: 'dup@test.com',
        expiresAt: new Date(Date.now() + 86400000),
        createdById: admin.id,
      },
    })

    const req = new Request('http://localhost/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dup@test.com' }),
    })

    const res = await InvitePost(req)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/invite/accept', () => {
  it('creates user and marks invite accepted', async () => {
    const admin = await createTestAdmin()
    const invite = await testPrisma.invite.create({
      data: {
        email: 'pending@test.com',
        expiresAt: new Date(Date.now() + 86400000),
        createdById: admin.id,
      },
    })

    const req = new Request('http://localhost/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: invite.token,
        name: 'New Writer',
        username: 'newwriter',
      }),
    })

    const res = await AcceptPost(req)
    expect(res.status).toBe(201)

    const user = await testPrisma.user.findUnique({ where: { email: 'pending@test.com' } })
    expect(user?.role).toBe('WRITER')

    const updatedInvite = await testPrisma.invite.findUnique({ where: { id: invite.id } })
    expect(updatedInvite?.status).toBe('ACCEPTED')
  })

  it('rejects expired invite tokens', async () => {
    const admin = await createTestAdmin()
    const invite = await testPrisma.invite.create({
      data: {
        email: 'expired@test.com',
        expiresAt: new Date(Date.now() - 1000),  // Already expired
        createdById: admin.id,
      },
    })

    const req = new Request('http://localhost/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: invite.token, name: 'X', username: 'xuser' }),
    })

    const res = await AcceptPost(req)
    expect(res.status).toBe(400)
  })

  it('rejects duplicate usernames', async () => {
    const admin = await createTestAdmin()
    await createTestWriter()  // Has username 'testwriter'

    const invite = await testPrisma.invite.create({
      data: {
        email: 'another@test.com',
        expiresAt: new Date(Date.now() + 86400000),
        createdById: admin.id,
      },
    })

    const req = new Request('http://localhost/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: invite.token,
        name: 'Another Writer',
        username: 'testwriter',  // Already taken
      }),
    })

    const res = await AcceptPost(req)
    expect(res.status).toBe(400)
  })
})
```

### newsletter.test.ts

```typescript
// tests/integration/newsletter.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST as Subscribe } from '@/app/api/newsletter/subscribe/route'
import { POST as Unsubscribe } from '@/app/api/newsletter/unsubscribe/route'
import { testPrisma } from './helpers/db'

vi.mock('@/lib/resend', () => ({
  sendSubscribeConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendNewsletterBroadcast: vi.fn().mockResolvedValue(undefined),
}))

describe('POST /api/newsletter/subscribe', () => {
  it('creates new subscriber', async () => {
    const req = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sub@test.com' }),
    })

    const res = await Subscribe(req)
    expect(res.status).toBe(201)

    const sub = await testPrisma.newsletterSubscriber.findUnique({
      where: { email: 'sub@test.com' },
    })
    expect(sub?.status).toBe('ACTIVE')
  })

  it('returns 200 silently for already subscribed email', async () => {
    await testPrisma.newsletterSubscriber.create({
      data: { email: 'existing@test.com', status: 'ACTIVE' },
    })

    const req = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'existing@test.com' }),
    })

    const res = await Subscribe(req)
    expect(res.status).toBe(200)
  })

  it('reactivates previously unsubscribed email', async () => {
    await testPrisma.newsletterSubscriber.create({
      data: {
        email: 'resubscribe@test.com',
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
      },
    })

    const req = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'resubscribe@test.com' }),
    })

    await Subscribe(req)

    const sub = await testPrisma.newsletterSubscriber.findUnique({
      where: { email: 'resubscribe@test.com' },
    })
    expect(sub?.status).toBe('ACTIVE')
    expect(sub?.unsubscribedAt).toBeNull()
  })
})

describe('POST /api/newsletter/unsubscribe', () => {
  it('unsubscribes by token', async () => {
    const sub = await testPrisma.newsletterSubscriber.create({
      data: { email: 'unsub@test.com', status: 'ACTIVE' },
    })

    const req = new Request('http://localhost/api/newsletter/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sub.token }),
    })

    const res = await Unsubscribe(req)
    expect(res.status).toBe(200)

    const updated = await testPrisma.newsletterSubscriber.findUnique({
      where: { email: 'unsub@test.com' },
    })
    expect(updated?.status).toBe('UNSUBSCRIBED')
    expect(updated?.unsubscribedAt).not.toBeNull()
  })

  it('returns 404 for invalid token', async () => {
    const req = new Request('http://localhost/api/newsletter/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token-xyz' }),
    })

    const res = await Unsubscribe(req)
    expect(res.status).toBe(404)
  })
})
```

---

## 5. End-to-End Tests

E2E tests run against the real running app. They require a seeded test database with at least one admin user. Use a separate `.env.test.local` for E2E that points to the test database.

### Test helpers

```typescript
// tests/e2e/helpers/auth.ts
import { Page } from '@playwright/test'

// Log in as admin by directly creating a session in the DB
// (bypasses email magic link for test speed)
export async function loginAsAdmin(page: Page) {
  // Use the API route with a test-only bypass — only available when NODE_ENV=test
  await page.request.post('/api/test/login', {
    data: { role: 'ADMIN' },
  })
  await page.reload()
}

export async function loginAsWriter(page: Page) {
  await page.request.post('/api/test/login', {
    data: { role: 'WRITER' },
  })
  await page.reload()
}
```

> **Note:** Create `app/api/test/login/route.ts` that only works when `NODE_ENV === 'test'`. It creates a real session in the database for the test admin/writer users created by the seed script. Never deploy this route to production — guard it with `if (process.env.NODE_ENV !== 'test') return Response.json({ error: 'Not found' }, { status: 404 })`.

### post-flow.spec.ts

```typescript
// tests/e2e/post-flow.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsWriter } from './helpers/auth'

test.describe('Writer post flow', () => {
  test('writer can create, edit, and publish a post', async ({ page }) => {
    await loginAsWriter(page)

    // Navigate to new post
    await page.goto('/dashboard/new')
    await expect(page).toHaveURL('/dashboard/new')

    // Fill in title
    await page.click('[placeholder="Post title..."]')
    await page.fill('[placeholder="Post title..."]', 'My E2E Test Post')

    // Fill in editor
    await page.click('.ProseMirror')
    await page.type('.ProseMirror', 'This is the post body content.')

    // Save as draft
    await page.click('button:has-text("Save draft")')
    await page.waitForURL('/dashboard/edit/**')

    // Verify it appears in dashboard
    await page.goto('/dashboard')
    await expect(page.locator('text=My E2E Test Post')).toBeVisible()
    await expect(page.locator('text=Draft')).toBeVisible()

    // Publish the post
    await page.goto('/dashboard')
    await page.click('a:has-text("Edit"):near(:text("My E2E Test Post"))')
    await page.click('button:has-text("Publish")')
    await page.waitForURL('/my-e2e-test-post')

    // Verify post is live
    await expect(page.locator('h1')).toContainText('My E2E Test Post')
    await expect(page.locator('text=This is the post body content.')).toBeVisible()
  })

  test('draft post is not visible to visitors', async ({ page }) => {
    await loginAsWriter(page)
    await page.goto('/dashboard/new')
    await page.fill('[placeholder="Post title..."]', 'Secret Draft Post')
    await page.click('.ProseMirror')
    await page.type('.ProseMirror', 'Draft content')
    await page.click('button:has-text("Save draft")')
    await page.waitForURL('/dashboard/edit/**')

    // Log out and try to access the draft
    await page.goto('/')
    const res = await page.request.get('/secret-draft-post')
    expect(res.status()).toBe(404)
  })
})
```

### comment-flow.spec.ts

```typescript
// tests/e2e/comment-flow.spec.ts
import { test, expect } from '@playwright/test'

// Assumes a published post with slug 'test-post' exists in the seed data
test.describe('Comment flow', () => {
  test('visitor can post a comment', async ({ page }) => {
    await page.goto('/test-post')

    await page.fill('input[placeholder="Your name"]', 'Test Visitor')
    await page.fill('input[placeholder="your@email.com"]', 'visitor@test.com')
    await page.fill('textarea', 'This is my comment!')
    await page.click('button:has-text("Post comment")')

    await expect(page.locator('text=This is my comment!')).toBeVisible()
    await expect(page.locator('text=Test Visitor')).toBeVisible()
  })

  test('visitor can reply to a comment', async ({ page }) => {
    await page.goto('/test-post')

    // Post a top-level comment first
    await page.fill('input[placeholder="Your name"]', 'Original Commenter')
    await page.fill('input[placeholder="your@email.com"]', 'orig@test.com')
    await page.fill('textarea', 'Original comment')
    await page.click('button:has-text("Post comment")')
    await expect(page.locator('text=Original comment')).toBeVisible()

    // Reply to it
    await page.click('button:has-text("Reply"):near(:text("Original comment"))')
    await page.fill('input[placeholder="Your name"]', 'Replier')
    await page.fill('input[placeholder="your@email.com"]', 'rep@test.com')
    await page.fill('textarea[placeholder="Write your reply..."]', 'My reply!')
    await page.click('button:has-text("Post reply")')

    await expect(page.locator('text=My reply!')).toBeVisible()
  })
})
```

### search-flow.spec.ts

```typescript
// tests/e2e/search-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Search flow', () => {
  test('search bar shows inline results', async ({ page }) => {
    await page.goto('/')

    await page.fill('input[placeholder="Search posts..."]', 'ufotable')
    // Wait for debounce + network
    await page.waitForResponse('**/api/search**')

    const dropdown = page.locator('[class*="absolute"]:near(input[placeholder="Search posts..."])')
    await expect(dropdown).toBeVisible()
  })

  test('pressing Enter navigates to full search page', async ({ page }) => {
    await page.goto('/')

    await page.fill('input[placeholder="Search posts..."]', 'frieren')
    await page.press('input[placeholder="Search posts..."]', 'Enter')

    await page.waitForURL('**/search?q=frieren')
    await expect(page.locator('h1')).toContainText('frieren')
  })

  test('search page shows no results message for unknown term', async ({ page }) => {
    await page.goto('/search?q=xyzunknownterm9999')
    await expect(page.locator('text=No posts matched')).toBeVisible()
  })
})
```

### newsletter-flow.spec.ts

```typescript
// tests/e2e/newsletter-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Newsletter flow', () => {
  test('visitor can subscribe to newsletter', async ({ page }) => {
    await page.goto('/')

    await page.fill('input[placeholder="your@email.com"]:near(:text("Newsletter"))', 'newstest@test.com')
    await page.click('button:has-text("Subscribe")')

    await expect(page.locator('text=Subscribed successfully')).toBeVisible()
  })

  test('unsubscribe page processes token and shows confirmation', async ({ page }) => {
    // First subscribe
    await page.request.post('/api/newsletter/subscribe', {
      data: { email: 'unsub-e2e@test.com' },
    })

    // Get the token from the DB (via test helper API)
    const tokenRes = await page.request.get('/api/test/newsletter-token?email=unsub-e2e@test.com')
    const { token } = await tokenRes.json()

    await page.goto(`/unsubscribe?token=${token}`)
    await expect(page.locator('text=unsubscribed')).toBeVisible()
  })
})
```

---

## 6. GitHub Actions CI

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-and-integration:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: animeblog_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/animeblog_test
      DIRECT_URL: postgresql://postgres:postgres@localhost:5432/animeblog_test
      NEXTAUTH_SECRET: ci-test-secret
      NEXT_PUBLIC_APP_URL: http://localhost:3000
      NEXT_PUBLIC_APP_NAME: Anime Blog Test

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Run Prisma migrations on test DB
        run: npx prisma migrate deploy

      - name: Run unit and integration tests
        run: npx vitest run --reporter=verbose

  e2e:
    runs-on: ubuntu-latest
    needs: unit-and-integration

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: animeblog_e2e
        ports:
          - 5432:5432

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/animeblog_e2e
      NEXTAUTH_SECRET: ci-test-secret
      NEXT_PUBLIC_APP_URL: http://localhost:3000
      NEXT_PUBLIC_APP_NAME: Anime Blog E2E
      NODE_ENV: test
      # Mock email — never actually send in CI
      RESEND_API_KEY: re_test_fake_key

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run Prisma migrations + seed
        run: |
          npx prisma migrate deploy
          npx prisma db seed

      - name: Run E2E tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 7. Running Tests Locally

```bash
# Unit + integration tests (watch mode)
npx vitest

# Unit + integration tests (single run)
npx vitest run

# E2E tests (requires dev server running)
npm run dev &
npx playwright test

# E2E tests with UI (interactive)
npx playwright test --ui

# Run a specific test file
npx vitest run tests/unit/utils.test.ts
npx playwright test tests/e2e/post-flow.spec.ts
```

---

## 8. Checklist

- [ ] Install Vitest, Playwright, Testing Library, MSW
- [ ] Create `vitest.config.ts`
- [ ] Create `playwright.config.ts`
- [ ] Create `tests/setup.ts`
- [ ] Create `tests/integration/helpers/db.ts` with truncation + factory functions
- [ ] Create `tests/unit/utils.test.ts`
- [ ] Create `tests/unit/search.test.ts`
- [ ] Create `tests/unit/seo.test.ts`
- [ ] Create `tests/integration/posts.test.ts`
- [ ] Create `tests/integration/comments.test.ts`
- [ ] Create `tests/integration/auth.test.ts`
- [ ] Create `tests/integration/newsletter.test.ts`
- [ ] Create `app/api/test/login/route.ts` (test-only session helper, guarded by NODE_ENV check)
- [ ] Create `app/api/test/newsletter-token/route.ts` (test-only token lookup, guarded by NODE_ENV check)
- [ ] Create `tests/e2e/post-flow.spec.ts`
- [ ] Create `tests/e2e/comment-flow.spec.ts`
- [ ] Create `tests/e2e/search-flow.spec.ts`
- [ ] Create `tests/e2e/newsletter-flow.spec.ts`
- [ ] Create `.github/workflows/test.yml`
- [ ] Add `.env.test` to `.gitignore` (contains local DB credentials)
- [ ] Verify all unit tests pass: `npx vitest run`
- [ ] Verify all integration tests pass against the test database
- [ ] Verify all E2E tests pass: `npx playwright test`
- [ ] Verify GitHub Actions pipeline goes green on a test push
