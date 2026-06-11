import { Editor } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { describe, expect, it } from "vitest"

import {
  HeadingWithIdExtension,
  SpoilerExtension,
  VideoEmbedExtension,
} from "@/components/editor/extensions"

describe("VideoEmbedExtension", () => {
  it("renders a YouTube embed iframe with a caption", () => {
    const editor = new Editor({
      content: {
        content: [
          {
            attrs: {
              caption: "Opening sequence",
              url: "https://youtu.be/dQw4w9WgXcQ",
            },
            type: "videoEmbed",
          },
        ],
        type: "doc",
      },
      extensions: [StarterKit, VideoEmbedExtension],
    })

    expect(editor.getHTML()).toContain(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0",
    )
    expect(editor.getHTML()).toContain("Opening sequence")
    editor.destroy()
  })
})

describe("SpoilerExtension", () => {
  it("wraps selected block content as a spoiler node", () => {
    const editor = new Editor({
      content: "<p>Major reveal</p>",
      extensions: [StarterKit, SpoilerExtension],
    })

    editor.commands.toggleSpoiler()

    expect(editor.getHTML()).toContain('data-type="spoiler"')
    expect(editor.getHTML()).toContain("Major reveal")
    editor.destroy()
  })
})

describe("HeadingWithIdExtension", () => {
  it("renders heading IDs that match table of contents anchors", () => {
    const editor = new Editor({
      content: "<h2>Đạo diễn tập</h2>",
      extensions: [
        StarterKit.configure({ heading: false }),
        HeadingWithIdExtension,
      ],
    })

    expect(editor.getHTML()).toContain('<h2 id="dao-dien-tap">')
    editor.destroy()
  })
})
