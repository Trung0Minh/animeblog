import type { Metadata } from "next"
import Link from "next/link"

import { PageContainer } from "@/components/layout/PageContainer"
import { buildMetadata, getAppName } from "@/lib/seo"

const PUBLISHING_NOTES = [
  {
    title: "Close readings",
    text: "Essays that treat animation, direction, editing, and performance as choices worth studying frame by frame.",
  },
  {
    title: "Reviews with context",
    text: "Series and episode writing that cares about craft, production history, and the expectations a work is responding to.",
  },
  {
    title: "Production notes",
    text: "Shorter pieces on studios, staff, visual motifs, and the practical decisions behind memorable anime scenes.",
  },
]

export async function generateMetadata(): Promise<Metadata> {
  const appName = getAppName()

  return buildMetadata({
    canonicalPath: "/about",
    description: `${appName} is an invite-only editorial blog for anime analysis, reviews, and production insight.`,
    title: "About",
  })
}

export default function AboutPage() {
  const appName = getAppName()

  return (
    <PageContainer>
      <section className="border-b pb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          About
        </p>
        <h1 className="max-w-3xl text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          {appName} is a quiet place for serious writing about Japanese
          animation.
        </h1>
        <div className="mt-6 grid gap-5 font-serif text-lg leading-relaxed text-muted-foreground sm:grid-cols-[1.2fr_0.8fr]">
          <p>
            This publication is built for essays, reviews, and notes that need
            room to breathe. The focus is not daily discourse or quick scoring.
            It is close attention: what a scene is doing, how it is made, and
            why those choices matter.
          </p>
          <p>
            Writers join by invite so the site can stay small, deliberate, and
            edited around a shared standard for long-form anime criticism.
          </p>
        </div>
      </section>

      <section className="py-10">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          What We Publish
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PUBLISHING_NOTES.map((note) => (
            <article className="rounded-xl border p-5" key={note.title}>
              <h2 className="font-semibold tracking-tight">{note.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {note.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/30 p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">
          Read through the archive.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Start with the latest essays, or meet the writers shaping the
          publication.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            href="/"
          >
            Latest posts
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-muted"
            href="/contributors"
            prefetch={false}
          >
            Contributors
          </Link>
        </div>
      </section>
    </PageContainer>
  )
}
