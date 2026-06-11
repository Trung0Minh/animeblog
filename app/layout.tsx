import type { Metadata } from "next"
import { Inter, Lora } from "next/font/google"
import Script from "next/script"

import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { DEFAULT_DESCRIPTION, getAppName, getAppUrl } from "@/lib/seo"

import "./globals.css"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
})

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-lora",
})

export const metadata: Metadata = {
  title: {
    default: getAppName(),
    template: `%s | ${getAppName()}`,
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(getAppUrl()),
  openGraph: {
    locale: "vi_VN",
    siteName: getAppName(),
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const shouldLoadAnalytics =
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL &&
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

  return (
    <html
      lang="vi"
      className={`${inter.variable} ${lora.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </ThemeProvider>
        {shouldLoadAnalytics && (
          <Script
            data-do-not-track="true"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
