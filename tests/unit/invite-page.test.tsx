import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  inviteFindUnique: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT")
  }),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    invite: {
      findUnique: mocks.inviteFindUnique,
    },
  },
}))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/components/auth/InviteForm", () => ({
  InviteForm: ({ email, token }: { email: string; token: string }) => (
    <div data-email={email} data-token={token}>
      Invite form
    </div>
  ),
}))

import InvitePage from "@/app/(auth)/invite/[token]/page"

describe("InvitePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders a valid pending invite", async () => {
    mocks.inviteFindUnique.mockResolvedValue({
      email: "writer@example.com",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 60_000),
    })

    const page = await InvitePage({
      params: Promise.resolve({ token: "invite-token" }),
    })
    const html = renderToStaticMarkup(page)

    expect(html).toContain('data-email="writer@example.com"')
    expect(html).toContain('data-token="invite-token"')
  })

  it("redirects invalid invites to login", async () => {
    mocks.inviteFindUnique.mockResolvedValue(null)

    await expect(
      InvitePage({ params: Promise.resolve({ token: "invalid" }) })
    ).rejects.toThrow("NEXT_REDIRECT")
    expect(mocks.redirect).toHaveBeenCalledWith("/login?error=invite-invalid")
  })
})
