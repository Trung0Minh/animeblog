import { expect, type APIRequestContext } from "@playwright/test"

type PostStatus = "DRAFT" | "PUBLISHED"
type PostContent = Record<string, unknown>

interface PostResponse {
  data?: {
    id: string
    slug: string
    status: PostStatus
  }
  error?: string
}

function docFromText(text: string) {
  return {
    content: [
      {
        content: [{ text, type: "text" }],
        type: "paragraph",
      },
    ],
    type: "doc",
  }
}

export async function createPost(
  request: APIRequestContext,
  input: {
    content?: PostContent
    contentText: string
    excerpt?: string
    status?: PostStatus
    title: string
  },
) {
  const response = await request.post("/api/posts", {
    data: {
      content: input.content ?? docFromText(input.contentText),
      contentText: input.contentText,
      excerpt: input.excerpt ?? input.contentText,
      status: input.status ?? "PUBLISHED",
      title: input.title,
    },
  })
  const payload = (await response.json()) as PostResponse

  expect(response.ok(), payload.error).toBe(true)

  if (!payload.data) {
    throw new Error("Post response did not include data")
  }

  return payload.data
}
