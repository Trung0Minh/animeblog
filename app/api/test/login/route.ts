import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { ZodError, z } from "zod"

import { prisma } from "@/lib/prisma"

const loginSchema = z.object({
  role: z.enum(["ADMIN", "WRITER"]),
})

type LoginRole = z.infer<typeof loginSchema>["role"]

const TEST_USERS: Record<
  LoginRole,
  { email: string; name: string; username: string }
> = {
  ADMIN: {
    email: "test-admin@example.com",
    name: "Test Admin",
    username: "test-admin",
  },
  WRITER: {
    email: "test-writer@example.com",
    name: "Test Writer",
    username: "test-writer",
  },
}

const SESSION_MAX_AGE_DAYS = 30

function notFound() {
  return Response.json({ error: "Not found" }, { status: 404 })
}

function isTestRouteEnabled() {
  return (
    process.env.NODE_ENV === "test" ||
    (process.env.NODE_ENV === "development" &&
      process.env.PLAYWRIGHT_TEST === "1")
  )
}

export async function POST(request: Request) {
  if (!isTestRouteEnabled()) {
    return notFound()
  }

  try {
    const { role } = loginSchema.parse(await request.json())
    const testUser = TEST_USERS[role]
    const sessionToken = randomUUID()
    const expires = new Date(
      Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    )

    const user = await prisma.$transaction(async (tx) => {
      const upsertedUser = await tx.user.upsert({
        create: {
          email: testUser.email,
          name: testUser.name,
          role,
          username: testUser.username,
        },
        select: { id: true, role: true },
        update: {
          name: testUser.name,
          role,
          username: testUser.username,
        },
        where: { email: testUser.email },
      })

      await tx.session.create({
        data: {
          expires,
          sessionToken,
          userId: upsertedUser.id,
        },
        select: { id: true },
      })

      return upsertedUser
    })

    const response = NextResponse.json({
      data: { role: user.role, userId: user.id },
    })

    response.cookies.set({
      expires,
      httpOnly: true,
      name: "authjs.session-token",
      path: "/",
      sameSite: "lax",
      value: sessionToken,
    })

    return response
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/test/login]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
