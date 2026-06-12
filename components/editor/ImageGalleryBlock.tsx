"use client"

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"

import {
  getGalleryImageAlt,
  parseGalleryImages,
} from "@/components/editor/gallery"

export function ImageGalleryBlock({ node }: NodeViewProps) {
  const images = parseGalleryImages(node.attrs.images)

  return (
    <NodeViewWrapper
      className="image-gallery"
      data-type="image-gallery"
    >
      {images.length > 0 ? (
        <div className="image-gallery__grid">
          {images.map((image) => (
            <figure className="image-gallery__item" key={image.url}>
              <img
                alt={getGalleryImageAlt(image)}
                className="image-gallery__image"
                src={image.url}
              />
              {image.caption ? (
                <figcaption className="image-gallery__caption">
                  {image.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      ) : (
        <p className="m-0 rounded border border-dashed p-4 text-center text-sm text-muted-foreground">
          Empty image gallery
        </p>
      )}
    </NodeViewWrapper>
  )
}
