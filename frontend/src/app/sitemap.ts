import { MetadataRoute } from 'next'
import { newsApi } from '@/lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://news.xinxun.us'

  try {
    const newsResponse = await newsApi.getAll({ page: 1, limit: 1000 })
    const news = newsResponse.data

    const newsEntries = news.map((item) => ({
      url: `${baseUrl}/news/${item.slug}`,
      lastModified: new Date(item.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      ...newsEntries,
    ]
  } catch {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ]
  }
}

