import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"

import { ImageGalleryBlock } from "@/components/editor/ImageGalleryBlock"
import {
  getGalleryImageAlt,
  parseGalleryImages,
  serializeGalleryImages,
  type GalleryImage,
} from "@/components/editor/gallery"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageGallery: {
      setImageGallery: (images: GalleryImage[]) => ReturnType
    }
  }
}

export const GalleryExtension = Node.create({
  name: "imageGallery",

  atom: true,
  draggable: true,
  group: "block",

  addAttributes() {
    return {
      images: {
        default: "[]",
        parseHTML: (element) => element.getAttribute("data-images") ?? "[]",
        renderHTML: (attributes) => ({
          "data-images": attributes.images,
        }),
      },
    }
  },

  addCommands() {
    return {
      setImageGallery:
        (images) =>
        ({ commands }) =>
          commands.insertContent({
            attrs: { images: serializeGalleryImages(images) },
            type: this.name,
          }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGalleryBlock)
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-gallery"]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const images = parseGalleryImages(node.attrs.images)
    const renderedAttributes = { ...HTMLAttributes }
    delete renderedAttributes.images

    return [
      "div",
      mergeAttributes(renderedAttributes, {
        "data-images": serializeGalleryImages(images),
        "data-type": "image-gallery",
        class: "image-gallery",
      }),
      [
        "div",
        { class: "image-gallery__grid" },
        ...images.map((image) => [
          "figure",
          { class: "image-gallery__item" },
          [
            "img",
            {
              alt: getGalleryImageAlt(image),
              class: "image-gallery__image",
              src: image.url,
            },
          ],
          ...(image.caption
            ? [
                [
                  "figcaption",
                  { class: "image-gallery__caption" },
                  image.caption,
                ],
              ]
            : []),
        ]),
      ],
    ]
  },
})
