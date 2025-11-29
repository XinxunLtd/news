import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://news.xinxun.us'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/v1/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

