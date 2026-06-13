import { randomUUID } from "node:crypto"
import { PrismaClient, type Prisma, type Role } from "@prisma/client"

export const testPrisma = new PrismaClient()

const TABLES = [
  "analytics_daily_sessions",
  "analytics_daily_visitors",
  "analytics_daily_pages",
  "analytics_daily_summaries",
  "analytics_events",
  "comments",
  "post_tags",
  "post_authors",
  "posts",
  "tags",
  "categories",
  "invites",
  "sessions",
  "accounts",
  "verification_tokens",
  "password_reset_tokens",
  "newsletter_subscribers",
  "users",
]

function uniqueSuffix() {
  return randomUUID().slice(0, 8)
}

export async function truncateTestDatabase() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("truncateTestDatabase can only run with NODE_ENV=test")
  }

  await testPrisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`,
  )
}

export async function createTestUser(
  input: {
    email?: string
    name?: string
    role?: Role
    username?: string
  } = {},
) {
  const suffix = uniqueSuffix()
  const role = input.role ?? "WRITER"

  return testPrisma.user.create({
    data: {
      email: input.email ?? `${role.toLowerCase()}-${suffix}@example.com`,
      name: input.name ?? `Test ${role.toLowerCase()}`,
      role,
      username: input.username ?? `${role.toLowerCase()}-${suffix}`,
    },
    select: {
      email: true,
      id: true,
      name: true,
      role: true,
      username: true,
    },
  })
}

export async function createTestCategory(
  input: { name?: string; slug?: string } = {},
) {
  const suffix = uniqueSuffix()

  return testPrisma.category.create({
    data: {
      name: input.name ?? `Test Category ${suffix}`,
      slug: input.slug ?? `test-category-${suffix}`,
    },
    select: { id: true, name: true, slug: true },
  })
}

export async function createTestPost(
  input: {
    authorId?: string
    content?: Prisma.InputJsonObject
    contentText?: string
    slug?: string
    status?: "DRAFT" | "PUBLISHED"
    title?: string
  } = {},
) {
  const suffix = uniqueSuffix()
  const author =
    input.authorId ??
    (
      await createTestUser({
        email: `post-author-${suffix}@example.com`,
        username: `post-author-${suffix}`,
      })
    ).id
  const status = input.status ?? "PUBLISHED"

  return testPrisma.post.create({
    data: {
      authorId: author,
      content: input.content ?? {
        content: [
          {
            content: [{ text: "Test post body", type: "text" }],
            type: "paragraph",
          },
        ],
        type: "doc",
      },
      contentText: input.contentText ?? "Test post body",
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      slug: input.slug ?? `test-post-${suffix}`,
      status,
      title: input.title ?? `Test post ${suffix}`,
    },
    select: {
      id: true,
      slug: true,
      status: true,
      title: true,
    },
  })
}
