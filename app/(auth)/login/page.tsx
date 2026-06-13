import { redirect } from "next/navigation"

import { LoginForm } from "@/components/auth/LoginForm"
import { auth } from "@/lib/auth"

export default async function LoginPage() {
  const session = await auth()

  if (session?.user.role === "ADMIN") {
    redirect("/admin")
  }

  if (session?.user.role === "WRITER") {
    redirect("/dashboard")
  }

  return <LoginForm />
}
