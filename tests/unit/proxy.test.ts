import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn((handler: unknown) => handler),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))

import proxy from "@/proxy"

interface ProxyRequest {
  auth: null | { user: { role: "ADMIN" | "WRITER" } }
  nextUrl: { pathname: string }
  url: string
}

const runProxy = proxy as unknown as (request: ProxyRequest) => Response

function request(pathname: string, role?: "ADMIN" | "WRITER"): ProxyRequest {
  return {
    auth: role ? { user: { role } } : null,
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
})
