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
        className="h-9 w-9 rounded-full border-2 border-background object-cover"
        decoding="async"
        src={author.avatarUrl}
      />
    )
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-muted text-sm font-semibold">
      {author.name.charAt(0)}
    </span>
  )
}

export function PostHeader({ post }: PostHeaderProps) {
  const authors = [post.author, ...post.coAuthors.map(({ user }) => user)]

  return (
    <header className="mb-10 md:mb-12">
      {post.category && (
        <Link
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-editorial transition-colors hover:text-editorial/80"
          href={`/category/${post.category.slug}`}
        >
          {post.category.name}
        </Link>
      )}

      <h1 className="mt-[10px] text-[26px] font-bold leading-[1.25] tracking-[-0.02em] md:text-[36px] md:leading-[1.2]">
        {post.title}
      </h1>

      {post.excerpt && (
        <p className="mt-4 font-serif text-[16px] leading-[1.7] text-muted-foreground md:text-[17px]">
          {post.excerpt}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3 text-[13px] text-muted-foreground">
        <div className="flex -space-x-2.5">
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
                  className="text-[14px] font-medium text-foreground transition-colors hover:text-editorial"
                  href={`/authors/${author.username}`}
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

      {post.coverUrl && (
        <div className="relative mt-7 w-screen -ml-4 overflow-hidden md:ml-0 md:w-full md:rounded-[8px]">
          <div className="aspect-video w-full bg-muted">
            <img
              alt={post.coverAlt ?? post.title}
              className="h-full w-full object-cover"
              decoding="async"
              fetchPriority="high"
              loading="eager"
              src={post.coverUrl}
            />
          </div>
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="no-scrollbar mt-4 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {post.tags.map(({ tag }) => (
            <Link
              className="shrink-0 rounded-full border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-border"
              href={`/tag/${tag.slug}`}
              key={tag.slug}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
