import { ZodError, z } from "zod"
import { revalidateTag } from "next/cache"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { sendInviteEmail } from "@/lib/resend"

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
})

export async function POST(request: Request) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { email } = inviteSchema.parse(await request.json())
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return Response.json(
        { error: "This email already has an account" },
        { status: 400 }
      )
    }

    const existingInvite = await prisma.invite.findFirst({
      where: {
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    })

    if (existingInvite) {
      return Response.json(
        { error: "A pending invite already exists for this email" },
        { status: 400 }
      )
    }

    const invite = await prisma.invite.create({
      data: {
        email,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdById: activeSession.user.id,
      },
      select: { token: true },
    })

    try {
      await sendInviteEmail({
        to: email,
        inviteToken: invite.token,
        invitedByName: activeSession.user.name,
      })
    } catch (error) {
      await prisma.invite.delete({
        where: { token: invite.token },
        select: { id: true },
      })
      throw error
    }

    revalidateTag("invites", "max")

    return Response.json(
      { data: { message: "Invite sent successfully" } },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/invite]", error)
    if (
      error instanceof Error &&
      (error.message.includes("Resend") ||
        error.message.includes("email environment"))
    ) {
      return Response.json(
        {
          error:
            "Invite email could not be sent. Check the Resend configuration and sender domain.",
        },
        { status: 502 }
      )
    }

    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
