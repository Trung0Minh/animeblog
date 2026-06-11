import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
    },
    post: {
      findUnique: vi.fn(),
    },
    tag: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))

import { generateMetadata as postMetadata } from "@/app/(public)/[slug]/page"
import { generateMetadata as authorMetadata } from "@/app/(public)/authors/[username]/page"
import { generateMetadata as categoryMetadata } from "@/app/(public)/category/[slug]/page"
import { generateMetadata as contributorsMetadata } from "@/app/(public)/contributors/page"
import { generateMetadata as homeMetadata } from "@/app/(public)/page"
import { generateMetadata as searchMetadata } from "@/app/(public)/search/page"
import { generateMetadata as tagMetadata } from "@/app/(public)/tag/[slug]/page"

describe("public page metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_NAME = "Eizou Blog"
    process.env.NEXT_PUBLIC_APP_URL = "https://eizou.example"
  })

  it("sets homepage canonical URLs and noindexes paginated pages", async () => {
    await expect(
      homeMetadata({ searchParams: Promise.resolve({}) }),
    ).resolves.toMatchObject({
      alternates: { canonical: "https://eizou.example" },
      title: { absolute: "Eizou Blog" },
    })

    await expect(
      homeMetadata({ searchParams: Promise.resolve({ page: "2" }) }),
    ).resolves.toMatchObject({
      alternates: { canonical: "https://eizou.example?page=2" },
      robots: { follow: true, index: false },
    })
  })

  it("builds article metadata for published posts", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      author: { name: "Mina Writer" },
      coverUrl: "https://cdn.example.com/frieren.jpg",
      excerpt: "A close read of memory.",
      publishedAt: new Date("2026-01-02T03:04:05.000Z"),
      tags: [{ tag: { name: "Sakuga" } }, { tag: { name: "Fantasy" } }],
      title: "Frieren and memory",
    })

    const metadata = await postMetadata({
      params: Promise.resolve({ slug: "frieren-memory" }),
    })

    expect(mocks.prisma.post.findUnique).toHaveBeenCalledWith({
      select: {
        author: { select: { name: true } },
        coverUrl: true,
        excerpt: true,
        publishedAt: true,
        tags: { select: { tag: { select: { name: true } } } },
        title: true,
      },
      where: { slug: "frieren-memory", status: "PUBLISHED" },
    })
    expect(metadata).toMatchObject({
      alternates: { canonical: "https://eizou.example/frieren-memory" },
      description: "A close read of memory.",
      title: "Frieren and memory",
    })
    expect(metadata.openGraph).toMatchObject({
      authors: ["Mina Writer"],
      publishedTime: "2026-01-02T03:04:05.000Z",
      tags: ["Sakuga", "Fantasy"],
      title: "Frieren and memory | Eizou Blog",
      type: "article",
    })
  })

  it("noindexes missing post metadata", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(null)

    await expect(
      postMetadata({ params: Promise.resolve({ slug: "missing" }) }),
    ).resolves.toMatchObject({
      robots: { follow: false, index: false },
    })
  })

  it("builds category, tag, author, contributors, and search metadata", async () => {
    mocks.prisma.category.findUnique.mockResolvedValue({
      description: "Production-focused essays.",
      name: "Analysis",
    })
    mocks.prisma.tag.findUnique.mockResolvedValue({ name: "Sakuga" })
    mocks.prisma.user.findUnique.mockResolvedValue({
      avatarUrl: "https://cdn.example.com/mina.jpg",
      bio: "Production notes and layout analysis.",
      name: "Mina Writer",
    })

    await expect(
      categoryMetadata({
        params: Promise.resolve({ slug: "analysis" }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toMatchObject({
      description: "Production-focused essays.",
      title: "Analysis",
    })
    await expect(
      tagMetadata({
        params: Promise.resolve({ slug: "sakuga" }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toMatchObject({
      description: "Posts tagged with Sakuga",
      title: "#Sakuga",
    })
    await expect(
      authorMetadata({
        params: Promise.resolve({ username: "mina" }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toMatchObject({
      description: "Production notes and layout analysis.",
      title: "Mina Writer",
    })
    await expect(contributorsMetadata()).resolves.toMatchObject({
      description: "Meet the writers behind Eizou Blog.",
      title: "Contributors",
    })
    await expect(
      searchMetadata({ searchParams: Promise.resolve({ q: "frieren" }) }),
    ).resolves.toMatchObject({
      robots: { follow: false, index: false },
      title: "Search: frieren",
    })
  })
})
