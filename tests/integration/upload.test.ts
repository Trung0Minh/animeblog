import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  nanoid: vi.fn(() => "file-id"),
  uploadToR2: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/r2", () => ({ uploadToR2: mocks.uploadToR2 }))
vi.mock("nanoid", () => ({ nanoid: mocks.nanoid }))

import { POST as upload } from "@/app/api/upload/route"

function uploadRequest(file?: File, folder = "content-images") {
  const form = new FormData()

  if (file) {
    form.append("file", file)
  }
  form.append("folder", folder)

  return {
    formData: () => Promise.resolve(form),
  } as Request
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.uploadToR2.mockResolvedValue(
      "https://cdn.example.com/content-images/file-id.gif",
    )
  })

  it("rejects unauthenticated uploads", async () => {
    mocks.auth.mockResolvedValue(null)

    const response = await upload(
      uploadRequest(new File(["gif"], "scene.gif", { type: "image/gif" })),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
  })

  it("requires a file", async () => {
    const response = await upload(uploadRequest())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "No file provided",
    })
  })

  it("rejects non-image files", async () => {
    const response = await upload(
      uploadRequest(new File(["text"], "notes.txt", { type: "text/plain" })),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Only JPEG, PNG, GIF, and WebP images are allowed",
    })
  })

  it("rejects files larger than 10 MB", async () => {
    const bytes = new Uint8Array(10 * 1024 * 1024 + 1)
    const response = await upload(
      uploadRequest(new File([bytes], "huge.gif", { type: "image/gif" })),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "File must be 10 MB or smaller",
    })
  })

  it("uploads an allowed image to R2", async () => {
    const response = await upload(
      uploadRequest(new File(["gif"], "Scene.GIF", { type: "image/gif" })),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: { url: "https://cdn.example.com/content-images/file-id.gif" },
    })
    expect(mocks.uploadToR2).toHaveBeenCalledWith({
      body: expect.any(Buffer),
      contentType: "image/gif",
      key: "content-images/file-id.gif",
    })
  })

  it("falls back to a safe folder and MIME extension for unsafe names", async () => {
    const response = await upload(
      uploadRequest(new File(["png"], "image", { type: "image/png" }), "../bad"),
    )

    expect(response.status).toBe(201)
    expect(mocks.uploadToR2).toHaveBeenCalledWith({
      body: expect.any(Buffer),
      contentType: "image/png",
      key: "uploads/file-id.png",
    })
  })
})
