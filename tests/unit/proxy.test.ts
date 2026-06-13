import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn((handler: unknown) => handler),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))

import proxy from "@/proxy"

interface ProxyRequest {
  auth: null | { user: { role: "ADMIN" | "WRITER" } }
  headers: { get: (name: string) => string | null }
  nextUrl: { pathname: string }
  url: string
}

const runProxy = proxy as unknown as (request: ProxyRequest) => Response

function request(
  pathname: string,
  role?: "ADMIN" | "WRITER",
  headers: Record<string, string> = {},
): ProxyRequest {
  return {
    auth: role ? { user: { role } } : null,
    headers: {
      get: (name) => headers[name] ?? null,
    },
    nextUrl: { pathname },
    url: `http://localhost${pathname}`,
  }
}

describe("proxy route protection", () => {
  it("redirects anonymous dashboard visitors to login", () => {
    const response = runProxy(request("/dashboard/posts"))

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?callbackUrl=%2Fdashboard%2Fposts"
    )
  })

  it("redirects writers away from admin routes", () => {
    const response = runProxy(request("/admin/writers", "WRITER"))

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("http://localhost/")
  })

  it("allows admins through admin routes", () => {
    const response = runProxy(request("/admin/writers", "ADMIN"))

    expect(response.status).toBe(200)
  })

  it("lets RSC navigations rely on protected server layouts", () => {
    const response = runProxy(request("/admin/posts", undefined, { RSC: "1" }))

    expect(response.status).toBe(200)
  })
})
