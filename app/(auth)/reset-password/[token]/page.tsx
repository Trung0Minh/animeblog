import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
}

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>
}

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { token } = await params

  return <ResetPasswordForm token={token} />
}
