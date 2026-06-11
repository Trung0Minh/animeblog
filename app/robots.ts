import type { MetadataRoute } from "next"

import { getAppUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        allow: "/",
        disallow: ["/dashboard/", "/admin/", "/api/", "/invite/"],
        userAgent: "*",
      },
    ],
    sitemap: `${getAppUrl()}/sitemap.xml`,
  }
}
