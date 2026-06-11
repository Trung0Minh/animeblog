export interface SearchResult {
  authorAvatarUrl: string | null
  authorName: string
  authorUsername: string
  coverUrl: string | null
  excerpt: string | null
  id: string
  publishedAt: Date | string
  rank: number
  slug: string
  snippet: string | null
  title: string
}

export function buildSearchQuery(raw: string): string {
  const tokens = raw
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}_]+/gu, "").trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    return ""
  }

  return tokens
    .map((token, index) =>
      index === tokens.length - 1 ? `${token}:*` : token,
    )
    .join(" & ")
}

export function sanitizeSearchSnippet(snippet: string | null): string {
  if (!snippet) {
    return ""
  }

  return snippet
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/&#39;/g, "'")
    .replace(/&lt;mark&gt;/g, "<mark>")
    .replace(/&lt;\/mark&gt;/g, "</mark>")
}
