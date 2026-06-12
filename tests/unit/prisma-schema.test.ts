import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("Prisma Auth.js adapter schema", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8")
  const userModel = schema.match(/model User \{[\s\S]*?\n\}/)?.[0] ?? ""

  it("includes the standard nullable fields Auth.js writes during email sign-in", () => {
    expect(userModel).toContain("emailVerified DateTime?")
    expect(userModel).toContain("image         String?")
  })
})
