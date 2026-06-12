import { unstable_cache } from "next/cache"
import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

const publishedPostListSelect = {
  _count: { select: { comments: true } },
  author: {
    select: { avatarUrl: true, name: true, username: true },
  },
  category: { select: { id: true, name: true, slug: true } },
  coAuthors: {
    orderBy: { order: "asc" },
    select: {
      user: {
        select: { avatarUrl: true, name: true, username: true },
      },
    },
  },
  coverAlt: true,
  coverUrl: true,
  excerpt: true,
  publishedAt: true,
  slug: true,
  tags: {
    select: {
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
  title: true,
} satisfies Prisma.PostSelect

const sidebarCategorySelect = {
  _count: {
    select: { posts: { where: { status: "PUBLISHED" } } },
  },
  children: {
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  },
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect

const recentPostSelect = {
  publishedAt: true,
  slug: true,
  title: true,
} satisfies Prisma.PostSelect

const contributorSelect = {
  _count: {
    select: { posts: { where: { status: "PUBLISHED" } } },
  },
  avatarUrl: true,
  bio: true,
  name: true,
  username: true,
} satisfies Prisma.UserSelect

export const publishedPostDetailSelect = {
  _count: { select: { comments: true } },
  author: {
    select: {
      avatarUrl: true,
      bio: true,
      name: true,
      username: true,
    },
  },
  category: { select: { name: true, slug: true } },
  coAuthors: {
    orderBy: { order: "asc" },
    select: {
      user: {
        select: {
          avatarUrl: true,
          bio: true,
          name: true,
          username: true,
        },
      },
    },
  },
  comments: {
    orderBy: { createdAt: "asc" },
    select: {
      authorName: true,
      content: true,
      createdAt: true,
      id: true,
      parentId: true,
      postId: true,
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          authorName: true,
          content: true,
          createdAt: true,
          id: true,
          parentId: true,
          postId: true,
          status: true,
        },
        where: { status: "APPROVED" },
      },
      status: true,
    },
    where: { parentId: null, status: "APPROVED" },
  },
  content: true,
  coverAlt: true,
  coverUrl: true,
  excerpt: true,
  id: true,
  publishedAt: true,
  slug: true,
  tags: {
    select: {
      tag: { select: { name: true, slug: true } },
    },
  },
  title: true,
  updatedAt: true,
} satisfies Prisma.PostSelect

export type PublishedPostListItem = Prisma.PostGetPayload<{
  select: typeof publishedPostListSelect
}>
export type PublishedPostDetail = Prisma.PostGetPayload<{
  select: typeof publishedPostDetailSelect
}>

export const getCachedPublishedPosts = unstable_cache(
  async (page: number, pageSize: number) => {
    const where = { status: "PUBLISHED" } satisfies Prisma.PostWhereInput
    const posts = await prisma.post.findMany({
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: publishedPostListSelect,
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
    })
    const total = await prisma.post.count({ where })

    return { posts, total }
  },
  ["published-posts"],
  { revalidate: 60, tags: ["posts"] },
)

export const getCachedSidebarData = unstable_cache(
  async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: sidebarCategorySelect,
      where: { parentId: null },
    })
    const recentPosts = await prisma.post.findMany({
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: recentPostSelect,
      take: 5,
      where: { status: "PUBLISHED" },
    })

    return { categories, recentPosts }
  },
  ["sidebar-data"],
  { revalidate: 300, tags: ["posts", "categories"] },
)

export const getCachedPublishedPost = unstable_cache(
  async (slug: string) =>
    prisma.post.findUnique({
      select: publishedPostDetailSelect,
      where: { slug, status: "PUBLISHED" },
    }),
  ["published-post"],
  { revalidate: 300, tags: ["posts", "comments"] },
)

export const getCachedContributors = unstable_cache(
  async () =>
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: contributorSelect,
      where: { role: { in: ["ADMIN", "WRITER"] } },
    }),
  ["contributors"],
  { revalidate: 300, tags: ["posts", "users"] },
)
