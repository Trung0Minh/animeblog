import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CommentForm } from "@/components/comments/CommentForm"
import { CommentSection } from "@/components/comments/CommentSection"
import type { CommentWithReplies } from "@/types"

const topComment: CommentWithReplies = {
  authorName: "Mina",
  content: "<script>alert(1)</script>",
  createdAt: new Date("2024-04-01T00:00:00Z"),
  id: "comment-1",
  parentId: null,
  postId: "post-1",
  replies: [
    {
      authorName: "Ken",
      content: "A direct reply.",
      createdAt: new Date("2024-04-02T00:00:00Z"),
      id: "reply-1",
      parentId: "comment-1",
      postId: "post-1",
      status: "APPROVED",
    },
  ],
  status: "APPROVED",
}

describe("CommentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("posts a comment with privacy copy and success feedback", async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            ...topComment,
            content: "This changed my read of the scene.",
            replies: undefined,
          },
        }),
        { status: 201 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(<CommentForm onSuccess={onSuccess} postId="post-1" />)

    expect(
      screen.getByText("Your email stays private. We only use it for replies."),
    ).toBeVisible()

    await user.type(screen.getByLabelText("Name"), "Mina")
    await user.type(screen.getByLabelText("Email"), "mina@example.com")
    await user.type(
      screen.getByLabelText("Comment"),
      "This changed my read of the scene.",
    )
    await user.click(screen.getByRole("button", { name: "Post comment" }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "This changed my read of the scene.",
          replies: [],
        }),
      )
    })
    expect(await screen.findByText("Comment posted.")).toBeVisible()

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    expect(body).toEqual({
      authorEmail: "mina@example.com",
      authorName: "Mina",
      content: "This changed my read of the scene.",
      notifyReply: true,
      postId: "post-1",
    })
  })
})

describe("CommentSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders comments as plain text and never displays email addresses", () => {
    const { container } = render(
      <CommentSection initialComments={[topComment]} postId="post-1" />,
    )

    expect(screen.getByRole("heading", { name: "2 comments" })).toBeVisible()
    expect(screen.getByText("<script>alert(1)</script>")).toBeVisible()
    expect(container.querySelector("script")).toBeNull()
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument()
  })

  it("adds a successful reply under the selected parent comment", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            authorName: "Rei",
            content: "That is the line I noticed too.",
            createdAt: new Date("2024-04-03T00:00:00Z"),
            id: "reply-2",
            parentId: "comment-1",
            postId: "post-1",
            status: "APPROVED",
          },
        }),
        { status: 201 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(<CommentSection initialComments={[topComment]} postId="post-1" />)

    await user.click(
      screen.getByRole("button", { name: "Reply to Mina's comment" }),
    )

    const replyForm = screen.getByRole("form", { name: "Reply to Mina" })
    await user.type(within(replyForm).getByLabelText("Name"), "Rei")
    await user.type(
      within(replyForm).getByLabelText("Email"),
      "rei@example.com",
    )
    await user.type(
      within(replyForm).getByLabelText("Comment"),
      "That is the line I noticed too.",
    )
    await user.click(within(replyForm).getByRole("button", { name: "Post reply" }))

    expect(
      await screen.findByText("That is the line I noticed too."),
    ).toBeVisible()
    await waitFor(() => {
      expect(
        screen.queryByRole("form", { name: "Reply to Mina" }),
      ).not.toBeInTheDocument()
    })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    expect(body.parentId).toBe("comment-1")
  })
})
