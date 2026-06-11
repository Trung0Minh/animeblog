import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
}))

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send }
  },
}))

import { InviteEmail } from "@/emails/InviteEmail"
import { CommentReplyEmail } from "@/emails/CommentReplyEmail"
import { sendCommentReplyEmail, sendInviteEmail } from "@/lib/resend"

describe("InviteEmail", () => {
  it("renders the inviter and invitation link", () => {
    const html = renderToStaticMarkup(
      InviteEmail({
        invitedByName: "Admin Writer",
        inviteUrl: "https://animeblog.example/invite/token",
      })
    )

    expect(html).toContain("Admin Writer")
    expect(html).toContain("https://animeblog.example/invite/token")
    expect(html).toContain("This link expires in 7 days")
  })
})

describe("CommentReplyEmail", () => {
  it("renders the reply summary and post link", () => {
    const html = renderToStaticMarkup(
      CommentReplyEmail({
        postTitle: "Frieren and memory",
        postUrl: "https://animeblog.example/frieren#comment-reply-1",
        repliedByName: "Mina",
        replyContent: "A sharp point about the final scene.",
        toName: "Ken",
      }),
    )

    expect(html).toContain("Mina")
    expect(html).toContain("Frieren and memory")
    expect(html).toContain("A sharp point about the final scene.")
    expect(html).toContain("https://animeblog.example/frieren#comment-reply-1")
  })
})

describe("sendInviteEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = "https://animeblog.example"
    process.env.RESEND_FROM_EMAIL = "Anime Blog <no-reply@example.com>"
  })

  it("sends an invite with the correct URL", async () => {
    mocks.send.mockResolvedValue({ data: { id: "email-1" }, error: null })

    await sendInviteEmail({
      to: "writer@example.com",
      inviteToken: "invite-token",
      invitedByName: "Admin Writer",
    })

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Anime Blog <no-reply@example.com>",
        to: "writer@example.com",
        subject: "Admin Writer invited you to write on Anime Blog",
      })
    )
    const message = mocks.send.mock.calls[0][0] as { react: React.ReactNode }
    expect(renderToStaticMarkup(message.react)).toContain(
      "https://animeblog.example/invite/invite-token"
    )
  })

  it("throws when Resend rejects the email", async () => {
    mocks.send.mockResolvedValue({
      data: null,
      error: { message: "Invalid sender" },
    })

    await expect(
      sendInviteEmail({
        to: "writer@example.com",
        inviteToken: "invite-token",
        invitedByName: "Admin Writer",
      })
    ).rejects.toThrow("Resend error: Invalid sender")
  })
})

describe("sendCommentReplyEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_FROM_EMAIL = "Anime Blog <no-reply@example.com>"
  })

  it("sends a reply notification", async () => {
    mocks.send.mockResolvedValue({ data: { id: "email-1" }, error: null })

    await sendCommentReplyEmail({
      postTitle: "Frieren and memory",
      postUrl: "https://animeblog.example/frieren#comment-reply-1",
      repliedByName: "Mina",
      replyContent: "A sharp point about the final scene.",
      to: "ken@example.com",
      toName: "Ken",
    })

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Anime Blog <no-reply@example.com>",
        subject: 'Mina replied to your comment on "Frieren and memory"',
        to: "ken@example.com",
      }),
    )
    const message = mocks.send.mock.calls[0][0] as { react: React.ReactNode }
    expect(renderToStaticMarkup(message.react)).toContain(
      "https://animeblog.example/frieren#comment-reply-1",
    )
  })
})
