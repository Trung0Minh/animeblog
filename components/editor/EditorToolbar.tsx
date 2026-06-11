"use client"

import type { Editor } from "@tiptap/react"
import {
  Bold,
  Code,
  CodeSquare,
  Eye,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Video,
} from "lucide-react"
import { useState } from "react"

import { MediaUpload } from "@/components/editor/MediaUpload"
import { VideoEmbedModal } from "@/components/editor/VideoEmbedModal"

interface ToolbarButtonProps {
  active?: boolean
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
  title: string
}

function ToolbarButton({
  active = false,
  children,
  disabled = false,
  onClick,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      className={[
        "rounded p-1.5 transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled ? "cursor-not-allowed opacity-40" : "",
      ].join(" ")}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault()
        onClick()
      }}
      title={title}
      type="button"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border" />
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const [showVideoModal, setShowVideoModal] = useState(false)

  function setLink() {
    const previous = editor.getAttributes("link").href
    const previousUrl = typeof previous === "string" ? previous : "https://"
    const url = window.prompt("Enter URL:", previousUrl)

    if (url === null) {
      return
    }

    if (url === "") {
      editor.chain().focus().unsetLink().run()
      return
    }

    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <>
      <div className="sticky top-14 z-10 mb-2 flex flex-wrap items-center gap-0.5 rounded-md border bg-background/95 p-2 backdrop-blur">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline code"
        >
          <Code aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          <Heading3 aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          title="Heading 4"
        >
          <Heading4 aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered list"
        >
          <ListOrdered aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <Quote aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <Minus aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive("link")}
          onClick={setLink}
          title="Insert / edit link"
        >
          <Link2 aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <MediaUpload
          onInsert={(url, alt) =>
            editor.chain().focus().setImage({ alt, src: url }).run()
          }
        />
        <ToolbarButton
          onClick={() => setShowVideoModal(true)}
          title="Embed video"
        >
          <Video aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive("spoiler")}
          onClick={() => editor.chain().focus().toggleSpoiler().run()}
          title="Spoiler block"
        >
          <Eye aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code block"
        >
          <CodeSquare aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
      </div>

      {showVideoModal && (
        <VideoEmbedModal
          onClose={() => setShowVideoModal(false)}
          onInsert={(url, caption) => {
            editor
              .chain()
              .focus()
              .insertContent({
                attrs: { caption, url },
                type: "videoEmbed",
              })
              .run()
            setShowVideoModal(false)
          }}
        />
      )}
    </>
  )
}
