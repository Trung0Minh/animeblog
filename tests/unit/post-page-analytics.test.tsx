import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  postFindUnique: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findUnique: mocks.postFindUnique,
    },
  },
}))
vi.mock("@/components/posts/PostJsonLd", () => ({
  PostJsonLd: () => <script data-testid="post-json-ld" />,
}))
vi.mock("@/components/posts/PostHeader", () => ({
  PostHeader: ({ post }: { post: { title: string } }) => <h1>{post.title}</h1>,
}))
vi.mock("@/components/posts/PostBody", () => ({
  PostBody: () => <div>Post body</div>,
}))
vi.mock("@/components/comments/CommentSection", () => ({
  CommentSection: ({ postSlug }: { postSlug: string }) => (
    <div data-testid="comment-section">{postSlug}</div>
  ),
}))
vi.mock("@/components/posts/TableOfContents", () => ({
  TableOfContents: () => <nav>Table of contents</nav>,
}))
vi.mock("@/components/posts/PostReadTracker", () => ({
  PostReadTracker: ({ slug, title }: { slug: string; title: string }) => (
    <div data-testid="post-read-tracker">
      {slug}:{title}
    </div>
  ),
}))

import PostPage from "@/app/(public)/[slug]/page"

describe("PostPage analytics", () => {
  it("mounts the read tracker and passes the slug to comments", async () => {
    mocks.postFindUnique.mockResolvedValue({
      _count: { comments: 0 },
      author: { avatarUrl: null, bio: null, name: "Mina", username: "mina" },
      category: null,
      coAuthors: [],
      comments: [],
      content: { content: [], type: "doc" },
      coverAlt: null,
      coverUrl: null,
      excerpt: "A close read.",
      id: "post-1",
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      slug: "frieren-memory",
      tags: [],
      title: "Frieren and memory",
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    })

    render(
      await PostPage({
        params: Promise.resolve({ slug: "frieren-memory" }),
      }),
    )

    expect(screen.getByTestId("post-read-tracker")).toHaveTextContent(
      "frieren-memory:Frieren and memory",
    )
    expect(screen.getByTestId("comment-section")).toHaveTextContent(
      "frieren-memory",
    )
  })
})
