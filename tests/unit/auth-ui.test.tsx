import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  push: vi.fn(),
  signIn: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock("next-auth/react", () => ({ signIn: mocks.signIn }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: mocks.useSearchParams,
}))

import LoginPage from "@/app/(auth)/login/page"
import { InviteForm } from "@/components/auth/InviteForm"

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useSearchParams.mockReturnValue(new URLSearchParams())
    mocks.signIn.mockResolvedValue(undefined)
  })

  it("submits the Resend magic-link sign-in", async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "writer@example.com"
    )
    await user.click(screen.getByRole("button", { name: "Send login link" }))

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith("resend", {
        email: "writer@example.com",
        callbackUrl: "/dashboard",
        redirect: false,
      })
    })
  })

  it("shows the verification message after a magic link is sent", () => {
    mocks.useSearchParams.mockReturnValue(new URLSearchParams("verify=1"))

    render(<LoginPage />)

    expect(
      screen.getByRole("heading", { name: "Check your email" })
    ).toBeInTheDocument()
  })

  it("shows the verification message for the Auth.js verify-request redirect", () => {
    mocks.useSearchParams.mockReturnValue(
      new URLSearchParams("provider=resend&type=email")
    )

    render(<LoginPage />)

    expect(
      screen.getByRole("heading", { name: "Check your email" })
    ).toBeInTheDocument()
  })

  it("shows a link-specific error when Auth.js rejects a magic link", () => {
    mocks.useSearchParams.mockReturnValue(
      new URLSearchParams("error=Verification")
    )

    render(<LoginPage />)

    expect(
      screen.getByText("This login link is invalid or expired. Request a new one.")
    ).toBeInTheDocument()
  })
})

describe("InviteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", mocks.fetch)
    mocks.signIn.mockResolvedValue(undefined)
  })

  it("creates the account then starts magic-link sign-in", async () => {
    const user = userEvent.setup()
    mocks.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { message: "Account created successfully" } }),
        { status: 201 }
      )
    )
    render(<InviteForm token="invite-token" email="writer@example.com" />)

    await user.type(screen.getByRole("textbox", { name: "Display Name" }), "Writer")
    await user.type(screen.getByRole("textbox", { name: "Username" }), "New_Writer")
    await user.click(screen.getByRole("button", { name: "Create account" }))

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "invite-token",
          name: "Writer",
          username: "new_writer",
        }),
      })
    })
    expect(mocks.signIn).toHaveBeenCalledWith("resend", {
      email: "writer@example.com",
      callbackUrl: "/dashboard",
      redirect: true,
    })
  })

  it("shows an API error and does not sign in", async () => {
    mocks.fetch.mockResolvedValue(
      new Response(JSON.stringify({ error: "Username is already taken" }), {
        status: 400,
      })
    )
    render(<InviteForm token="invite-token" email="writer@example.com" />)

    fireEvent.change(screen.getByRole("textbox", { name: "Display Name" }), {
      target: { value: "Writer" },
    })
    fireEvent.change(screen.getByRole("textbox", { name: "Username" }), {
      target: { value: "existing" },
    })
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("Username is already taken")).toBeInTheDocument()
    expect(mocks.signIn).not.toHaveBeenCalled()
  })
})
