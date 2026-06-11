"use client"

import { TiptapEditor, type JSONContent } from "@/components/editor/TiptapEditor"

interface PostBodyProps {
  content: JSONContent
}

export function PostBody({ content }: PostBodyProps) {
  return (
    <div className="post-content text-base md:text-lg">
      <TiptapEditor content={content} editable={false} />
    </div>
  )
}
