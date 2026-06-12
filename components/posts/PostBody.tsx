"use client"

import { TiptapEditor, type JSONContent } from "@/components/editor/TiptapEditor"

interface PostBodyProps {
  content: JSONContent
}

export function PostBody({ content }: PostBodyProps) {
  return (
    <div className="post-content mx-auto w-full max-w-4xl">
      <TiptapEditor content={content} editable={false} />
    </div>
  )
}
