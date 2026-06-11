import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))
vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}))
vi.mock("@/components/editor/TiptapEditor", () => ({
  TiptapEditor: ({
    editable,
    onChange,
  }: {
    editable?: boolean
    onChange?: (json: Record<string, unknown>, text: string) => void
  }) => (
    <button
      data-editable={String(editable)}
      onClick={() => onChange?.({ content: [], type: "doc" }, "Plain body")}
      type="button"
    >
      Mock editor
    </button>
  ),
}))

import { CoverImageUpload } from "@/components/posts/CoverImageUpload"
import { Pagination } from "@/components/ui/Pagination"
import { PostCard } from "@/components/posts/PostCard"
import { PostEditor } from "@/components/posts/PostEditor"
import { TableOfContents } from "@/components/posts/TableOfContents"
import { TagInput, type TagOption } from "@/components/posts/TagInput"

const post = {
  _count: { comments: 2 },
  author: {
    avatarUrl: null,
    name: "Mina",
    username: "mina",
  },
  coAuthors: [{ user: { avatarUrl: null, name: "Ken", username: "ken" } }],
  coverAlt: "Cover alt",
  coverUrl: "https://cdn.example.com/cover.jpg",
  excerpt: "A compact summary of the article.",
  publishedAt: new Date("2024-04-01T00:00:00Z"),
  slug: "frieren-animation",
  tags: [{ tag: { id: "tag-1", name: "Sakuga", slug: "sakuga" } }],
  title: "Frieren Animation",
  category: { id: "category-1", name: "Production", slug: "production" },
}

describe("PostCard", () => {
  it("renders post links, authors, category, tags, and comment count", () => {
    render(<PostCard post={post} />)

    expect(
      screen.getByRole("link", { name: "Frieren Animation" }),
    ).toHaveAttribute("href", "/frieren-animation")
    expect(screen.getByRole("img", { name: "Cover alt" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/cover.jpg",
    )
    expect(screen.getByRole("link", { name: "Production" })).toHaveAttribute(
      "href",
      "/category/production",
    )
    expect(screen.getByRole("link", { name: "Mina" })).toHaveAttribute(
      "href",
      "/authors/mina",
    )
    expect(screen.getByRole("link", { name: "Sakuga" })).toHaveAttribute(
      "href",
      "/tag/sakuga",
    )
    expect(screen.getByText("2 comments")).toBeVisible()
  })
})

describe("Pagination", () => {
  it("renders previous and next links with the current page window", () => {
    render(<Pagination page={2} pageSize={10} total={35} />)

    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "?page=1",
    )
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "?page=3",
    )
    expect(screen.getByRole("link", { name: "Page 4" })).toHaveAttribute(
      "href",
      "?page=4",
    )
  })
})

describe("TableOfContents", () => {
  beforeEach(() => {
    class MockIntersectionObserver {
      disconnect() {}
      observe() {}
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)
  })

  it("extracts heading links from Tiptap JSON", () => {
    render(
      <TableOfContents
        content={{
          content: [
            {
              attrs: { level: 2 },
              content: [{ text: "Opening Cuts", type: "text" }],
              type: "heading",
            },
            {
              attrs: { level: 3 },
              content: [{ text: "Đạo diễn tập", type: "text" }],
              type: "heading",
            },
          ],
          type: "doc",
        }}
      />,
    )

    expect(screen.getByRole("link", { name: "Opening Cuts" })).toHaveAttribute(
      "href",
      "#opening-cuts",
    )
    expect(screen.getByRole("link", { name: "Đạo diễn tập" })).toHaveAttribute(
      "href",
      "#dao-dien-tap",
    )
  })
})

describe("CoverImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { url: "https://cdn.example.com/covers/cover.jpg" },
          }),
          { status: 201 },
        ),
      ),
    )
  })

  it("uploads cover images to the covers folder", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CoverImageUpload onChange={onChange} value="" />)

    await user.upload(
      screen.getByLabelText("Upload cover image"),
      new File(["jpg"], "cover.jpg", { type: "image/jpeg" }),
    )

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        "https://cdn.example.com/covers/cover.jpg",
      )
    })
    const formData = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]
      ?.body as FormData
    expect(formData.get("folder")).toBe("covers")
  })
})

describe("TagInput", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("searches and selects an existing tag", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [{ id: "tag-1", name: "Sakuga", slug: "sakuga" }],
          }),
          { status: 200 },
        ),
      ),
    )

    render(<TagInput onChange={onChange} selectedTags={[]} />)

    await user.type(screen.getByLabelText("Tags"), "saku")
    await user.click(await screen.findByRole("button", { name: "Sakuga" }))

    expect(onChange).toHaveBeenCalledWith([
      { id: "tag-1", name: "Sakuga", slug: "sakuga" },
    ])
  })

  it("creates a new tag when no exact match exists", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: [] }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              data: { id: "tag-2", name: "Layout", slug: "layout" },
            }),
            { status: 201 },
          ),
        ),
    )

    render(<TagInput onChange={onChange} selectedTags={[]} />)

    await user.type(screen.getByLabelText("Tags"), "Layout")
    await user.click(
      await screen.findByRole("button", { name: 'Create tag "Layout"' }),
    )

    expect(onChange).toHaveBeenCalledWith([
      { id: "tag-2", name: "Layout", slug: "layout" },
    ])
  })
})

describe("PostEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { id: "post-1", slug: "new-post", status: "PUBLISHED" },
          }),
          { status: 201 },
        ),
      ),
    )
  })

  it("posts editor content and redirects to the published slug", async () => {
    const user = userEvent.setup()
    const selectedTag: TagOption = {
      id: "tag-1",
      name: "Sakuga",
      slug: "sakuga",
    }

    render(
      <PostEditor
        categories={[
          {
            children: [],
            id: "category-1",
            name: "Production",
            slug: "production",
          },
        ]}
        currentUserId="writer-1"
        initialTags={[selectedTag]}
        writers={[{ id: "writer-2", name: "Ken", username: "ken" }]}
      />,
    )

    await user.type(screen.getByLabelText("Title"), "New Post")
    await user.click(screen.getByRole("button", { name: "Mock editor" }))
    await user.selectOptions(screen.getByLabelText("Category"), "category-1")
    await user.click(screen.getByRole("checkbox", { name: "Ken" }))
    await user.click(screen.getByRole("button", { name: "Publish" }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/posts",
        expect.objectContaining({ method: "POST" }),
      )
    })
    const request = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as {
      body: string
    }
    expect(JSON.parse(request.body) as Record<string, unknown>).toMatchObject({
      categoryId: "category-1",
      coAuthorIds: ["writer-2"],
      content: { content: [], type: "doc" },
      contentText: "Plain body",
      status: "PUBLISHED",
      tagIds: ["tag-1"],
      title: "New Post",
    })
    expect(routerMocks.push).toHaveBeenCalledWith("/new-post")
  })
})
