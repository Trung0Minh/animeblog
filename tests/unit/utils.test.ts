import type { PrismaClient } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"

import { cn, ensureUniqueSlug, formatDate, generateSlug } from "@/lib/utils"

describe("cn", () => {
  it("merges conditional classes and resolves Tailwind conflicts", () => {
    expect(cn("px-2 text-sm", false && "hidden", "px-4")).toBe(
      "text-sm px-4",
    )
  })
})

describe("generateSlug", () => {
  it("normalizes Vietnamese text and removes punctuation", () => {
    expect(generateSlug("Đánh giá Frieren's Animation!")).toBe(
      "danh-gia-frierens-animation",
    )
  })

  it("collapses repeated whitespace", () => {
    expect(generateSlug("Vinland  Saga   OST")).toBe("vinland-saga-ost")
  })
})

describe("formatDate", () => {
  it("formats dates using the Vietnamese locale", () => {
    expect(formatDate(new Date("2024-04-01T00:00:00Z"))).toContain("2024")
  })

  it("accepts date strings", () => {
    expect(() => formatDate("2024-04-01")).not.toThrow()
  })
})

describe("ensureUniqueSlug", () => {
  it("appends a counter until the slug is available", async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({ id: "post-1" })
      .mockResolvedValueOnce({ id: "post-2" })
      .mockResolvedValueOnce(null)
    const prisma = {
      post: { findUnique },
    } as unknown as PrismaClient

    await expect(ensureUniqueSlug("frieren", prisma)).resolves.toBe("frieren-2")
    expect(findUnique).toHaveBeenCalledTimes(3)
  })

  it("allows the excluded post to keep its slug", async () => {
    const prisma = {
      post: {
        findUnique: vi.fn().mockResolvedValue({ id: "post-1" }),
      },
    } as unknown as PrismaClient

    await expect(ensureUniqueSlug("frieren", prisma, "post-1")).resolves.toBe(
      "frieren",
    )
  })
})
