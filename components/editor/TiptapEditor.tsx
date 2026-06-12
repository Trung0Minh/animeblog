"use client"

import CharacterCount from "@tiptap/extension-character-count"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { common, createLowlight } from "lowlight"

import { BubbleMenuComponent } from "@/components/editor/BubbleMenu"
import { EditorToolbar } from "@/components/editor/EditorToolbar"
import {
  GalleryExtension,
  HeadingWithIdExtension,
  SpoilerExtension,
  VideoEmbedExtension,
} from "@/components/editor/extensions"

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  content?: JSONContent
  editable?: boolean
  onChange?: (json: JSONContent, text: string) => void
}

export function TiptapEditor({
  content,
  editable = true,
  onChange,
}: TiptapEditorProps) {
  const editor = useEditor({
    content: content ?? "",
    editable,
    editorProps: {
      attributes: {
        class: [
          "prose prose-lg dark:prose-invert max-w-none focus:outline-none",
          editable ? "min-h-[500px] px-0 py-4" : "",
        ].join(" "),
      },
    },
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: false,
      }),
      HeadingWithIdExtension,
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "h-auto max-w-full rounded-md",
        },
      }),
      GalleryExtension,
      Link.configure({
        HTMLAttributes: {
          class: "text-editorial underline underline-offset-2 hover:opacity-80",
          rel: "noopener noreferrer",
          target: "_blank",
        },
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your post...",
      }),
      Typography,
      CharacterCount,
      CodeBlockLowlight.configure({
        HTMLAttributes: {
          class: "code-block",
        },
        defaultLanguage: "plaintext",
        lowlight,
      }),
      SpoilerExtension,
      VideoEmbedExtension,
    ],
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON(), editor.getText())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="relative w-full">
      {editable && (
        <>
          <EditorToolbar editor={editor} />
          <BubbleMenuComponent editor={editor} />
        </>
      )}

      <EditorContent editor={editor} />

      {editable && (
        <p className="mt-2 text-right text-xs text-muted-foreground">
          {editor.storage.characterCount.characters().toLocaleString()}{" "}
          characters
        </p>
      )}
    </div>
  )
}

export type { JSONContent }
