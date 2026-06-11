import { PostCard, type PostCardPost } from "@/components/posts/PostCard"
import { Pagination } from "@/components/ui/Pagination"

interface PostListProps {
  emptyMessage?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
  }
  posts: PostCardPost[]
}

export function PostList({
  emptyMessage = "No posts found.",
  pagination,
  posts,
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
        />
      )}
    </div>
  )
}
