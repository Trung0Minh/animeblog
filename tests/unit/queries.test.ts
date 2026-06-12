import { beforeEach, describe, expect, it, vi } from "vitest"

type CacheEntry = {
  keyParts: string[]
  options: { revalidate?: number; tags?: string[] }
}

const mocks = vi.hoisted(() => {
  const cacheEntries: CacheEntry[] = []
  const prisma = {
    $transaction: vi.fn(),
    category: { findMany: vi.fn() },
    post: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    user: { findMany: vi.fn() },
  }

  return {
    cacheEntries,
    prisma,
    unstableCache: vi.fn(
      <Args extends unknown[], Result>(
        callback: (...args: Args) => Promise<Result>,
        keyParts: string[],
        options: CacheEntry["options"],
      ) => {
        cacheEntries.push({ keyParts, options })
        return callback
      },
    ),
  }
})

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({ unstable_cache: mocks.unstableCache }))

import {
  getCachedContributors,
  getCachedPublishedPost,
  getCachedPublishedPosts,
  getCachedSidebarData,
} from "@/lib/queries"

describe("cached Prisma query helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.$transaction.mockImplementation(async (input) =>
      Promise.all(input),
    )
  })

  it("caches paginated published post lists behind the posts tag", async () => {
    mocks.prisma.post.findMany.mockResolvedValue([{ slug: "essay" }])
    mocks.prisma.post.count.mockResolvedValue(1)

    await expect(getCachedPublishedPosts(2, 10)).resolves.toEqual({
      posts: [{ slug: "essay" }],
      total: 1,
    })

    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        skip: 10,
        take: 10,
        where: { status: "PUBLISHED" },
      }),
    )
    const select = mocks.prisma.post.findMany.mock.calls[0]?.[0].select
    expect(select.author.select).not.toHaveProperty("email")
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["published-posts"],
      options: { revalidate: 60, tags: ["posts"] },
    })
  })

  it("caches sidebar data behind posts and categories tags", async () => {
    mocks.prisma.category.findMany.mockResolvedValue([{ slug: "analysis" }])
    mocks.prisma.post.findMany.mockResolvedValue([{ slug: "recent" }])

    await expect(getCachedSidebarData()).resolves.toEqual({
      categories: [{ slug: "analysis" }],
      recentPosts: [{ slug: "recent" }],
    })

    expect(mocks.prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
        select: expect.objectContaining({
          _count: expect.any(Object),
          children: expect.any(Object),
        }),
        where: { parentId: null },
      }),
    )
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["sidebar-data"],
      options: { revalidate: 300, tags: ["posts", "categories"] },
    })
  })

  it("caches published post detail and comments for post pages", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      comments: [],
      slug: "essay",
    })

    await expect(getCachedPublishedPost("essay")).resolves.toEqual({
      comments: [],
      slug: "essay",
    })

    expect(mocks.prisma.post.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "essay", status: "PUBLISHED" },
      }),
    )
    const select = mocks.prisma.post.findUnique.mock.calls[0]?.[0].select
    expect(select.author.select).not.toHaveProperty("email")
    expect(select.comments.select).not.toHaveProperty("authorEmail")
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["published-post"],
      options: { revalidate: 300, tags: ["posts", "comments"] },
    })
  })

  it("caches contributors without exposing private email addresses", async () => {
    mocks.prisma.user.findMany.mockResolvedValue([
      { name: "Mina", username: "mina" },
    ])

    await expect(getCachedContributors()).resolves.toEqual([
      { name: "Mina", username: "mina" },
    ])

    expect(mocks.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
        where: { role: { in: ["ADMIN", "WRITER"] } },
      }),
    )
    const select = mocks.prisma.user.findMany.mock.calls[0]?.[0].select
    expect(select).not.toHaveProperty("email")
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["contributors"],
      options: { revalidate: 300, tags: ["posts", "users"] },
    })
  })
})
