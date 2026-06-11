import { Resend } from "resend"

import { CommentReplyEmail } from "@/emails/CommentReplyEmail"
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

interface SendCommentReplyEmailOptions {
  postTitle: string
  postUrl: string
  repliedByName: string
  replyContent: string
  to: string
  toName: string
}

export async function sendCommentReplyEmail({
  postTitle,
  postUrl,
  repliedByName,
  replyContent,
  to,
  toName,
}: SendCommentReplyEmailOptions) {
  const from = process.env.RESEND_FROM_EMAIL

  if (!from) {
    throw new Error("Resend email environment variables are not configured")
  }

  const { error } = await resend.emails.send({
    from,
    react: CommentReplyEmail({
      postTitle,
      postUrl,
      repliedByName,
      replyContent,
      toName,
    }),
    subject: `${repliedByName} replied to your comment on "${postTitle}"`,
    to,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
