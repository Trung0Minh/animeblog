import { z, ZodError } from "zod"

import { prisma } from "@/lib/prisma"
import { buildSearchQuery, type SearchResult } from "@/lib/search"

const searchSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().max(200).optional().default(""),
})

function emptySearchPayload(page = 1, limit = 10) {
  return {
    pagination: { limit, page, total: 0, totalPages: 0 },
    query: "",
    results: [] as SearchResult[],
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { limit, page, q } = searchSchema.parse(
      Object.fromEntries(searchParams),
    )
    const query = q.trim()
    const tsQuery = buildSearchQuery(query)

    if (!query || !tsQuery) {
      return Response.json({ data: emptySearchPayload(page, limit) })
    }

    const offset = (page - 1) * limit
    const [results, countResult] = await Promise.all([
      prisma.$queryRaw<SearchResult[]>`
        SELECT
          p.id,
          p.title,
          p.slug,
          p.excerpt,
          p."coverUrl",
          p."publishedAt",
          u.name AS "authorName",
          u.username AS "authorUsername",
          u."avatarUrl" AS "authorAvatarUrl",
          ts_rank(p.search_vector, to_tsquery('simple', ${tsQuery})) AS rank,
          ts_headline(
            'simple',
            COALESCE(p."contentText", ''),
            to_tsquery('simple', ${tsQuery}),
            'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>, HighlightAll=false'
          ) AS snippet
        FROM posts p
        JOIN users u ON u.id = p."authorId"
        WHERE
          p.status = 'PUBLISHED'
          AND p.search_vector @@ to_tsquery('simple', ${tsQuery})
        ORDER BY rank DESC, p."publishedAt" DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM posts p
        WHERE
          p.status = 'PUBLISHED'
          AND p.search_vector @@ to_tsquery('simple', ${tsQuery})
      `,
    ])
    const total = Number(countResult[0]?.count ?? 0)

    return Response.json({
      data: {
        pagination: {
          limit,
          page,
          total,
          totalPages: Math.ceil(total / limit),
        },
        query,
        results,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ data: emptySearchPayload() })
    }

    console.error("[GET /api/search]", error)
    return Response.json({ error: "Search failed" }, { status: 500 })
  }
}
