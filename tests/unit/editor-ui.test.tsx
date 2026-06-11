import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@tiptap/react", () => ({
  NodeViewContent: () => <p>Spoiler text</p>,
  NodeViewWrapper: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock("@/components/editor/TiptapEditor", () => ({
  TiptapEditor: ({
    editable,
    content,
  }: {
    content: unknown
    editable: boolean
  }) => (
    <div
      data-content={JSON.stringify(content)}
      data-editable={String(editable)}
      data-testid="tiptap-editor"
    />
  ),
}))

import { MediaUpload } from "@/components/editor/MediaUpload"
import { EditorToolbar } from "@/components/editor/EditorToolbar"
import { SpoilerView } from "@/components/editor/SpoilerView"
import { toVideoEmbedUrl } from "@/components/editor/extensions/VideoEmbedExtension"
import { VideoEmbedModal } from "@/components/editor/VideoEmbedModal"
import { PostBody } from "@/components/posts/PostBody"

describe("toVideoEmbedUrl", () => {
  it("converts YouTube watch and short links to embed URLs", () => {
    expect(
      toVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0")
    expect(toVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0",
    )
  })

  it("passes through non-YouTube URLs", () => {
    expect(toVideoEmbedUrl("https://player.example.com/video")).toBe(
      "https://player.example.com/video",
    )
  })
})

describe("MediaUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { url: "https://cdn.example.com/content-images/file.gif" },
          }),
          { status: 201 },
        ),
      ),
    )
    vi.spyOn(window, "prompt").mockReturnValue("Episode key visual")
    vi.spyOn(window, "alert").mockImplementation(() => undefined)
  })

  it("uploads a selected image and inserts the returned URL", async () => {
    const user = userEvent.setup()
    const onInsert = vi.fn()
    render(<MediaUpload onInsert={onInsert} />)

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
    await user.upload(
      input!,
      new File(["gif"], "scene.gif", { type: "image/gif" }),
    )

    await waitFor(() => {
      expect(onInsert).toHaveBeenCalledWith(
        "https://cdn.example.com/content-images/file.gif",
        "Episode key visual",
      )
    })
    expect(fetch).toHaveBeenCalledWith("/api/upload", {
      body: expect.any(FormData),
      method: "POST",
    })
  })
})

describe("EditorToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { url: "https://cdn.example.com/content-images/file.gif" },
          }),
          { status: 201 },
        ),
      ),
    )
    vi.spyOn(window, "prompt").mockReturnValue("Episode key visual")
  })

  it("inserts an uploaded image into the editor", async () => {
    const user = userEvent.setup()
    const chain = {
      focus: vi.fn(() => chain),
      run: vi.fn(() => true),
      setImage: vi.fn(() => chain),
    }
    const editor = {
      chain: vi.fn(() => chain),
      getAttributes: vi.fn(() => ({})),
      isActive: vi.fn(() => false),
    }

    render(<EditorToolbar editor={editor as never} />)
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')

    await user.upload(
      input!,
      new File(["gif"], "scene.gif", { type: "image/gif" }),
    )

    await waitFor(() => {
      expect(chain.setImage).toHaveBeenCalledWith({
        alt: "Episode key visual",
        src: "https://cdn.example.com/content-images/file.gif",
      })
    })
    expect(chain.run).toHaveBeenCalled()
  })
})

describe("VideoEmbedModal", () => {
  it("submits a trimmed URL and caption", async () => {
    const user = userEvent.setup()
    const onInsert = vi.fn()
    render(<VideoEmbedModal onClose={vi.fn()} onInsert={onInsert} />)

    await user.type(
      screen.getByRole("textbox", { name: /Video URL/ }),
      " https://youtu.be/dQw4w9WgXcQ ",
    )
    await user.type(
      screen.getByRole("textbox", { name: /Caption/ }),
      " Opening sequence ",
    )
    await user.click(screen.getByRole("button", { name: "Insert" }))

    expect(onInsert).toHaveBeenCalledWith(
      "https://youtu.be/dQw4w9WgXcQ",
      "Opening sequence",
    )
  })
})

describe("SpoilerView", () => {
  it("blurs content until the spoiler is revealed", async () => {
    const user = userEvent.setup()
    render(<SpoilerView />)

    const content = screen.getByText("Spoiler text").parentElement
    expect(content).toHaveClass("blur-sm")

    await user.click(screen.getByRole("button", { name: /Show spoiler/ }))

    expect(screen.getByRole("button", { name: /Hide spoiler/ })).toBeVisible()
    expect(content).not.toHaveClass("blur-sm")
  })
})

describe("PostBody", () => {
  it("renders Tiptap content in read-only mode", () => {
    const content = {
      content: [{ type: "paragraph" }],
      type: "doc",
    }

    render(<PostBody content={content} />)

    const editor = screen.getByTestId("tiptap-editor")
    expect(editor).toHaveAttribute("data-editable", "false")
    expect(editor).toHaveAttribute("data-content", JSON.stringify(content))
  })
})
