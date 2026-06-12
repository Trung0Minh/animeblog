const DEVELOPMENT_CONNECTION_LIMIT = "5"

export function getPrismaRuntimeDatabaseUrl(
  databaseUrl = process.env.DATABASE_URL,
  nodeEnv = process.env.NODE_ENV,
) {
  if (!databaseUrl || nodeEnv !== "development") {
    return databaseUrl
  }

  try {
    const url = new URL(databaseUrl)

    if (url.searchParams.get("connection_limit") === "1") {
      url.searchParams.set("connection_limit", DEVELOPMENT_CONNECTION_LIMIT)
      return url.toString()
    }
  } catch {
    return databaseUrl
  }

  return databaseUrl
}
