"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Something went wrong"
}

export function InviteWriterForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    try {
      const response = await fetch("/api/invite", {
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        setError(getApiError(result))
        return
      }

      setEmail("")
      setMessage("Invite sent successfully")
      router.refresh()
    } catch {
      setError("Failed to send invite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {message && (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="writer-email">
          Writer email
        </label>
        <Input
          autoComplete="email"
          id="writer-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="writer@example.com"
          required
          type="email"
          value={email}
        />
      </div>

      <Button className="h-[34px] w-full font-semibold" disabled={loading} type="submit">
        {loading ? "Sending..." : "Send invite"}
      </Button>
    </form>
  )
}
