import Link from "next/link"

export function Footer() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-4 py-8 text-[13px] text-muted-foreground sm:flex-row md:px-6 lg:px-8">
        <p>
          &copy; {year} {appName}
        </p>
        <nav aria-label="Footer navigation" className="flex items-center gap-4">
          <Link
            className="transition-colors hover:text-foreground"
            href="/about"
          >
            About
          </Link>
          <Link
            className="transition-colors hover:text-foreground"
            href="/contributors"
          >
            Contributors
          </Link>
        </nav>
      </div>
    </footer>
  )
}
