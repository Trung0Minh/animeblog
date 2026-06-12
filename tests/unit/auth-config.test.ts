import type { NextAuthConfig } from "next-auth"
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  nextAuth: vi.fn((config: unknown) => ({
    auth: "auth",
    handlers: "handlers",
    signIn: "signIn",
    signOut: "signOut",
    config,
  })),
  prismaAdapter: vi.fn(() => ({ name: "prisma-adapter" })),
  resendProvider: vi.fn((options: unknown) => ({
    id: "resend",
    options,
  })),
  userFindUnique: vi.fn(),
}))

vi.mock("next-auth", () => ({ default: mocks.nextAuth }))
vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: mocks.prismaAdapter,
}))
vi.mock("next-auth/providers/resend", () => ({
  default: mocks.resendProvider,
}))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}))

let config: NextAuthConfig

beforeAll(async () => {
  vi.stubEnv("AUTH_SECRET", "auth-secret")
  vi.stubEnv("NEXTAUTH_SECRET", "nextauth-secret")
  await import("@/lib/auth")
  config = mocks.nextAuth.mock.calls[0][0] as NextAuthConfig
})

afterAll(() => {
  vi.unstubAllEnvs()
})

beforeEach(() => {
  mocks.userFindUnique.mockReset()
})

describe("NextAuth configuration", () => {
  it("uses long-lived database sessions and the custom auth pages", () => {
    expect(config.session).toEqual({
      maxAge: 60 * 60 * 24 * 180,
      strategy: "database",
      updateAge: 60 * 60 * 24,
    })
    expect(config.secret).toBe("auth-secret")
    expect(config.trustHost).toBe(true)
    expect(config.pages).toEqual({
      signIn: "/login",
      error: "/login",
      verifyRequest: "/login",
    })
  })

  it("configures the Resend provider from environment variables", () => {
    expect(mocks.resendProvider).toHaveBeenCalledWith({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL,
    })
  })

  it("blocks sign-in when the email has no active account", async () => {
    mocks.userFindUnique.mockResolvedValue(null)
    const signInCallback = config.callbacks?.signIn

    const result = await signInCallback?.({
      account: null,
      credentials: undefined,
      email: { verificationRequest: true },
      profile: undefined,
      user: { id: "candidate", email: "missing@example.com" },
    })

    expect(result).toBe(false)
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { email: "missing@example.com" },
      select: { id: true, role: true },
    })
  })

  it("allows sign-in when the email has an account", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: "writer-1", role: "WRITER" })
    const signInCallback = config.callbacks?.signIn

    const result = await signInCallback?.({
      account: null,
      credentials: undefined,
      email: { verificationRequest: true },
      profile: undefined,
      user: { id: "writer-1", email: "writer@example.com" },
    })

    expect(result).toBe(true)
  })

  it("blocks sign-in for revoked writers", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: "writer-1", role: "REVOKED" })
    const signInCallback = config.callbacks?.signIn

    const result = await signInCallback?.({
      account: null,
      credentials: undefined,
      email: { verificationRequest: true },
      profile: undefined,
      user: { id: "writer-1", email: "writer@example.com" },
    })

    expect(result).toBe(false)
  })

  it("adds role, username, and avatar URL to database sessions", async () => {
    mocks.userFindUnique.mockResolvedValue({
      role: "WRITER",
      username: "writer",
      avatarUrl: "https://example.com/avatar.png",
    })
    const session = {
      expires: new Date(Date.now() + 60_000).toISOString(),
      user: {
        id: "writer-1",
        name: "Writer",
        email: "writer@example.com",
        role: "WRITER" as const,
        username: "",
        avatarUrl: null,
      },
    }
    const sessionCallback = config.callbacks?.session as unknown as (options: {
      session: typeof session
      user: { id: string }
    }) => Promise<typeof session>

    const result = await sessionCallback({
      session,
      user: { id: "writer-1" },
    })

    expect(result.user).toMatchObject({
      role: "WRITER",
      username: "writer",
      avatarUrl: "https://example.com/avatar.png",
    })
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { id: "writer-1" },
      select: { role: true, username: true, avatarUrl: true },
    })
  })
})
