import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function readPngDimensions(buffer: Buffer) {
  return {
    height: buffer.readUInt32BE(20),
    width: buffer.readUInt32BE(16),
  }
}

describe("fallback Open Graph image", () => {
  it("exists as a 1200x630 PNG", () => {
    const image = readFileSync(join(process.cwd(), "public/og-default.png"))

    expect(image.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
    expect(readPngDimensions(image)).toEqual({ height: 630, width: 1200 })
  })
})
