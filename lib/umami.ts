type UmamiConfig =
  | UmamiCloudConfig
  | UmamiSelfHostedConfig

interface UmamiCloudConfig {
  apiUrl: string
  apiKey: string
  mode: "cloud"
  websiteId: string
}

interface UmamiSelfHostedConfig {
  apiUrl: string
  mode: "self-hosted"
  password: string
  username: string
  websiteId: string
}

export interface UmamiMetric {
  prev: number
  value: number
}

export interface UmamiStats {
  bounces: UmamiMetric
  pageviews: UmamiMetric
  totalTime: UmamiMetric
  visitors: UmamiMetric
  visits: UmamiMetric
}

export interface UmamiTopPage {
  x: string
  y: number
}

interface RawUmamiStats {
  bounces?: unknown
  comparison?: {
    bounces?: unknown
    pageviews?: unknown
    totaltime?: unknown
    visitors?: unknown
    visits?: unknown
  }
  pageviews?: unknown
  totaltime?: unknown
  visitors?: unknown
  visits?: unknown
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function normalizeApiUrl(apiUrl: string) {
  return apiUrl.replace(/\/+$/, "")
}

function getUmamiConfig(): UmamiConfig {
  const apiKey = process.env.UMAMI_API_KEY
  const websiteId =
    process.env.UMAMI_WEBSITE_ID ?? process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

  if (!websiteId) {
    throw new Error("Umami is not configured")
  }

  if (apiKey) {
    return {
      apiKey,
      apiUrl: normalizeApiUrl(
        process.env.UMAMI_API_URL ||
          process.env.UMAMI_API_CLIENT_ENDPOINT ||
          "https://api.umami.is/v1",
      ),
      mode: "cloud",
      websiteId,
    }
  }

  const apiUrl = process.env.UMAMI_API_URL
  const username = process.env.UMAMI_USERNAME
  const password = process.env.UMAMI_PASSWORD

  if (!apiUrl || !username || !password) {
    throw new Error("Umami is not configured")
  }

  return {
    apiUrl: normalizeApiUrl(apiUrl),
    mode: "self-hosted",
    password,
    username,
    websiteId,
  }
}

function getTokenFromResponse(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "token" in value &&
    typeof value.token === "string"
  ) {
    return value.token
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "token" in value.data &&
    typeof value.data.token === "string"
  ) {
    return value.data.token
  }

  throw new Error("Umami auth response did not include a token")
}

async function getUmamiToken(config: UmamiSelfHostedConfig): Promise<string> {
  const response = await fetch(`${config.apiUrl}/api/auth/login`, {
    body: JSON.stringify({
      password: config.password,
      username: config.username,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error("Umami auth failed")
  }

  return getTokenFromResponse(await response.json())
}

async function getAuthHeaders(config: UmamiConfig): Promise<HeadersInit> {
  if (config.mode === "cloud") {
    return {
      Accept: "application/json",
      "x-umami-api-key": config.apiKey,
    }
  }

  const token = await getUmamiToken(config)
  return { Authorization: `Bearer ${token}` }
}

function getEndpoint(config: UmamiConfig, path: string) {
  if (config.mode === "cloud") {
    return `${config.apiUrl}${path}`
  }

  return `${config.apiUrl}/api${path}`
}

function normalizeStats(stats: RawUmamiStats): UmamiStats {
  const comparison = stats.comparison ?? {}

  return {
    bounces: {
      prev: getNumber(comparison.bounces),
      value: getNumber(stats.bounces),
    },
    pageviews: {
      prev: getNumber(comparison.pageviews),
      value: getNumber(stats.pageviews),
    },
    totalTime: {
      prev: getNumber(comparison.totaltime),
      value: getNumber(stats.totaltime),
    },
    visitors: {
      prev: getNumber(comparison.visitors),
      value: getNumber(stats.visitors),
    },
    visits: {
      prev: getNumber(comparison.visits),
      value: getNumber(stats.visits),
    },
  }
}

function normalizeTopPages(value: unknown): UmamiTopPage[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((page): UmamiTopPage[] => {
    if (
      typeof page === "object" &&
      page !== null &&
      "x" in page &&
      "y" in page &&
      typeof page.x === "string" &&
      typeof page.y === "number"
    ) {
      return [{ x: page.x, y: page.y }]
    }

    return []
  })
}

export async function getUmamiStats(
  startAt: number,
  endAt: number,
): Promise<UmamiStats> {
  const config = getUmamiConfig()
  const headers = await getAuthHeaders(config)
  const params = new URLSearchParams({
    endAt: String(endAt),
    startAt: String(startAt),
  })

  const response = await fetch(
    `${getEndpoint(config, `/websites/${config.websiteId}/stats`)}?${params}`,
    {
      headers,
      next: { revalidate: 300 },
    },
  )

  if (!response.ok) {
    throw new Error("Failed to fetch Umami stats")
  }

  return normalizeStats((await response.json()) as RawUmamiStats)
}

export async function getUmamiTopPages(
  startAt: number,
  endAt: number,
  limit = 10,
): Promise<UmamiTopPage[]> {
  const config = getUmamiConfig()
  const headers = await getAuthHeaders(config)
  const params = new URLSearchParams({
    endAt: String(endAt),
    limit: String(limit),
    startAt: String(startAt),
    type: "path",
  })

  const response = await fetch(
    `${getEndpoint(config, `/websites/${config.websiteId}/metrics`)}?${params}`,
    {
      headers,
      next: { revalidate: 300 },
    },
  )

  if (!response.ok) {
    throw new Error("Failed to fetch Umami top pages")
  }

  return normalizeTopPages(await response.json())
}

export async function getPostViewCount(slug: string): Promise<number> {
  try {
    const pages = await getUmamiTopPages(0, Date.now(), 1000)
    return pages.find((page) => page.x === `/${slug}`)?.y ?? 0
  } catch {
    return 0
  }
}
