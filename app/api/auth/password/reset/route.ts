import { ZodError, z } from "zod"

import { hashPassword } from "@/lib/password"
import { hashPasswordResetToken } from "@/lib/passwordReset"
import { prisma } from "@/lib/prisma"

const resetPasswordSchema = z.object({
  password: z.string().min(10).max(128),
  token: z.string().trim().min(1),
})

const invalidResetTokenMessage = "This reset link is invalid or has expired."

export async function POST(request: Request) {
  try {
    const { password, token } = resetPasswordSchema.parse(await request.json())
    const tokenHash = hashPasswordResetToken(token)
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        expiresAt: true,
        id: true,
        usedAt: true,
        user: { select: { role: true } },
        userId: true,
      },
    })

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt < new Date() ||
      resetToken.user.role === "REVOKED"
    ) {
      return Response.json({ error: invalidResetTokenMessage }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
        select: { id: true },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
        select: { id: true },
      }),
    ])

    return Response.json({ data: { message: "Password updated successfully" } })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/auth/password/reset]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
