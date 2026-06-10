# 01 — Database Schema

## 1. Overview

The database is **PostgreSQL** hosted on Supabase. All schema is defined in `prisma/schema.prisma`. This file documents every model, its fields, relationships, indexes, and the reasoning behind each design decision.

---

## 2. Full Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // Required by Supabase for direct connections (migrations)
}

// ─────────────────────────────────────────
// USER & AUTH
// ─────────────────────────────────────────

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  username    String   @unique   // Used in public URLs: /authors/[username]
  bio         String?  @db.Text
  avatarUrl   String?
  role        Role     @default(WRITER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  posts            Post[]       @relation("PostPrimaryAuthor")
  coAuthoredPosts  PostAuthor[]
  accounts         Account[]
  sessions         Session[]
  invitesSent      Invite[]     @relation("InviteCreatedBy")

  @@index([username])
  @@map("users")
}

enum Role {
  WRITER
  ADMIN
}

// NextAuth.js required models — do not rename fields
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// Invite-only writer onboarding
model Invite {
  id          String       @id @default(cuid())
  email       String
  token       String       @unique @default(cuid())
  status      InviteStatus @default(PENDING)
  expiresAt   DateTime     // Set to now() + 7 days at creation
  createdAt   DateTime     @default(now())
  createdById String

  createdBy User @relation("InviteCreatedBy", fields: [createdById], references: [id])

  @@index([token])
  @@index([email])
  @@map("invites")
}

enum InviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
}

// ─────────────────────────────────────────
// CONTENT
// ─────────────────────────────────────────

model Post {
  id          String     @id @default(cuid())
  title       String
  slug        String     @unique
  excerpt     String?    @db.Text  // Short summary shown on homepage cards
  coverUrl    String?              // Image/GIF URL from R2 (16:9 ratio expected)
  coverAlt    String?              // Accessibility alt text for cover
  content     Json                 // Tiptap editor JSON output
  contentText String?    @db.Text  // Stripped plain text — used for full-text search indexing
  status      PostStatus @default(DRAFT)
  publishedAt DateTime?            // Null when draft, set when first published
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Primary author (required)
  authorId  String
  author    User   @relation("PostPrimaryAuthor", fields: [authorId], references: [id])

  // Co-authors (optional, via junction table)
  coAuthors PostAuthor[]

  // Taxonomy
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])
  tags       PostTag[]

  // Community
  comments Comment[]

  // Full-text search — PostgreSQL tsvector, managed by a DB trigger (see migration below)
  searchVector Unsupported("tsvector")? @map("search_vector")

  @@index([slug])
  @@index([status, publishedAt(sort: Desc)])
  @@index([authorId])
  @@index([categoryId])
  @@map("posts")
}

enum PostStatus {
  DRAFT
  PUBLISHED
}

// Junction table: co-authors on a post
// Primary author is stored on Post.authorId — this table is for additional authors only
model PostAuthor {
  postId String
  userId String
  order  Int    @default(0)  // Display order of co-author names

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([postId, userId])
  @@map("post_authors")
}

// ─────────────────────────────────────────
// TAXONOMY
// ─────────────────────────────────────────

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?   @db.Text
  parentId    String?   // Self-referential for two-level hierarchy (parent → child)
  createdAt   DateTime  @default(now())

  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  posts    Post[]

  @@index([slug])
  @@map("categories")
}

model Tag {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  createdAt DateTime  @default(now())

  posts PostTag[]

  @@index([slug])
  @@map("tags")
}

// Junction table: many-to-many Post ↔ Tag
model PostTag {
  postId String
  tagId  String

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("post_tags")
}

// ─────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────

model Comment {
  id          String        @id @default(cuid())
  postId      String
  parentId    String?       // null = top-level; set = reply to another comment
  authorName  String        // Display name entered by guest
  authorEmail String        // Email for reply notifications — never shown publicly
  content     String        @db.Text
  status      CommentStatus @default(APPROVED)
  notifyReply Boolean       @default(true)  // Whether guest wants email on reply
  createdAt   DateTime      @default(now())

  post    Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent  Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  replies Comment[] @relation("CommentReplies")

  @@index([postId, status])
  @@index([parentId])
  @@map("comments")
}

enum CommentStatus {
  APPROVED  // Visible (default)
  SPAM      // Hidden — marked by admin
}

// ─────────────────────────────────────────
// NEWSLETTER
// ─────────────────────────────────────────

model NewsletterSubscriber {
  id             String           @id @default(cuid())
  email          String           @unique
  status         SubscriberStatus @default(ACTIVE)
  token          String           @unique @default(cuid())  // Used in unsubscribe links
  subscribedAt   DateTime         @default(now())
  unsubscribedAt DateTime?

  @@index([email])
  @@index([token])
  @@map("newsletter_subscribers")
}

