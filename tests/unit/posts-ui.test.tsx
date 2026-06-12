import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
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
import { PostBody } from "@/components/posts/PostBody"
import { PostCard } from "@/components/posts/PostCard"
import { PostEditor } from "@/components/posts/PostEditor"
import { PostHeader } from "@/components/posts/PostHeader"
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

  it("uses mobile-first title sizing and hides excerpts below small screens", () => {
    render(<PostCard post={post} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "Frieren Animation" }),
    ).toHaveClass("text-lg", "sm:text-xl")
    expect(screen.getByText("A compact summary of the article.")).toHaveClass(
      "hidden",
      "sm:block",
      "line-clamp-3",
    )
  })
})

describe("Post detail responsive components", () => {
  it("sizes the post detail title from mobile to desktop", () => {
    render(<PostHeader post={post} />)

    expect(
      screen.getByRole("heading", { level: 1, name: "Frieren Animation" }),
    ).toHaveClass("text-2xl", "md:text-3xl")
  })

  it("centers the post body in a wider article lane", () => {
    const { container } = render(
      <PostBody content={{ content: [], type: "doc" }} />,
    )

    expect(container.querySelector(".post-content")).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-4xl",
    )
  })
})

describe("Pagination", () => {
  it("renders previous and next links with the current page window", () => {
    render(<Pagination page={2} pageSize={10} total={35} />)

    const previous = screen.getByRole("link", { name: "Previous" })
    expect(previous).toHaveAttribute("href", "?page=1")
    expect(previous).toHaveClass("min-h-11", "min-w-11")
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "?page=3",
    )
    const pageFour = screen.getByRole("link", { name: "Page 4" })
    expect(pageFour).toHaveAttribute("href", "?page=4")
    expect(pageFour).toHaveClass("min-h-11", "min-w-11")
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

  it("uses an expanded tap area for removing selected tags", () => {
    render(
      <TagInput
        onChange={vi.fn()}
        selectedTags={[{ id: "tag-1", name: "Sakuga", slug: "sakuga" }]}
      />,
    )

    expect(screen.getByRole("button", { name: "Remove Sakuga" })).toHaveClass(
      "-m-1.5",
      "p-1.5",
    )
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
    vi.useRealTimers()
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

  it("uses responsive title and sticky footer controls", () => {
    render(
      <PostEditor categories={[]} currentUserId="writer-1" writers={[]} />,
    )

    expect(screen.getByLabelText("Title")).toHaveClass(
      "text-xl",
      "md:text-3xl",
    )

    const saveDraftButton = screen.getByRole("button", { name: "Save draft" })
    const footer = saveDraftButton.closest(".sticky")
    if (!footer) {
      throw new Error("Editor footer not found")
    }

    expect(footer).toHaveClass("flex-col", "sm:flex-row")
    expect(saveDraftButton).toHaveClass("flex-1", "sm:flex-none")
    expect(screen.getByRole("button", { name: "Publish" })).toHaveClass(
      "flex-1",
      "sm:flex-none",
    )
  })

  it("autosaves existing post content after the debounce delay", async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              id: "post-1",
              slug: "existing-post",
              status: "DRAFT",
              updatedAt: "2024-04-01T00:00:00.000Z",
            },
          }),
          { status: 200 },
        ),
      ),
    )

    render(
      <PostEditor
        categories={[]}
        currentUserId="writer-1"
        initialData={{
          categoryId: null,
          coAuthorIds: [],
          content: { content: [], type: "doc" },
          contentText: null,
          coverAlt: null,
          coverUrl: null,
          draftVisibility: "PRIVATE",
          excerpt: "Initial excerpt",
          id: "post-1",
          status: "DRAFT",
          tags: [],
          title: "Existing post",
        }}
        writers={[]}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mock editor" }))
    expect(fetch).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(fetch).toHaveBeenCalledWith(
      "/api/posts/post-1",
      expect.objectContaining({ method: "PATCH" }),
    )
    const request = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as {
      body: string
    }
    expect(JSON.parse(request.body) as Record<string, unknown>).toMatchObject({
      content: { content: [], type: "doc" },
      contentText: "Plain body",
      excerpt: "Initial excerpt",
      title: "Existing post",
    })
    expect(JSON.parse(request.body) as Record<string, unknown>).not.toHaveProperty(
      "status",
    )

    vi.useRealTimers()
  })

  it("periodically autosaves existing posts during continuous editing", async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              id: "post-1",
              slug: "existing-post",
              status: "DRAFT",
              updatedAt: "2024-04-01T00:00:00.000Z",
            },
          }),
          { status: 200 },
        ),
      ),
    )

    render(
      <PostEditor
        categories={[]}
        currentUserId="writer-1"
        initialData={{
          categoryId: null,
          coAuthorIds: [],
          content: { content: [], type: "doc" },
          contentText: null,
          coverAlt: null,
          coverUrl: null,
          draftVisibility: "PRIVATE",
          excerpt: "Initial excerpt",
          id: "post-1",
          status: "DRAFT",
          tags: [],
          title: "Existing post",
        }}
        writers={[]}
      />,
    )

    for (let second = 0; second < 35; second += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Mock editor" }))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
    }

    expect(fetch).toHaveBeenCalledWith(
      "/api/posts/post-1",
      expect.objectContaining({ method: "PATCH" }),
    )

    vi.useRealTimers()
  })

  it("does not autosave new posts before the first manual save", async () => {
    vi.useFakeTimers()

    render(
      <PostEditor
        categories={[]}
        currentUserId="writer-1"
        writers={[{ id: "writer-2", name: "Ken", username: "ken" }]}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mock editor" }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(35_000)
    })

    expect(fetch).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("sends draft visibility when saving a shared draft", async () => {
    const user = userEvent.setup()

    render(
      <PostEditor
        categories={[]}
        currentUserId="writer-1"
        writers={[{ id: "writer-2", name: "Ken", username: "ken" }]}
      />,
    )

    await user.type(screen.getByLabelText("Title"), "Shared Draft")
    await user.click(screen.getByRole("checkbox", { name: "Ken" }))
    await user.click(
      screen.getByRole("button", { name: "Visible to co-authors" }),
    )
    await user.click(screen.getByRole("button", { name: "Save draft" }))

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
      coAuthorIds: ["writer-2"],
      draftVisibility: "CO_AUTHORS",
      status: "DRAFT",
    })
  })
})
