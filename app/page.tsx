export default function HomePage() {
  return (
    <main className="container py-16 sm:py-24">
      <section className="max-w-3xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Publication foundation
        </p>
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Serious writing about Japanese animation.
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground">
          In-depth analysis, production insight, interviews, and reviews in an
          editorial space designed for comfortable long-form reading.
        </p>
      </section>

      <section className="mt-16 border-t pt-8" aria-labelledby="status-title">
        <h2
          id="status-title"
          className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
        >
          Project status
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The application foundation is ready. Publishing features will be
          added in the ordered phases defined by the implementation plan.
        </p>
      </section>
    </main>
  )
}
