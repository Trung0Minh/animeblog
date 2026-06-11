import Link from "next/link"

import { formatDate } from "@/lib/utils"

interface HeaderAuthor {
  avatarUrl: string | null
  bio?: string | null
  name: string
  username: string
}

export interface PostHeaderPost {
  _count?: { comments: number }
  author: HeaderAuthor
  category: { name: string; slug: string } | null
  coAuthors: { user: HeaderAuthor }[]
  coverAlt: string | null
  coverUrl: string | null
  excerpt: string | null
  publishedAt: Date | string | null
  tags: { tag: { name: string; slug: string } }[]
  title: string
}

interface PostHeaderProps {
  post: PostHeaderPost
}

function Avatar({ author }: { author: HeaderAuthor }) {
  if (author.avatarUrl) {
    return (
      <img
        alt={author.name}
        className="h-8 w-8 rounded-full object-cover"
        src={author.avatarUrl}
      />
    )
  }

  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
      {author.name.charAt(0)}
    </span>
  )
}

export function PostHeader({ post }: PostHeaderProps) {
  const authors = [post.author, ...post.coAuthors.map(({ user }) => user)]

  return (
    <header className="mx-auto max-w-3xl">
      {post.category && (
        <Link
          className="text-xs font-semibold uppercase tracking-[0.12em] text-editorial transition-colors hover:text-editorial/80"
          href={`/category/${post.category.slug}`}
          prefetch={false}
        >
          {post.category.name}
        </Link>
      )}

      <h1 className="mt-2 text-balance text-2xl font-bold leading-tight tracking-tight md:text-3xl">
        {post.title}
      </h1>

      {post.excerpt && (
        <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <div className="flex -space-x-2">
          {authors.slice(0, 3).map((author) => (
            <Avatar author={author} key={author.username} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            {authors.map((author, index) => (
              <span key={author.username}>
                {index > 0 && ", "}
                <Link
                  className="font-medium text-foreground transition-colors hover:text-editorial"
                  href={`/authors/${author.username}`}
                  prefetch={false}
                >
                  {author.name}
                </Link>
              </span>
            ))}
          </span>
          {post.publishedAt && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={new Date(post.publishedAt).toISOString()}>
                {formatDate(post.publishedAt)}
              </time>
            </>
          )}
          {post._count && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {post._count.comments} comment
                {post._count.comments === 1 ? "" : "s"}
              </span>
            </>
          )}
        </div>
      </div>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map(({ tag }) => (
            <Link
              className="rounded-full bg-muted px-2.5 py-1 text-xs transition-colors hover:bg-muted/80"
              href={`/tag/${tag.slug}`}
              key={tag.slug}
              prefetch={false}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {post.coverUrl && (
        <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl bg-muted">
          <img
            alt={post.coverAlt ?? post.title}
            className="h-full w-full object-cover"
            src={post.coverUrl}
          />
        </div>
      )}
    </header>
  )
}
