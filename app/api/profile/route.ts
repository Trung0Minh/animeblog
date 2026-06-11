import { ZodError, z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const profileSchema = z.object({
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().trim().max(500).optional(),
  name: z.string().trim().min(2).max(50),
})

export async function PATCH(request: Request) {
  const session = await auth()

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = profileSchema.parse(await request.json())
    const user = await prisma.user.update({
      data: {
        avatarUrl: data.avatarUrl ?? null,
        bio: data.bio || null,
        name: data.name,
      },
      select: {
        avatarUrl: true,
        bio: true,
        email: true,
        id: true,
        name: true,
        username: true,
      },
      where: { id: session.user.id },
    })

    return Response.json({ data: user })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[PATCH /api/profile]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
