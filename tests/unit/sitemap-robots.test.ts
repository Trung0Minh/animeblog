import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  prisma: {
    category: {
      findMany: vi.fn(),
    },
    post: {
      findMany: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))

import robots from "@/app/robots"
import sitemap from "@/app/sitemap"

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = "https://eizou.example"
    mocks.prisma.post.findMany.mockResolvedValue([
      {
        slug: "frieren-memory",
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ])
    mocks.prisma.category.findMany.mockResolvedValue([{ slug: "analysis" }])
    mocks.prisma.tag.findMany.mockResolvedValue([{ slug: "sakuga" }])
    mocks.prisma.user.findMany.mockResolvedValue([{ username: "mina" }])
  })

  it("lists static pages and indexable dynamic public pages", async () => {
    const entries = await sitemap()

    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ priority: 1, url: "https://eizou.example" }),
        expect.objectContaining({
          url: "https://eizou.example/contributors",
        }),
        expect.objectContaining({
          lastModified: new Date("2026-01-02T00:00:00.000Z"),
          url: "https://eizou.example/frieren-memory",
        }),
        expect.objectContaining({
          url: "https://eizou.example/category/analysis",
        }),
        expect.objectContaining({ url: "https://eizou.example/tag/sakuga" }),
        expect.objectContaining({ url: "https://eizou.example/authors/mina" }),
      ]),
    )
    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith({
      orderBy: { publishedAt: "desc" },
      select: { slug: true, updatedAt: true },
      where: { status: "PUBLISHED" },
    })
    expect(mocks.prisma.user.findMany).toHaveBeenCalledWith({
      select: { username: true },
      where: { role: { in: ["ADMIN", "WRITER"] } },
    })
  })
})

describe("robots", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://eizou.example"
  })

  it("allows public pages and blocks private routes", () => {
    expect(robots()).toEqual({
      rules: [
        {
          allow: "/",
          disallow: ["/dashboard/", "/admin/", "/api/", "/invite/"],
          userAgent: "*",
        },
      ],
      sitemap: "https://eizou.example/sitemap.xml",
    })
  })
})
