import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))

import { GET } from "@/app/api/search/route"

describe("search API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns empty results for an empty query without hitting the database", async () => {
    const response = await GET(new Request("https://example.test/api/search"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: {
        pagination: { limit: 10, page: 1, total: 0, totalPages: 0 },
        query: "",
        results: [],
      },
    })
    expect(mocks.prisma.$queryRaw).not.toHaveBeenCalled()
  })

  it("runs a published-post full-text search and returns pagination", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          authorAvatarUrl: null,
          authorName: "Mina",
          authorUsername: "mina",
          coverUrl: null,
          excerpt: "A post about memory.",
          id: "post-1",
          publishedAt: new Date("2024-04-01T00:00:00Z"),
          rank: 0.8,
          slug: "frieren-memory",
          snippet: "<mark>Frieren</mark> remembers.",
          title: "Frieren and memory",
        },
      ])
      .mockResolvedValueOnce([{ count: BigInt(1) }])

    const response = await GET(
      new Request("https://example.test/api/search?q=frieren&page=2&limit=5"),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: {
        pagination: { limit: 5, page: 2, total: 1, totalPages: 1 },
        query: "frieren",
        results: [{ slug: "frieren-memory" }],
      },
    })

    const firstQuery = String(mocks.prisma.$queryRaw.mock.calls[0]?.[0])
    expect(firstQuery).toContain("p.status = 'PUBLISHED'")
    expect(firstQuery).toContain("ts_headline")
  })
})
