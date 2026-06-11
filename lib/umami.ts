interface UmamiConfig {
  apiUrl: string
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
  const apiUrl = process.env.UMAMI_API_URL
  const username = process.env.UMAMI_USERNAME
  const password = process.env.UMAMI_PASSWORD
  const websiteId =
    process.env.UMAMI_WEBSITE_ID ?? process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

  if (!apiUrl || !username || !password || !websiteId) {
    throw new Error("Umami is not configured")
  }

  return {
    apiUrl: normalizeApiUrl(apiUrl),
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

async function getUmamiToken(config: UmamiConfig): Promise<string> {
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
  const token = await getUmamiToken(config)
  const params = new URLSearchParams({
    endAt: String(endAt),
    startAt: String(startAt),
  })

  const response = await fetch(
    `${config.apiUrl}/api/websites/${config.websiteId}/stats?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
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
  const token = await getUmamiToken(config)
  const params = new URLSearchParams({
    endAt: String(endAt),
    limit: String(limit),
    startAt: String(startAt),
    type: "path",
  })

  const response = await fetch(
    `${config.apiUrl}/api/websites/${config.websiteId}/metrics?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
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
