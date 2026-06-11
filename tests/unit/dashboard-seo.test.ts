import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { metadata } from "@/app/(writer)/dashboard/layout"

describe("dashboard metadata", () => {
  it("prevents indexing writer dashboard routes", () => {
    expect(metadata).toMatchObject({
      robots: { follow: false, index: false },
    })
  })
})
