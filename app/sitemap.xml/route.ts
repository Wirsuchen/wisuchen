import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const urls = ['/', '/jobs', '/deals', '/blog', '/pricing', '/about', '/support']
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `<url>
  <loc>${baseUrl}${u}</loc>
  <changefreq>daily</changefreq>
  <priority>0.7</priority>
</url>`
  )
  .join('\n')}
</urlset>`
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } })
}








