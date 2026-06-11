import { beforeEach, describe, expect, it, vi } from "vitest"

const awsMocks = vi.hoisted(() => ({
  clientOptions: undefined as unknown,
  putObjectInput: undefined as unknown,
  send: vi.fn(),
}))

vi.mock("@aws-sdk/client-s3", () => ({
  PutObjectCommand: vi.fn(function PutObjectCommand(input: unknown) {
    awsMocks.putObjectInput = input
    return { input }
  }),
  S3Client: vi.fn(function S3Client(options: unknown) {
    awsMocks.clientOptions = options
    return { send: awsMocks.send }
  }),
}))

async function importR2() {
  vi.resetModules()
  return import("@/lib/r2")
}

describe("uploadToR2", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    awsMocks.clientOptions = undefined
    awsMocks.putObjectInput = undefined
    process.env.R2_ACCOUNT_ID = "account-id"
    process.env.R2_ACCESS_KEY_ID = "access-key"
    process.env.R2_SECRET_ACCESS_KEY = "secret-key"
    process.env.R2_BUCKET_NAME = "animeblog"
    process.env.R2_PUBLIC_URL = "https://cdn.example.com"
    awsMocks.send.mockResolvedValue({})
  })

  it("uploads an object to R2 and returns its public URL", async () => {
    const { uploadToR2 } = await importR2()
    const body = Buffer.from("gif-bytes")

    await expect(
      uploadToR2({
        key: "content-images/example.gif",
        body,
        contentType: "image/gif",
      }),
    ).resolves.toBe("https://cdn.example.com/content-images/example.gif")

    expect(awsMocks.clientOptions).toEqual({
      credentials: {
        accessKeyId: "access-key",
        secretAccessKey: "secret-key",
      },
      endpoint: "https://account-id.r2.cloudflarestorage.com",
      region: "auto",
    })
    expect(awsMocks.putObjectInput).toEqual({
      Body: body,
      Bucket: "animeblog",
      ContentType: "image/gif",
      Key: "content-images/example.gif",
    })
    expect(awsMocks.send).toHaveBeenCalledOnce()
  })

  it("fails fast when R2 environment variables are missing", async () => {
    delete process.env.R2_BUCKET_NAME
    const { uploadToR2 } = await importR2()

    await expect(
      uploadToR2({
        key: "content-images/example.gif",
        body: Buffer.from("gif-bytes"),
        contentType: "image/gif",
      }),
    ).rejects.toThrow("Cloudflare R2 environment variables are not configured")
  })
})
