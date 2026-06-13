import { ZodError, z } from "zod"

import {
  createPasswordResetToken,
  getPasswordResetExpiresAt,
  hashPasswordResetToken,
} from "@/lib/passwordReset"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/resend"

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
})

const forgotPasswordMessage =
  "If this email belongs to an invited writer, a reset link has been sent."

function forgotPasswordResponse() {
  return Response.json({ data: { message: forgotPasswordMessage } })
}

export async function POST(request: Request) {
  try {
    const { email } = forgotPasswordSchema.parse(await request.json())
    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true, id: true, role: true },
    })

    if (!user || user.role === "REVOKED") {
      return forgotPasswordResponse()
    }

    const token = createPasswordResetToken()
    const tokenHash = hashPasswordResetToken(token)

    await prisma.passwordResetToken.create({
      data: {
        expiresAt: getPasswordResetExpiresAt(),
        tokenHash,
        userId: user.id,
      },
      select: { id: true },
    })

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin

      await sendPasswordResetEmail({
        resetUrl: `${appUrl}/reset-password/${token}`,
        to: user.email,
      })
    } catch (error) {
      console.error("[POST /api/auth/password/forgot] email delivery", error)
    }

    return forgotPasswordResponse()
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[POST /api/auth/password/forgot]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
