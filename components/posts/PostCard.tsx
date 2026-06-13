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
        className="h-6 w-6 rounded-full object-cover ring-1 ring-background"
        decoding="async"
        loading="lazy"
        src={avatarUrl}
      />
    )
  }

  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border bg-muted text-[10px] font-medium ring-1 ring-background">
      {name.charAt(0)}
    </span>
  )
}

export function PostCard({ post }: PostCardProps) {
  const authors = [post.author, ...post.coAuthors.map(({ user }) => user)]

  return (
    <article className="group flex flex-col">
      {post.coverUrl && (
        <Link className="mb-4 block overflow-hidden rounded-[6px]" href={`/${post.slug}`}>
          <div className="aspect-video w-full overflow-hidden bg-muted dark:brightness-[0.9]">
            <img
              alt={post.coverAlt ?? post.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              decoding="async"
              loading="lazy"
              src={post.coverUrl}
            />
          </div>
        </Link>
      )}

      <div>
        {post.category && (
          <Link
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-editorial transition-colors hover:text-editorial/80"
            href={`/category/${post.category.slug}`}
          >
            {post.category.name}
          </Link>
        )}

        <Link href={`/${post.slug}`}>
          <h2 className="line-clamp-2 text-[20px] font-bold leading-[1.3] text-foreground transition-colors duration-150 group-hover:text-editorial">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="mt-3 hidden font-serif text-[14px] leading-[1.65] text-muted-foreground line-clamp-3 md:block">
            {post.excerpt}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map(({ tag }) => (
              <Link
                className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-border"
                href={`/tag/${tag.slug}`}
                key={tag.slug}
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
