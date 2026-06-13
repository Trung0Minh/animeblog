"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { trackEvent } from "@/lib/analytics"

type FormState = "error" | "idle" | "loading" | "success"

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Something went wrong. Please try again."
}

function getApiMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "message" in value.data &&
    typeof value.data.message === "string"
  ) {
    return value.data.message
  }

  return "Subscribed successfully."
}

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [state, setState] = useState<FormState>("idle")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    setState("loading")

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        setMessage(getApiError(result))
        setState("error")
        return
      }

      setEmail("")
      setMessage(getApiMessage(result))
      setState("success")
      trackEvent("newsletter_subscribed")
    } catch {
      setMessage("Something went wrong. Please try again.")
      setState("error")
    }
  }

  return (
    <div>
      <p className="text-[13px] leading-6 text-muted-foreground">
        Get notified when new essays are published.
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <Input
            autoCapitalize="none"
            autoComplete="email"
            disabled={state === "loading"}
            id="newsletter-email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            className="text-[13px]"
            placeholder="Your email address"
            required
            type="email"
            value={email}
          />
        </div>

        {state === "error" && (
          <p className="text-[13px] text-destructive" role="alert">
            {message}
          </p>
        )}

        {state === "success" && (
          <p className="text-[13px] font-medium text-editorial" role="status">
            {message}
          </p>
        )}

        <Button className="w-full" disabled={state === "loading"} type="submit">
          {state === "loading" ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        No spam. Every email includes a one-click unsubscribe link.
      </p>
    </div>
  )
}
