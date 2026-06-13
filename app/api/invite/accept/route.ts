import { ZodError, z } from "zod"
import { revalidateTag } from "next/cache"

import { hashPassword } from "@/lib/password"
import { prisma } from "@/lib/prisma"

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(2).max(50),
  password: z.string().min(10).max(128),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-z0-9_-]+$/,
      "Username may only contain lowercase letters, numbers, hyphens, and underscores"
    ),
})

export async function POST(request: Request) {
  try {
    const { token, name, password, username } = acceptInviteSchema.parse(
      await request.json()
    )
    const invite = await prisma.invite.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        status: true,
        expiresAt: true,
      },
    })

    if (!invite) {
      return Response.json({ error: "Invalid invite link" }, { status: 400 })
    }

    if (invite.status !== "PENDING") {
      return Response.json(
        { error: "This invite has already been used" },
        { status: 400 }
      )
    }

    if (invite.expiresAt < new Date()) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
        select: { id: true },
      })

      return Response.json(
        { error: "This invite link has expired" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
      select: { id: true },
    })

    if (existingUser) {
      return Response.json(
        { error: "This email already has an account" },
        { status: 400 }
      )
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (existingUsername) {
      return Response.json(
        { error: "Username is already taken" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.create({
        data: {
          email: invite.email,
          name,
          passwordHash,
          username,
          role: "WRITER",
        },
        select: { id: true },
      }),
      prisma.invite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED" },
        select: { id: true },
      }),
    ])

    revalidateTag("users", "max")
    revalidateTag("invites", "max")

    return Response.json(
      { data: { message: "Account created successfully" } },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/invite/accept]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
