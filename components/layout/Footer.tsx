import Link from "next/link"

export function Footer() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>
          &copy; {year} {appName}
        </p>
        <nav aria-label="Footer navigation" className="flex items-center gap-4">
          <Link
            className="transition-colors hover:text-foreground"
            href="/about"
            prefetch={false}
          >
            About
          </Link>
          <Link
            className="transition-colors hover:text-foreground"
            href="/contributors"
            prefetch={false}
          >
            Contributors
          </Link>
        </nav>
      </div>
    </footer>
  )
}
