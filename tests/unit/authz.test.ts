import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}))

import { getActiveSession } from "@/lib/authz"

describe("getActiveSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does not query the database when there is no session", async () => {
    mocks.auth.mockResolvedValue(null)

    await expect(getActiveSession()).resolves.toBeNull()

    expect(mocks.userFindUnique).not.toHaveBeenCalled()
  })

  it("returns a database-backed active user for allowed roles", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "writer-1",
        role: "WRITER",
      },
    })
    mocks.userFindUnique.mockResolvedValue({
      avatarUrl: null,
      email: "writer@example.com",
      id: "writer-1",
      name: "Mina Writer",
      role: "WRITER",
      username: "mina",
    })

    await expect(getActiveSession(["ADMIN", "WRITER"])).resolves.toEqual({
      session: {
        user: {
          id: "writer-1",
          role: "WRITER",
        },
      },
      user: {
        avatarUrl: null,
        email: "writer@example.com",
        id: "writer-1",
        name: "Mina Writer",
        role: "WRITER",
        username: "mina",
      },
    })
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      select: {
        avatarUrl: true,
        email: true,
        id: true,
        name: true,
        role: true,
        username: true,
      },
      where: { id: "writer-1" },
    })
  })

  it("rejects revoked users and stale admin JWTs", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "writer-1",
        role: "ADMIN",
      },
    })
    mocks.userFindUnique.mockResolvedValue({
      avatarUrl: null,
      email: "writer@example.com",
      id: "writer-1",
      name: "Mina Writer",
      role: "WRITER",
      username: "mina",
    })

    await expect(getActiveSession(["ADMIN"])).resolves.toBeNull()

    mocks.userFindUnique.mockResolvedValueOnce({
      avatarUrl: null,
      email: "writer@example.com",
      id: "writer-1",
      name: "Mina Writer",
      role: "REVOKED",
      username: "mina",
    })

    await expect(getActiveSession(["ADMIN", "WRITER"])).resolves.toBeNull()
  })
})
