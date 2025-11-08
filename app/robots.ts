import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const env = process.env.NEXT_PUBLIC_SITE_ENV || process.env.NODE_ENV || 'development'
  const disallowIndexing = env !== 'production'

  return {
    rules: disallowIndexing
      ? [
          {
            userAgent: '*',
            disallow: '/',
          },
        ]
      : [
          {
            userAgent: '*',
            allow: '/',
          },
        ],
    sitemap: [`${appUrl}/sitemap.xml`],
  }
}
