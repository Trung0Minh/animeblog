import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT")
  }),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/components/auth/LoginForm", () => ({
  LoginForm: () => <div data-testid="login-form">Login form</div>,
}))

import LoginPage from "@/app/(auth)/login/page"

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue(null)
  })

  it("renders the login form for anonymous visitors", async () => {
    const page = await LoginPage()
    const html = renderToStaticMarkup(page)

    expect(html).toContain('data-testid="login-form"')
  })

  it("redirects logged-in admins to the admin panel", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "ADMIN" } })

    await expect(LoginPage()).rejects.toThrow("NEXT_REDIRECT")
    expect(mocks.redirect).toHaveBeenCalledWith("/admin")
  })

  it("redirects logged-in writers to the dashboard", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "WRITER" } })

    await expect(LoginPage()).rejects.toThrow("NEXT_REDIRECT")
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard")
  })
})
