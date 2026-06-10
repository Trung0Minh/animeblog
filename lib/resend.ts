import { Resend } from "resend"

import { InviteEmail } from "@/emails/InviteEmail"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInviteEmailOptions {
  to: string
  inviteToken: string
  invitedByName: string
}

export async function sendInviteEmail({
  to,
  inviteToken,
  invitedByName,
}: SendInviteEmailOptions) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const from = process.env.RESEND_FROM_EMAIL

  if (!appUrl || !from) {
    throw new Error("Resend email environment variables are not configured")
  }

  const inviteUrl = `${appUrl}/invite/${inviteToken}`
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${invitedByName} invited you to write on Anime Blog`,
    react: InviteEmail({ invitedByName, inviteUrl }),
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
