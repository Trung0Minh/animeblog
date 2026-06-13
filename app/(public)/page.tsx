import { Suspense } from "react"
import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { Sidebar } from "@/components/layout/Sidebar"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"
import { PostList } from "@/components/posts/PostList"
import {
  PostListSkeleton,
  SidebarSkeleton,
} from "@/components/posts/PostListSkeleton"
import { getCachedPublishedPosts, getCachedSidebarData } from "@/lib/queries"
import { buildMetadata, getAppUrl } from "@/lib/seo"

interface HomePageProps {
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 10

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)

  return buildMetadata({
    canonicalPath: "/",
    ...(page > 1 && {
      canonicalUrl: `${getAppUrl()}?page=${page}`,
      noIndex: true,
      noIndexFollow: true,
    }),
  })
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)

  return (
    <PageContainer size="wide">
      <div className="flex flex-col gap-12 lg:flex-row xl:gap-[48px]">
        <section className="min-w-0 flex-1" aria-label="Published posts">
          <Suspense fallback={<PostListSkeleton />}>
            <HomePostList page={page} />
          </Suspense>
        </section>
        <Suspense fallback={<SidebarSkeleton />}>
          <HomeSidebar />
        </Suspense>
      </div>
    </PageContainer>
  )
}

async function HomePostList({ page }: { page: number }) {
  const { posts, total } = await getCachedPublishedPosts(page, PAGE_SIZE)

  return (
    <PostList
      emptyMessage="No posts published yet."
      pagination={{ page, pageSize: PAGE_SIZE, total }}
      posts={posts}
    />
  )
}

async function HomeSidebar() {
  const { categories, recentPosts } = await getCachedSidebarData()

  return (
    <Sidebar
      categories={categories}
      newsletter={<NewsletterForm />}
      recentPosts={recentPosts}
    />
  )
}
