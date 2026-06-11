"use client"

import { BubbleMenu, type Editor } from "@tiptap/react"
import { Bold, Italic, Link2 } from "lucide-react"

interface BubbleMenuButtonProps {
  active?: boolean
  children: React.ReactNode
  onClick: () => void
  title: string
}

function BubbleMenuButton({
  active = false,
  children,
  onClick,
  title,
}: BubbleMenuButtonProps) {
  return (
    <button
      className={[
        "rounded p-1.5 text-sm transition-colors",
        active ? "bg-primary/10 text-primary" : "hover:bg-muted",
      ].join(" ")}
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

export function BubbleMenuComponent({ editor }: { editor: Editor }) {
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
    <BubbleMenu
      className="flex items-center gap-0.5 rounded-md border bg-background p-1 shadow-md"
      editor={editor}
      tippyOptions={{ duration: 100 }}
    >
      <BubbleMenuButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold aria-hidden="true" className="h-3.5 w-3.5" />
      </BubbleMenuButton>
      <BubbleMenuButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic aria-hidden="true" className="h-3.5 w-3.5" />
      </BubbleMenuButton>
      <BubbleMenuButton
        active={editor.isActive("link")}
        onClick={setLink}
        title="Insert / edit link"
      >
        <Link2 aria-hidden="true" className="h-3.5 w-3.5" />
      </BubbleMenuButton>
    </BubbleMenu>
  )
}
