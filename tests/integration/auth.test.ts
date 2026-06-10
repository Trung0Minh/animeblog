import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  inviteCreate: vi.fn(),
  inviteDelete: vi.fn(),
  inviteFindFirst: vi.fn(),
  inviteFindUnique: vi.fn(),
  inviteUpdate: vi.fn(),
  sendInviteEmail: vi.fn(),
  transaction: vi.fn(),
  userCreate: vi.fn(),
  userFindUnique: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/resend", () => ({ sendInviteEmail: mocks.sendInviteEmail }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    invite: {
      create: mocks.inviteCreate,
      delete: mocks.inviteDelete,
      findFirst: mocks.inviteFindFirst,
      findUnique: mocks.inviteFindUnique,
      update: mocks.inviteUpdate,
    },
    user: {
      create: mocks.userCreate,
      findUnique: mocks.userFindUnique,
    },
    $transaction: mocks.transaction,
  },
}))

import { POST as acceptInvite } from "@/app/api/invite/accept/route"
import { POST as createInvite } from "@/app/api/invite/route"

const adminSession = {
  user: {
    id: "admin-1",
    name: "Admin Writer",
    role: "ADMIN",
  },
}

function postRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue(adminSession)
    mocks.userFindUnique.mockResolvedValue(null)
    mocks.inviteFindFirst.mockResolvedValue(null)
    mocks.inviteCreate.mockResolvedValue({ token: "invite-token" })
    mocks.inviteDelete.mockResolvedValue({ id: "invite-1" })
    mocks.sendInviteEmail.mockResolvedValue(undefined)
  })

  it("rejects unauthenticated requests", async () => {
    mocks.auth.mockResolvedValue(null)

    const response = await createInvite(
      postRequest("/api/invite", { email: "writer@example.com" })
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
  })

  it("rejects non-admin users", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", name: "Writer", role: "WRITER" },
    })

    const response = await createInvite(
      postRequest("/api/invite", { email: "writer@example.com" })
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
  })

  it("creates and emails an invite for a new writer", async () => {
    const response = await createInvite(
      postRequest("/api/invite", { email: " Writer@Example.com " })
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Invite sent successfully" },
    })
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { email: "writer@example.com" },
      select: { id: true },
    })
    expect(mocks.inviteCreate).toHaveBeenCalledWith({
      data: {
        email: "writer@example.com",
        expiresAt: expect.any(Date),
        createdById: "admin-1",
      },
      select: { token: true },
    })
    expect(mocks.sendInviteEmail).toHaveBeenCalledWith({
      to: "writer@example.com",
      inviteToken: "invite-token",
      invitedByName: "Admin Writer",
    })
    expect(mocks.inviteFindFirst).toHaveBeenCalledWith({
      where: {
        email: "writer@example.com",
        status: "PENDING",
        expiresAt: { gt: expect.any(Date) },
      },
      select: { id: true },
    })
  })

  it("rejects an email that already has an account", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: "writer-1" })

    const response = await createInvite(
      postRequest("/api/invite", { email: "writer@example.com" })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "This email already has an account",
    })
    expect(mocks.inviteCreate).not.toHaveBeenCalled()
  })

  it("rejects an email with a pending invite", async () => {
    mocks.inviteFindFirst.mockResolvedValue({ id: "invite-1" })

    const response = await createInvite(
      postRequest("/api/invite", { email: "writer@example.com" })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "A pending invite already exists for this email",
    })
    expect(mocks.inviteCreate).not.toHaveBeenCalled()
  })

  it("returns a validation error for an invalid email", async () => {
    const response = await createInvite(
      postRequest("/api/invite", { email: "not-an-email" })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request",
    })
  })

  it("removes the invite when email delivery fails so it can be retried", async () => {
    mocks.sendInviteEmail.mockRejectedValue(new Error("Resend failed"))

    const response = await createInvite(
      postRequest("/api/invite", { email: "writer@example.com" })
    )

    expect(response.status).toBe(500)
    expect(mocks.inviteDelete).toHaveBeenCalledWith({
      where: { token: "invite-token" },
      select: { id: true },
    })
  })
})

describe("POST /api/invite/accept", () => {
  const validInvite = {
    id: "invite-1",
    email: "writer@example.com",
    status: "PENDING",
    expiresAt: new Date(Date.now() + 60_000),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.inviteFindUnique.mockResolvedValue(validInvite)
    mocks.userFindUnique.mockResolvedValue(null)
    mocks.userCreate.mockResolvedValue({ id: "writer-1" })
    mocks.inviteUpdate.mockResolvedValue({ id: "invite-1" })
    mocks.transaction.mockResolvedValue([])
  })

  it("rejects an invalid invite token", async () => {
    mocks.inviteFindUnique.mockResolvedValue(null)

    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "invalid",
        name: "New Writer",
        username: "new_writer",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid invite link",
    })
  })

  it("marks an expired invite before rejecting it", async () => {
    mocks.inviteFindUnique.mockResolvedValue({
      ...validInvite,
      expiresAt: new Date(Date.now() - 60_000),
    })

    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "expired",
        name: "New Writer",
        username: "new_writer",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "This invite link has expired",
    })
    expect(mocks.inviteUpdate).toHaveBeenCalledWith({
      where: { id: "invite-1" },
      data: { status: "EXPIRED" },
      select: { id: true },
    })
  })

  it("rejects a username that is already taken", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing-writer" })

    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "invite-token",
        name: "New Writer",
        username: "existing_writer",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Username is already taken",
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it("rejects an invite when its email already has an account", async () => {
    mocks.userFindUnique.mockResolvedValueOnce({ id: "existing-writer" })

    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "invite-token",
        name: "New Writer",
        username: "new_writer",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "This email already has an account",
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it("creates the writer and accepts the invite in one transaction", async () => {
    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "invite-token",
        name: " New Writer ",
        username: "new_writer",
      })
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Account created successfully" },
    })
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: {
        email: "writer@example.com",
        name: "New Writer",
        username: "new_writer",
        role: "WRITER",
      },
      select: { id: true },
    })
    expect(mocks.inviteUpdate).toHaveBeenCalledWith({
      where: { id: "invite-1" },
      data: { status: "ACCEPTED" },
      select: { id: true },
    })
    expect(mocks.transaction).toHaveBeenCalledOnce()
  })

  it("returns a validation error for an invalid username", async () => {
    const response = await acceptInvite(
      postRequest("/api/invite/accept", {
        token: "invite-token",
        name: "New Writer",
        username: "Invalid Username",
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request",
    })
  })
})
