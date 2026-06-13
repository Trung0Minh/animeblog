import { ZodError, z } from "zod"
import { revalidateTag } from "next/cache"

import { prisma } from "@/lib/prisma"
import { sendSubscribeConfirmationEmail } from "@/lib/resend"

const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
})

export async function POST(request: Request) {
  try {
    const { email } = subscribeSchema.parse(await request.json())

    const existing = await prisma.newsletterSubscriber.findUnique({
      select: { email: true, status: true, token: true },
      where: { email },
    })

    if (existing?.status === "ACTIVE") {
      return Response.json(
        { data: { message: "You are already subscribed." } },
        { status: 200 },
      )
    }

    const subscriber =
      existing?.status === "UNSUBSCRIBED"
        ? await prisma.newsletterSubscriber.update({
            data: { status: "ACTIVE", unsubscribedAt: null },
            select: { email: true, token: true },
            where: { email },
          })
        : await prisma.newsletterSubscriber.create({
            data: { email },
            select: { email: true, token: true },
          })

    revalidateTag("newsletter", "max")

    try {
      await sendSubscribeConfirmationEmail({ to: subscriber.email })
    } catch (error) {
      console.error(
        "[POST /api/newsletter/subscribe] Failed to send confirmation email:",
        error,
      )
    }

    return Response.json(
      { data: { message: "Subscribed successfully." } },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/newsletter/subscribe]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
