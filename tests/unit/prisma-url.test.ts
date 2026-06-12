import { describe, expect, it } from "vitest"

import { getPrismaRuntimeDatabaseUrl } from "@/lib/prismaUrl"

describe("getPrismaRuntimeDatabaseUrl", () => {
  const pooledUrl =
    "postgresql://user:pass@example.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

  it("widens the local development pool when Supabase sets connection_limit=1", () => {
    expect(getPrismaRuntimeDatabaseUrl(pooledUrl, "development")).toBe(
      "postgresql://user:pass@example.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5",
    )
  })

  it("keeps production URLs unchanged", () => {
    expect(getPrismaRuntimeDatabaseUrl(pooledUrl, "production")).toBe(
      pooledUrl,
    )
  })

  it("leaves URLs without the one-connection limit unchanged", () => {
    const url =
      "postgresql://user:pass@example.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"

    expect(getPrismaRuntimeDatabaseUrl(url, "development")).toBe(url)
  })
})
