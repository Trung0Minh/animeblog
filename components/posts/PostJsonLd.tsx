import { getAppName, getAppUrl } from "@/lib/seo"

export interface PostJsonLdProps {
  authorName: string
  coverUrl: string | null
  description: string | null
  publishedAt: Date | null
  slug: string
  title: string
  updatedAt: Date
}

interface ArticleJsonLd {
  "@context": "https://schema.org"
  "@type": "Article"
  author: {
    "@type": "Person"
    name: string
  }
  dateModified: string
  datePublished?: string
  description?: string
  headline: string
  image?: string
  mainEntityOfPage: {
    "@id": string
    "@type": "WebPage"
  }
  publisher: {
    "@type": "Organization"
    name: string
    url: string
  }
}

export function buildPostJsonLd({
  authorName,
  coverUrl,
  description,
  publishedAt,
  slug,
  title,
  updatedAt,
}: PostJsonLdProps): ArticleJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    author: {
      "@type": "Person",
      name: authorName,
    },
    dateModified: updatedAt.toISOString(),
    ...(publishedAt && { datePublished: publishedAt.toISOString() }),
    ...(description && { description }),
    headline: title,
    ...(coverUrl && { image: coverUrl }),
    mainEntityOfPage: {
      "@id": `${getAppUrl()}/${slug}`,
      "@type": "WebPage",
    },
    publisher: {
      "@type": "Organization",
      name: getAppName(),
      url: getAppUrl(),
    },
  }
}

function serializeJsonLd(value: ArticleJsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export function PostJsonLd(props: PostJsonLdProps) {
  return (
    <script type="application/ld+json">
      {serializeJsonLd(buildPostJsonLd(props))}
    </script>
  )
}
