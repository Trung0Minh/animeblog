import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const trackMock = vi.hoisted(() => vi.fn())

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  Lora: () => ({ variable: "--font-lora" }),
}))
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock("next/script", () => ({
  default: (props: React.ScriptHTMLAttributes<HTMLScriptElement>) => (
    <script data-testid="umami-script" {...props} />
  ),
}))
vi.mock("@/components/layout/Navbar", () => ({
  Navbar: () => <header>Navbar</header>,
}))
vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer>Footer</footer>,
}))

import RootLayout from "@/app/layout"
import { trackEvent } from "@/lib/analytics"
import {
  getPostViewCount,
  getUmamiStats,
  getUmamiTopPages,
} from "@/lib/umami"

describe("Umami layout script", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("does not load the analytics script outside production", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("NEXT_PUBLIC_UMAMI_SCRIPT_URL", "https://umami.example/script.js")
    vi.stubEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID", "website-public")

    render(
      <RootLayout>
        <p>Page content</p>
      </RootLayout>,
    )

    expect(screen.queryByTestId("umami-script")).not.toBeInTheDocument()
  })

  it("loads the analytics script in production when public env vars exist", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_UMAMI_SCRIPT_URL", "https://umami.example/script.js")
    vi.stubEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID", "website-public")

    render(
      <RootLayout>
        <p>Page content</p>
      </RootLayout>,
    )

    const script = screen.getByTestId("umami-script")
    expect(script).toHaveAttribute("src", "https://umami.example/script.js")
    expect(script).toHaveAttribute("data-website-id", "website-public")
    expect(script).toHaveAttribute("data-do-not-track", "true")
  })
})

describe("trackEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, "umami", {
      configurable: true,
      value: { track: trackMock },
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(window, "umami")
  })

  it("tracks custom events with optional data", () => {
    trackEvent("newsletter_subscribed", { source: "sidebar" })

    expect(trackMock).toHaveBeenCalledWith("newsletter_subscribed", {
      source: "sidebar",
    })
  })

  it("falls back silently when the tracker is not loaded", () => {
    Reflect.deleteProperty(window, "umami")

    expect(() => trackEvent("post_read")).not.toThrow()
  })
})

describe("Umami API helper", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("UMAMI_API_URL", "https://umami.example/")
    vi.stubEnv("UMAMI_USERNAME", "admin")
    vi.stubEnv("UMAMI_PASSWORD", "password")
    vi.stubEnv("UMAMI_WEBSITE_ID", "website-server")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("logs in and normalizes summary statistics from the current Umami API shape", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "token-1" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            bounces: 10,
            comparison: {
              bounces: 8,
              pageviews: 80,
              totaltime: 300,
              visitors: 20,
              visits: 30,
            },
            pageviews: 120,
            totaltime: 420,
            visitors: 25,
            visits: 40,
          }),
          { status: 200 },
        ),
      )
    vi.stubGlobal("fetch", fetchMock)

    await expect(getUmamiStats(1000, 2000)).resolves.toEqual({
      bounces: { prev: 8, value: 10 },
      pageviews: { prev: 80, value: 120 },
      totalTime: { prev: 300, value: 420 },
      visitors: { prev: 20, value: 25 },
      visits: { prev: 30, value: 40 },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://umami.example/api/auth/login",
      expect.objectContaining({
        body: JSON.stringify({ password: "password", username: "admin" }),
        method: "POST",
      }),
    )
    const statsUrl = String(fetchMock.mock.calls[1]?.[0])
    expect(statsUrl).toContain("/api/websites/website-server/stats?")
    expect(statsUrl).toContain("startAt=1000")
    expect(statsUrl).toContain("endAt=2000")
  })

  it("fetches top pages with Umami's path metrics type", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "token-1" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ x: "/post", y: 9 }]), { status: 200 }),
      )
    vi.stubGlobal("fetch", fetchMock)

    await expect(getUmamiTopPages(1000, 2000, 3)).resolves.toEqual([
      { x: "/post", y: 9 },
    ])
    const url = String(fetchMock.mock.calls[1]?.[0])
    expect(url).toContain("/api/websites/website-server/metrics?")
    expect(url).toContain("type=path")
    expect(url).toContain("limit=3")
  })

  it("returns a post's exact path view count and falls back to zero on errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "token-1" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { x: "/other", y: 2 },
            { x: "/frieren-memory", y: 14 },
          ]),
          { status: 200 },
        ),
      )
      .mockRejectedValueOnce(new Error("offline"))
    vi.stubGlobal("fetch", fetchMock)

    await expect(getPostViewCount("frieren-memory")).resolves.toBe(14)
    await expect(getPostViewCount("frieren-memory")).resolves.toBe(0)
  })
})

describe("analytics tracking components", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("tracks a post read after the read threshold", async () => {
    const analytics = await import("@/lib/analytics")
    const trackSpy = vi.spyOn(analytics, "trackEvent").mockImplementation(() => {})
    const { PostReadTracker } = await import("@/components/posts/PostReadTracker")

    render(<PostReadTracker slug="frieren-memory" title="Frieren and memory" />)

    expect(trackSpy).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(trackSpy).toHaveBeenCalledWith("post_read", {
      slug: "frieren-memory",
      title: "Frieren and memory",
    })
  })

  it("tracks a search query on the search results page", async () => {
    const analytics = await import("@/lib/analytics")
    const trackSpy = vi.spyOn(analytics, "trackEvent").mockImplementation(() => {})
    const { SearchPageTracker } = await import(
      "@/components/search/SearchPageTracker"
    )

    render(<SearchPageTracker query="frieren" />)

    expect(trackSpy).toHaveBeenCalledWith("search", { query: "frieren" })
  })
})
