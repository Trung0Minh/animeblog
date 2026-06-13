import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    newsletterSubscriber: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    post: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
  revalidateTag: vi.fn(),
  sendNewsletterBroadcast: vi.fn(),
  sendSubscribeConfirmationEmail: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }))
vi.mock("@/lib/resend", () => ({
  sendNewsletterBroadcast: mocks.sendNewsletterBroadcast,
  sendSubscribeConfirmationEmail: mocks.sendSubscribeConfirmationEmail,
}))

import { POST as broadcast } from "@/app/api/newsletter/broadcast/route"
import { POST as subscribe } from "@/app/api/newsletter/subscribe/route"
import { POST as unsubscribe } from "@/app/api/newsletter/unsubscribe/route"

function postRequest(path: string, body: unknown) {
  return new Request(`https://animeblog.example${path}`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.newsletterSubscriber.findUnique.mockResolvedValue(null)
    mocks.prisma.newsletterSubscriber.create.mockResolvedValue({
      email: "reader@example.com",
      token: "subscriber-token",
    })
    mocks.prisma.newsletterSubscriber.update.mockResolvedValue({
      email: "reader@example.com",
      token: "subscriber-token",
    })
    mocks.sendSubscribeConfirmationEmail.mockResolvedValue(undefined)
  })

  it("creates a new subscriber and sends a confirmation email", async () => {
    const response = await subscribe(
      postRequest("/api/newsletter/subscribe", {
        email: " Reader@Example.com ",
      }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Subscribed successfully." },
    })
    expect(mocks.prisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
      select: { email: true, status: true, token: true },
      where: { email: "reader@example.com" },
    })
    expect(mocks.prisma.newsletterSubscriber.create).toHaveBeenCalledWith({
      data: { email: "reader@example.com" },
      select: { email: true, token: true },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("newsletter", "max")
    expect(mocks.sendSubscribeConfirmationEmail).toHaveBeenCalledWith({
      to: "reader@example.com",
    })
  })

  it("returns success without sending email for an already-active subscriber", async () => {
    mocks.prisma.newsletterSubscriber.findUnique.mockResolvedValue({
      email: "reader@example.com",
      status: "ACTIVE",
      token: "subscriber-token",
    })

    const response = await subscribe(
      postRequest("/api/newsletter/subscribe", {
        email: "reader@example.com",
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { message: "You are already subscribed." },
    })
    expect(mocks.prisma.newsletterSubscriber.create).not.toHaveBeenCalled()
    expect(mocks.prisma.newsletterSubscriber.update).not.toHaveBeenCalled()
    expect(mocks.revalidateTag).not.toHaveBeenCalled()
    expect(mocks.sendSubscribeConfirmationEmail).not.toHaveBeenCalled()
  })

  it("reactivates a previously unsubscribed email", async () => {
    mocks.prisma.newsletterSubscriber.findUnique.mockResolvedValue({
      email: "reader@example.com",
      status: "UNSUBSCRIBED",
      token: "subscriber-token",
    })

    const response = await subscribe(
      postRequest("/api/newsletter/subscribe", {
        email: "reader@example.com",
      }),
    )

    expect(response.status).toBe(201)
    expect(mocks.prisma.newsletterSubscriber.update).toHaveBeenCalledWith({
      data: { status: "ACTIVE", unsubscribedAt: null },
      select: { email: true, token: true },
      where: { email: "reader@example.com" },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("newsletter", "max")
    expect(mocks.sendSubscribeConfirmationEmail).toHaveBeenCalledWith({
      to: "reader@example.com",
    })
  })

  it("rejects invalid email addresses", async () => {
    const response = await subscribe(
      postRequest("/api/newsletter/subscribe", { email: "not-email" }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid request" })
  })
})

describe("POST /api/newsletter/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("marks an active subscriber unsubscribed by token", async () => {
    mocks.prisma.newsletterSubscriber.findUnique.mockResolvedValue({
      status: "ACTIVE",
      token: "subscriber-token",
    })

    const response = await unsubscribe(
      postRequest("/api/newsletter/unsubscribe", {
        token: "subscriber-token",
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Unsubscribed successfully." },
    })
    expect(mocks.prisma.newsletterSubscriber.update).toHaveBeenCalledWith({
      data: { status: "UNSUBSCRIBED", unsubscribedAt: expect.any(Date) },
      select: { token: true },
      where: { token: "subscriber-token" },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("newsletter", "max")
  })

  it("returns 404 for an invalid token", async () => {
    mocks.prisma.newsletterSubscriber.findUnique.mockResolvedValue(null)

    const response = await unsubscribe(
      postRequest("/api/newsletter/unsubscribe", { token: "bad-token" }),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid unsubscribe link",
    })
  })

  it("does not update an already-unsubscribed subscriber", async () => {
    mocks.prisma.newsletterSubscriber.findUnique.mockResolvedValue({
      status: "UNSUBSCRIBED",
      token: "subscriber-token",
    })

    const response = await unsubscribe(
      postRequest("/api/newsletter/unsubscribe", {
        token: "subscriber-token",
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { message: "You are already unsubscribed." },
    })
    expect(mocks.prisma.newsletterSubscriber.update).not.toHaveBeenCalled()
    expect(mocks.revalidateTag).not.toHaveBeenCalled()
  })
})

describe("POST /api/newsletter/broadcast", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = "https://animeblog.example"
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mocks.prisma.user.findUnique.mockImplementation(async (query: unknown) => {
      const where =
        typeof query === "object" && query !== null && "where" in query
          ? query.where
          : null
      const id =
        typeof where === "object" &&
        where !== null &&
        "id" in where &&
        typeof where.id === "string"
          ? where.id
          : null

      if (id === "admin-1") {
        return {
          avatarUrl: null,
          email: "admin@example.com",
          id,
          name: "Admin",
          role: "ADMIN",
          username: "admin",
        }
      }

      if (id === "writer-1") {
        return {
          avatarUrl: null,
          email: "writer@example.com",
          id,
          name: "Writer",
          role: "WRITER",
          username: "writer",
        }
      }

      return null
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      coverUrl: null,
      excerpt: "A study of silence.",
      slug: "frieren-memory",
      title: "Frieren and memory",
    })
    mocks.prisma.newsletterSubscriber.findMany.mockResolvedValue([
      { email: "one@example.com", token: "token-one" },
      { email: "two@example.com", token: "token-two" },
    ])
    mocks.sendNewsletterBroadcast.mockResolvedValue(undefined)
  })

  it("requires an admin session", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "writer-1", role: "WRITER" } })

    const response = await broadcast(
      postRequest("/api/newsletter/broadcast", {
        customBody: "Hello readers",
        subject: "New issue",
      }),
    )

    expect(response.status).toBe(401)
  })

  it("sends a post broadcast to active subscribers with unique unsubscribe URLs", async () => {
    const response = await broadcast(
      postRequest("/api/newsletter/broadcast", {
        postId: "post-1",
        previewText: "A new essay is live.",
        subject: "New essay",
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { sent: 2, total: 2 },
    })
    expect(mocks.prisma.newsletterSubscriber.findMany).toHaveBeenCalledWith({
      select: { email: true, token: true },
      where: { status: "ACTIVE" },
    })
    expect(mocks.sendNewsletterBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        featuredPost: {
          coverUrl: null,
          excerpt: "A study of silence.",
          title: "Frieren and memory",
          url: "https://animeblog.example/frieren-memory",
        },
        subject: "New essay",
        to: "one@example.com",
        unsubscribeUrl: "https://animeblog.example/unsubscribe?token=token-one",
      }),
    )
    expect(mocks.sendNewsletterBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "two@example.com",
        unsubscribeUrl: "https://animeblog.example/unsubscribe?token=token-two",
      }),
    )
  })

  it("returns 404 for an unpublished featured post", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(null)

    const response = await broadcast(
      postRequest("/api/newsletter/broadcast", {
        postId: "draft-post",
        subject: "Draft issue",
      }),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: "Post not found or not published",
    })
  })

  it("rejects broadcasts without a post or custom body", async () => {
    const response = await broadcast(
      postRequest("/api/newsletter/broadcast", {
        subject: "Empty issue",
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid request" })
  })
})
