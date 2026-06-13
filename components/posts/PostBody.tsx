import type { JSONContent } from "@tiptap/react"

import { PostImageInteractions } from "@/components/posts/PostImageInteractions"
import { StaticPostContent } from "@/components/posts/StaticPostContent"

interface PostBodyProps {
  content: JSONContent
}

export function PostBody({ content }: PostBodyProps) {
  return (
    <PostImageInteractions>
      <StaticPostContent content={content} />
    </PostImageInteractions>
  )
}
