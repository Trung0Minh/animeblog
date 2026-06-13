import { mergeAttributes, Node } from "@tiptap/core"
import type { DOMOutputSpec } from "@tiptap/pm/model"

import { toVideoEmbedUrl } from "@/components/editor/video"

export { toVideoEmbedUrl } from "@/components/editor/video"

export const VideoEmbedExtension = Node.create({
  addAttributes() {
    return {
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") ?? "",
        renderHTML: (attributes) => ({
          "data-caption":
            typeof attributes.caption === "string" ? attributes.caption : "",
        }),
      },
      url: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-url"),
        renderHTML: (attributes) => ({
          "data-url": typeof attributes.url === "string" ? attributes.url : "",
        }),
      },
    }
  },

  atom: true,
  group: "block",
  name: "videoEmbed",

  parseHTML() {
    return [{ tag: 'div[data-type="video-embed"]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const rawUrl = typeof node.attrs.url === "string" ? node.attrs.url : ""
    const caption =
      typeof node.attrs.caption === "string" ? node.attrs.caption : ""

    const children: DOMOutputSpec[] = [
      [
        "div",
        { class: "relative w-full aspect-video" },
        [
          "iframe",
          {
            allow:
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            allowfullscreen: "true",
            class: "absolute inset-0 h-full w-full rounded-md",
            loading: "lazy",
            src: toVideoEmbedUrl(rawUrl),
            title: caption || "Embedded video",
          },
        ],
      ],
    ]

    if (caption) {
      children.push([
        "figcaption",
        { class: "media-caption" },
        caption,
      ])
    }

    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        class: "my-6",
        "data-type": "video-embed",
      }),
      ...children,
    ]
  },
})
