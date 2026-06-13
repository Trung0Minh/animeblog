import { ZodError, z } from "zod"
import { revalidateTag } from "next/cache"

import { prisma } from "@/lib/prisma"

const unsubscribeSchema = z.object({
  token: z.string().trim().min(1),
})

export async function POST(request: Request) {
  try {
    const { token } = unsubscribeSchema.parse(await request.json())

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      select: { status: true, token: true },
      where: { token },
    })

    if (!subscriber) {
      return Response.json(
        { error: "Invalid unsubscribe link" },
        { status: 404 },
      )
    }

    if (subscriber.status === "UNSUBSCRIBED") {
      return Response.json(
        { data: { message: "You are already unsubscribed." } },
        { status: 200 },
      )
    }

    await prisma.newsletterSubscriber.update({
      data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
      select: { token: true },
      where: { token },
    })

    revalidateTag("newsletter", "max")

    return Response.json({
      data: { message: "Unsubscribed successfully." },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/newsletter/unsubscribe]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
