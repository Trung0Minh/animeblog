import { ZodError, z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendNewsletterBroadcast } from "@/lib/resend"

const broadcastSchema = z
  .object({
    customBody: z.string().trim().max(5000).optional(),
    postId: z.string().trim().min(1).optional(),
    previewText: z.string().trim().max(200).optional(),
    subject: z.string().trim().min(1).max(200),
  })
  .refine((data) => Boolean(data.postId || data.customBody), {
    message: "Either postId or customBody must be provided",
  })

const BATCH_SIZE = 50

interface FeaturedPost {
  coverUrl: string | null
  excerpt: string | null
  slug: string
  title: string
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = broadcastSchema.parse(await request.json())
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not configured")
    }

    let featuredPost: FeaturedPost | null = null

    if (data.postId) {
      featuredPost = await prisma.post.findUnique({
        select: { coverUrl: true, excerpt: true, slug: true, title: true },
        where: { id: data.postId, status: "PUBLISHED" },
      })

      if (!featuredPost) {
        return Response.json(
          { error: "Post not found or not published" },
          { status: 404 },
        )
      }
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      select: { email: true, token: true },
      where: { status: "ACTIVE" },
    })

    let sent = 0

    for (let index = 0; index < subscribers.length; index += BATCH_SIZE) {
      const batch = subscribers.slice(index, index + BATCH_SIZE)
      const results = await Promise.all(
        batch.map(async (subscriber) => {
          try {
            await sendNewsletterBroadcast({
              customBody: data.customBody,
              featuredPost: featuredPost
                ? {
                    coverUrl: featuredPost.coverUrl,
                    excerpt: featuredPost.excerpt,
                    title: featuredPost.title,
                    url: `${appUrl}/${featuredPost.slug}`,
                  }
                : null,
              previewText: data.previewText,
              subject: data.subject,
              to: subscriber.email,
              unsubscribeUrl: `${appUrl}/unsubscribe?token=${subscriber.token}`,
            })
            return true
          } catch (error) {
            console.error(
              `[POST /api/newsletter/broadcast] Failed to send to ${subscriber.email}:`,
              error,
            )
            return false
          }
        }),
      )

      sent += results.filter(Boolean).length

      if (index + BATCH_SIZE < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    return Response.json({ data: { sent, total: subscribers.length } })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/newsletter/broadcast]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
