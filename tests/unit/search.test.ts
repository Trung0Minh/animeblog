import { describe, expect, it } from "vitest"

import { buildSearchQuery, sanitizeSearchSnippet } from "@/lib/search"

describe("buildSearchQuery", () => {
  it("joins terms with AND and applies prefix matching to the final token", () => {
    expect(buildSearchQuery("ufotable animation")).toBe(
      "ufotable & animation:*",
    )
  })

  it("removes tsquery syntax and punctuation from user input", () => {
    expect(buildSearchQuery("frieren!! | (memory):*")).toBe(
      "frieren & memory:*",
    )
  })

  it("returns an empty string when no searchable tokens remain", () => {
    expect(buildSearchQuery("!!! &&&")).toBe("")
  })
})

describe("sanitizeSearchSnippet", () => {
  it("preserves mark tags while escaping other HTML", () => {
    expect(
      sanitizeSearchSnippet("<mark>Frieren</mark> <script>alert(1)</script>"),
    ).toBe("<mark>Frieren</mark> &lt;script&gt;alert(1)&lt;/script&gt;")
  })
})
