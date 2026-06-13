import Link from "next/link"

export function Footer() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border-default mt-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <span className="font-bold text-[16px] tracking-tight">{appName}</span>
            <p className="text-[13px] text-text-secondary mt-2">
              &copy; {year} {appName}
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex gap-6 text-[13px] text-text-secondary">
            <Link
              className="hover:text-text-primary transition-colors"
              href="/about"
            >
              About
            </Link>
            <Link
              className="hover:text-text-primary transition-colors"
              href="/contributors"
            >
              Contributors
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
