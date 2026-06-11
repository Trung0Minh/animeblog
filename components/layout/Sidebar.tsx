import Link from "next/link"

import { cn, formatDate } from "@/lib/utils"

interface SidebarProps {
  categories: {
    _count: { posts: number }
    children: { id: string; name: string; slug: string }[]
    id: string
    name: string
    slug: string
  }[]
  className?: string
  newsletter?: React.ReactNode
  recentPosts: {
    publishedAt: Date | null
    slug: string
    title: string
  }[]
}

export function Sidebar({
  categories,
  className,
  newsletter,
  recentPosts,
}: SidebarProps) {
  return (
    <aside className={cn("w-full shrink-0 space-y-8 lg:w-60 xl:w-72", className)}>
      {newsletter && (
        <SidebarSection title="Newsletter">{newsletter}</SidebarSection>
      )}

      {categories.length > 0 && (
        <SidebarSection title="Categories">
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  className="flex items-center justify-between py-1 text-sm transition-colors hover:text-editorial"
                  href={`/category/${category.slug}`}
                >
                  <span>{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {category._count.posts}
                  </span>
                </Link>
                {category.children.length > 0 && (
                  <ul className="ml-3 mt-1 space-y-1 border-l pl-3">
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          className="block py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                          href={`/category/${child.slug}`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </SidebarSection>
      )}

      {recentPosts.length > 0 && (
        <SidebarSection title="Recent posts">
          <ul className="space-y-3">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  className="line-clamp-2 text-sm leading-snug transition-colors hover:text-editorial"
                  href={`/${post.slug}`}
                >
                  {post.title}
                </Link>
                {post.publishedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(post.publishedAt)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </SidebarSection>
      )}
    </aside>
  )
}

function SidebarSection({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <section>
      <h2 className="mb-3 border-b pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}
