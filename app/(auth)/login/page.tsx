"use client"

import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, Suspense, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [formError, setFormError] = useState("")
  const [loading, setLoading] = useState(false)
  const isVerify =
    searchParams.get("verify") === "1" ||
    (searchParams.get("provider") === "resend" &&
      searchParams.get("type") === "email")
  const error = searchParams.get("error")
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")
    setLoading(true)

    try {
      const result = await signIn("resend", {
        email,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setFormError(
          "This email is not registered. Contact an admin to get an invite."
        )
        return
      }

      router.push("/login?verify=1")
    } catch {
      setFormError("Unable to send the login link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (isVerify) {
    return (
      <AuthPanel>
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A login link has been sent to your email address.
        </p>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel>
      <h1 className="text-2xl font-bold tracking-tight">Writer login</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Enter your account email to receive a secure login link.
      </p>

      {(error === "invite-invalid" || formError) && (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {formError || "This invite link is invalid or has expired."}
        </p>
      )}

      {error && error !== "invite-invalid" && !formError && (
        <p className="mt-6 text-sm text-destructive" role="alert">
          This email is not registered. Contact an admin to get an invite.
        </p>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            autoComplete="email"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </div>
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? "Sending..." : "Send login link"}
        </Button>
      </form>
    </AuthPanel>
  )
}

function AuthPanel({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-sm sm:p-8">
        {children}
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
