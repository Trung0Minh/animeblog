import Link from "next/link"

import { formatDate } from "@/lib/utils"

export interface PostCardPost {
  _count: { comments: number }
  author: {
    avatarUrl: string | null
    name: string
    username: string
  }
  category: { id?: string; name: string; slug: string } | null
  coAuthors: {
    user: {
      avatarUrl?: string | null
      name: string
      username: string
    }
  }[]
  coverAlt: string | null
  coverUrl: string | null
  excerpt: string | null
  publishedAt: Date | string | null
  slug: string
  tags: { tag: { id?: string; name: string; slug: string } }[]
  title: string
}

interface PostCardProps {
  post: PostCardPost
}

function AuthorAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl?: string | null
  name: string
}) {
  if (avatarUrl) {
    return (
      <img
        alt={name}
        className="h-5 w-5 rounded-full object-cover ring-1 ring-background"
        decoding="async"
        loading="lazy"
        src={avatarUrl}
      />
    )
  }

  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-1 ring-background">
      {name.charAt(0)}
    </span>
  )
}

export function PostCard({ post }: PostCardProps) {
  const authors = [post.author, ...post.coAuthors.map(({ user }) => user)]

  return (
    <article className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      {post.coverUrl && (
        <Link href={`/${post.slug}`} prefetch={false}>
          <div className="aspect-video w-full overflow-hidden bg-muted">
            <img
              alt={post.coverAlt ?? post.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              decoding="async"
              loading="lazy"
              src={post.coverUrl}
            />
          </div>
        </Link>
      )}

      <div className="p-4 sm:p-5">
        {post.category && (
          <Link
            className="text-xs font-semibold uppercase tracking-[0.08em] text-editorial transition-colors hover:text-editorial/80"
            href={`/category/${post.category.slug}`}
            prefetch={false}
          >
            {post.category.name}
          </Link>
        )}

        <Link href={`/${post.slug}`} prefetch={false}>
          <h2 className="mt-1 line-clamp-2 text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-editorial sm:text-xl">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="mt-2 hidden text-sm leading-relaxed text-muted-foreground line-clamp-3 sm:block">
            {post.excerpt}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex -space-x-1.5">
              {authors.slice(0, 3).map((author) => (
                <AuthorAvatar
                  avatarUrl={author.avatarUrl}
                  key={author.username}
                  name={author.name}
                />
              ))}
            </div>
            <span className="truncate">
              {authors.map((author, index) => (
                <span key={author.username}>
                  {index > 0 && ", "}
                  <Link
                    className="transition-colors hover:text-foreground"
                    href={`/authors/${author.username}`}
                    prefetch={false}
                  >
                    {author.name}
                  </Link>
                </span>
              ))}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
            <span>
              {post._count.comments} comment
              {post._count.comments === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map(({ tag }) => (
              <Link
                className="rounded-full bg-muted px-2 py-0.5 text-xs transition-colors hover:bg-muted/80"
                href={`/tag/${tag.slug}`}
                key={tag.slug}
                prefetch={false}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
