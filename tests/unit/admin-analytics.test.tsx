import { render, screen } from "@testing-library/react"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const umamiMocks = vi.hoisted(() => ({
  getUmamiStats: vi.fn(),
  getUmamiTopPages: vi.fn(),
}))

vi.mock("@/lib/umami", () => ({
  getUmamiStats: umamiMocks.getUmamiStats,
  getUmamiTopPages: umamiMocks.getUmamiTopPages,
}))
vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))

import AdminAnalyticsPage from "@/app/(admin)/admin/analytics/page"
import { AnalyticsWidget } from "@/components/admin/AnalyticsWidget"

function renderAsync(node: React.ReactNode) {
  render(<>{node}</>)
}

describe("AnalyticsWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("UMAMI_API_URL", "https://umami.example")
    umamiMocks.getUmamiStats.mockResolvedValue({
      bounces: { prev: 8, value: 10 },
      pageviews: { prev: 100, value: 150 },
      totalTime: { prev: 240, value: 300 },
      visitors: { prev: 30, value: 45 },
      visits: { prev: 40, value: 60 },
    })
    umamiMocks.getUmamiTopPages.mockResolvedValue([
      { x: "/frieren-memory", y: 25 },
      { x: "/", y: 10 },
    ])
  })

  it("renders summary metrics and top pages", async () => {
    renderAsync(await AnalyticsWidget())

    expect(screen.getByRole("heading", { name: "Analytics" })).toBeVisible()
    expect(screen.getByText("150")).toBeVisible()
    expect(screen.getByText("45")).toBeVisible()
    expect(screen.getByRole("link", { name: "/frieren-memory" })).toHaveAttribute(
      "href",
      "/frieren-memory",
    )
    expect(screen.getByRole("link", { name: /full analytics dashboard/i })).toHaveAttribute(
      "href",
      "https://umami.example",
    )
  })

  it("falls back gracefully when Umami is unavailable", async () => {
    umamiMocks.getUmamiStats.mockRejectedValue(new Error("offline"))

    renderAsync(await AnalyticsWidget())

    expect(screen.getByText("Analytics data unavailable.")).toBeVisible()
  })
})

describe("AdminAnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("UMAMI_API_URL", "https://umami.example")
    umamiMocks.getUmamiStats.mockResolvedValue({
      bounces: { prev: 0, value: 0 },
      pageviews: { prev: 0, value: 0 },
      totalTime: { prev: 0, value: 0 },
      visitors: { prev: 0, value: 0 },
      visits: { prev: 0, value: 0 },
    })
    umamiMocks.getUmamiTopPages.mockResolvedValue([])
  })

  it("renders the full analytics page with a link to Umami", async () => {
    renderAsync(await AdminAnalyticsPage())

    expect(screen.getByRole("heading", { name: "Analytics" })).toBeVisible()
    expect(
      screen.getByRole("link", { name: /open umami dashboard/i }),
    ).toHaveAttribute("href", "https://umami.example")
  })
})
