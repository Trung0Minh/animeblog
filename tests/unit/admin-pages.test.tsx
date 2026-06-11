import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

type PrismaCall = Record<string, unknown>

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    comment: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    invite: {
      findMany: vi.fn(),
    },
    newsletterSubscriber: {
      count: vi.fn(),
    },
    post: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/components/admin/AdminNav", () => ({
  AdminNav: () => <nav aria-label="Admin navigation">Admin navigation</nav>,
}))
vi.mock("@/components/admin/AdminPostsTable", () => ({
  AdminPostsTable: ({ posts }: { posts: unknown[] }) => (
    <div data-testid="admin-posts-table">{posts.length} posts</div>
  ),
}))
vi.mock("@/components/admin/WritersTable", () => ({
  WritersTable: ({ writers }: { writers: unknown[] }) => (
    <div data-testid="writers-table">{writers.length} writers</div>
  ),
}))
vi.mock("@/components/admin/PendingInvitesTable", () => ({
  PendingInvitesTable: ({ invites }: { invites: unknown[] }) => (
    <div data-testid="pending-invites-table">{invites.length} invites</div>
  ),
}))
vi.mock("@/components/admin/InviteWriterForm", () => ({
  InviteWriterForm: () => <form aria-label="Invite writer form" />,
}))
vi.mock("@/components/admin/AdminCommentsTable", () => ({
  AdminCommentsTable: ({ comments }: { comments: unknown[] }) => (
    <div data-testid="admin-comments-table">{comments.length} comments</div>
  ),
}))
vi.mock("@/components/admin/NewsletterBroadcastForm", () => ({
  NewsletterBroadcastForm: ({ recentPosts }: { recentPosts: unknown[] }) => (
    <div data-testid="newsletter-broadcast-form">
      {recentPosts.length} recent posts
    </div>
  ),
}))
vi.mock("@/components/admin/AnalyticsWidget", () => ({
  AnalyticsWidget: () => <div data-testid="analytics-widget">Analytics widget</div>,
}))

import AdminCommentsPage from "@/app/(admin)/admin/comments/page"
import AdminLayout, { metadata } from "@/app/(admin)/admin/layout"
import AdminDashboardPage from "@/app/(admin)/admin/page"
import AdminPostsPage from "@/app/(admin)/admin/posts/page"
import AdminNewsletterPage from "@/app/(admin)/admin/newsletter/page"
import AdminWritersPage from "@/app/(admin)/admin/writers/page"

function renderAsync(node: React.ReactNode) {
  render(<>{node}</>)
}

describe("admin layout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
  })

  it("prevents indexing admin routes", () => {
    expect(metadata).toMatchObject({
      robots: { follow: false, index: false },
    })
  })

  it("redirects non-admin users", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "writer-1", role: "WRITER" } })

    await expect(
      AdminLayout({ children: <p>Secret admin content</p> }),
    ).rejects.toThrow("redirect:/login")
    expect(mocks.redirect).toHaveBeenCalledWith("/login")
  })

  it("renders admin navigation for admins", async () => {
    renderAsync(await AdminLayout({ children: <p>Secret admin content</p> }))

    expect(
      screen.getByRole("navigation", { name: "Admin navigation" }),
    ).toBeVisible()
    expect(screen.getByText("Secret admin content")).toBeVisible()
  })
})

describe("admin server pages", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.$transaction.mockImplementation(async (input) => {
      if (Array.isArray(input)) {
        return Promise.all(input)
      }

      throw new Error("Unsupported transaction input")
    })
  })

  it("renders dashboard counts and uses active subscriber count", async () => {
    mocks.prisma.post.count
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2)
    mocks.prisma.user.count.mockResolvedValue(3)
    mocks.prisma.comment.count.mockResolvedValue(12)
    mocks.prisma.newsletterSubscriber.count.mockResolvedValue(21)

    renderAsync(await AdminDashboardPage())

    expect(screen.getByText("Admin")).toBeVisible()
    expect(screen.getByText("Published posts")).toBeVisible()
    expect(screen.getByText("Drafts")).toBeVisible()
    expect(screen.getByText("Active subscribers")).toBeVisible()
    expect(screen.getByTestId("analytics-widget")).toBeVisible()
    expect(mocks.prisma.newsletterSubscriber.count).toHaveBeenCalledWith({
      where: { status: "ACTIVE" },
    })
  })

  it("lists all posts with explicit safe selects and status filtering", async () => {
    mocks.prisma.post.findMany.mockResolvedValue([
      {
        _count: { comments: 2 },
        author: { name: "Mina", username: "mina" },
        id: "post-1",
        publishedAt: null,
        slug: "draft",
        status: "DRAFT",
        title: "Draft",
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ])
    mocks.prisma.post.count.mockResolvedValue(1)

    renderAsync(
      await AdminPostsPage({
        searchParams: Promise.resolve({ page: "2", status: "DRAFT" }),
      }),
    )

    expect(screen.getByTestId("admin-posts-table")).toHaveTextContent("1 posts")
    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
        where: { status: "DRAFT" },
      }),
    )
    const call = mocks.prisma.post.findMany.mock.calls[0]?.[0] as PrismaCall
    const author = (call.select as PrismaCall).author as PrismaCall
    expect(author.select).not.toHaveProperty("email")
  })

  it("loads active writers and pending invites for writer management", async () => {
    mocks.prisma.user.findMany.mockResolvedValue([
      {
        _count: { posts: 1 },
        createdAt: new Date("2026-01-01T00:00:00Z"),
        email: "writer@example.com",
        id: "writer-1",
        name: "Mina",
        username: "mina",
      },
    ])
    mocks.prisma.invite.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-01-01T00:00:00Z"),
        createdBy: { name: "Admin" },
        email: "new@example.com",
        expiresAt: new Date("2026-01-08T00:00:00Z"),
        id: "invite-1",
      },
    ])

    renderAsync(await AdminWritersPage())

    expect(screen.getByTestId("writers-table")).toHaveTextContent("1 writers")
    expect(screen.getByTestId("pending-invites-table")).toHaveTextContent(
      "1 invites",
    )
    expect(mocks.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "WRITER" },
      }),
    )
  })

  it("lists approved comments without selecting private author emails", async () => {
    mocks.prisma.comment.findMany.mockResolvedValue([
      {
        authorName: "Reader",
        content: "Good note",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        id: "comment-1",
        post: { slug: "post", title: "Post" },
        status: "APPROVED",
      },
    ])
    mocks.prisma.comment.count.mockResolvedValue(1)

    renderAsync(
      await AdminCommentsPage({
        searchParams: Promise.resolve({ page: "1" }),
      }),
    )

    expect(screen.getByTestId("admin-comments-table")).toHaveTextContent(
      "1 comments",
    )
    const call = mocks.prisma.comment.findMany.mock.calls[0]?.[0] as PrismaCall
    expect(call.select).not.toHaveProperty("authorEmail")
  })

  it("loads active subscriber count and recent posts for newsletter broadcasts", async () => {
    mocks.prisma.newsletterSubscriber.count.mockResolvedValue(42)
    mocks.prisma.post.findMany.mockResolvedValue([
      { id: "post-1", title: "Recent essay" },
    ])

    renderAsync(await AdminNewsletterPage())

    expect(screen.getByText("Newsletter")).toBeVisible()
    expect(screen.getByText("42 active subscribers")).toBeVisible()
    expect(screen.getByTestId("newsletter-broadcast-form")).toHaveTextContent(
      "1 recent posts",
    )
    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith({
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true },
      take: 10,
      where: { status: "PUBLISHED" },
    })
  })
})
