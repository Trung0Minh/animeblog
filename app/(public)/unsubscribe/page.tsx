import Link from "next/link"

import { prisma } from "@/lib/prisma"

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>
}

type UnsubscribeStatus = "already" | "invalid" | "success"

const messages: Record<
  UnsubscribeStatus,
  { body: string; heading: string; tone: string }
> = {
  already: {
    body: "This address is not currently subscribed to newsletter emails.",
    heading: "Already unsubscribed",
    tone: "border-muted bg-muted/30",
  },
  invalid: {
    body: "This unsubscribe link is not valid. It may have expired or been copied incorrectly.",
    heading: "Invalid link",
    tone: "border-destructive/30 bg-destructive/5",
  },
  success: {
    body: "You will not receive any more newsletter emails from this blog.",
    heading: "You've been unsubscribed",
    tone: "border-editorial/30 bg-editorial/5",
  },
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token } = await searchParams

  if (!token) {
    return <UnsubscribeResult status="invalid" />
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    select: { status: true, token: true },
    where: { token },
  })

  if (!subscriber) {
    return <UnsubscribeResult status="invalid" />
  }

  if (subscriber.status === "UNSUBSCRIBED") {
    return <UnsubscribeResult status="already" />
  }

  await prisma.newsletterSubscriber.update({
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
    select: { token: true },
    where: { token },
  })

  return <UnsubscribeResult status="success" />
}

function UnsubscribeResult({ status }: { status: UnsubscribeStatus }) {
  const message = messages[status]

  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <section
        className={`w-full max-w-md rounded-xl border p-8 text-center shadow-sm ${message.tone}`}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-editorial">
          Newsletter
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          {message.heading}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {message.body}
        </p>
        <Link
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/"
        >
          Back to blog
        </Link>
      </section>
    </main>
  )
}