enum SubscriberStatus {
  ACTIVE
  UNSUBSCRIBED
}
```

---

## 3. Full-text Search Migration

After running `prisma migrate dev`, manually create an additional migration for the PostgreSQL full-text search trigger. Prisma does not support `tsvector` or triggers natively, so this must be raw SQL.

Create the file `prisma/migrations/[timestamp]_add_fulltext_search/migration.sql`:

```sql
-- GIN index on the tsvector column for fast full-text lookups
CREATE INDEX IF NOT EXISTS posts_search_idx
  ON posts USING GIN (search_vector);

-- Function: rebuild search_vector from title, excerpt, and plain-text content
-- Weight A = title (highest), B = excerpt, C = body text (lowest)
-- Using 'simple' dictionary instead of 'english' to support Vietnamese and multilingual content
CREATE OR REPLACE FUNCTION posts_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW."contentText", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, public;

-- Trigger: fire before every INSERT or UPDATE on posts
CREATE TRIGGER posts_search_vector_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();
```

> **Why `simple` instead of `english`?** The `english` dictionary applies stemming (e.g. "running" → "run"), which breaks non-English content. `simple` tokenizes without stemming, making it safe for Vietnamese, Japanese titles, and mixed-language posts.

---

## 4. Key Relationships Explained

### Post ↔ Authors (primary + co-authors)
- `Post.authorId` stores the **primary author** — always required.
- `PostAuthor` junction table stores **co-authors** — optional, ordered by `order` field.
- When querying a post for display, always include both:

```typescript
const post = await prisma.post.findUnique({
  where: { slug },
  include: {
    author: {
      select: { id: true, name: true, username: true, avatarUrl: true },
    },
    coAuthors: {
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
      orderBy: { order: 'asc' },
    },
    category: true,
    tags: { include: { tag: true } },
  },
})
```

### Category Hierarchy (2 levels max)
- `Category.parentId` is self-referential — a category can have a parent.
- **Max depth is 2 levels** (parent → child). Enforced at the application layer, not the DB.
- Example: `Phân tích` (parent) → `Animation Analysis` (child)
- Never query deeper than one `include: { children: true }` level.

### Comment Threading (1 level replies)
- `Comment.parentId = null` → top-level comment on a post.
- `Comment.parentId = someId` → direct reply to that comment.
- **Replies to replies are not allowed.** Enforced in `POST /api/comments`: if the target comment itself has a `parentId`, reject the request with 400.

### CommentStatus
- Default is `APPROVED` — comments are immediately visible (writers are trusted guests).
- Admin can set status to `SPAM` to hide a comment without deleting it.
- If moderation is needed in the future, change the default to `PENDING` and add an admin approval queue.

---

## 5. Prisma Client Singleton

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

> **Why a singleton?** In Next.js development mode, hot reloading creates new module instances on every change. Without the singleton, each reload would open a new database connection, quickly exhausting the connection pool.

---

## 6. Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      username: 'admin',
      role: Role.ADMIN,
      bio: 'Blog administrator',
    },
  })

  // Top-level categories
  const analysis = await prisma.category.upsert({
    where: { slug: 'analysis' },
    update: {},
    create: {
      name: 'Analysis',
      slug: 'analysis',
      description: 'In-depth breakdowns of animation, story, and characters',
    },
  })

  await prisma.category.upsert({
    where: { slug: 'reviews' },
    update: {},
    create: {
      name: 'Reviews',
      slug: 'reviews',
      description: 'Episodic and series reviews',
    },
  })

  // Sub-categories (children of Analysis)
  await prisma.category.upsert({
    where: { slug: 'animation-analysis' },
    update: {},
    create: {
      name: 'Animation Analysis',
      slug: 'animation-analysis',
      parentId: analysis.id,
    },
  })

  await prisma.category.upsert({
    where: { slug: 'narrative-analysis' },
    update: {},
    create: {
      name: 'Narrative Analysis',
      slug: 'narrative-analysis',
      parentId: analysis.id,
    },
  })

  // Tags
  const tagNames = [
    'Ufotable', 'MAPPA', 'WIT Studio', 'Science SARU',
    'Sakuga', 'Shonen', 'Seinen', 'Josei',
  ]

  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    })
  }

  console.log('✅ Seed completed. Admin user:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

Add to `prisma.config.ts`:
```typescript
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --compiler-options \'{"module":"CommonJS"}\' prisma/seed.ts',
  },
})
```

---

## 7. Checklist

- [x] Create `prisma/schema.prisma` with all models above
- [x] Run `npx prisma migrate dev --name init`
- [x] Manually create the full-text search migration SQL file
- [x] Run `npx prisma db seed`
- [x] Create `lib/prisma.ts` with the singleton pattern shown above
- [x] Confirm all tables exist in the Supabase dashboard
- [x] Confirm the `posts_search_vector_trigger` trigger is active (check in Supabase SQL editor: `SELECT tgname FROM pg_trigger WHERE tgrelid = 'posts'::regclass;`)
- [x] Enable RLS on every table in the exposed `public` schema before using Supabase API keys
