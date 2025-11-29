import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { newsApi } from '@/lib/api'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import { FiClock, FiEye } from 'react-icons/fi'
import Link from 'next/link'
import NewsCard from '@/components/NewsCard'
import ShareButton from '@/components/ShareButton'

interface NewsDetailPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({
  params,
}: NewsDetailPageProps): Promise<Metadata> {
  try {
    const { data: news } = await newsApi.getBySlug(params.slug)

    return {
      title: `${news.title} | Xinxun News`,
      description: news.excerpt || news.content.replace(/<[^>]*>/g, '').slice(0, 160),
      openGraph: {
        title: news.title,
        description: news.excerpt || news.content.replace(/<[^>]*>/g, '').slice(0, 160),
        images: [news.thumbnail],
        type: 'article',
        publishedTime: news.published_at || undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: news.title,
        description: news.excerpt || news.content.replace(/<[^>]*>/g, '').slice(0, 160),
        images: [news.thumbnail],
      },
    }
  } catch {
    return {
      title: 'Artikel Tidak Ditemukan | Xinxun News',
    }
  }
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  let news
  try {
    const response = await newsApi.getBySlug(params.slug)
    news = response.data
  } catch {
    notFound()
  }

  // Get related news
  const relatedNewsResponse = await newsApi.getAll({
    page: 1,
    limit: 3,
    category: news.category.slug,
  })
  const relatedNews = relatedNewsResponse.data.filter((n) => n.id !== news.id).slice(0, 3)

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: news.title,
    image: news.thumbnail,
    datePublished: news.published_at,
    dateModified: news.updated_at,
    author: {
      '@type': 'Person',
      name: news.author.username,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Xinxun News',
      logo: {
        '@type': 'ImageObject',
        url: 'https://news.xinxun.us/logo.png',
      },
    },
    description: news.excerpt,
    articleBody: news.content.replace(/<[^>]*>/g, ''),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-[#fe7d17]">
            Beranda
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/?category=${news.category.slug}`}
            className="hover:text-[#fe7d17]"
          >
            {news.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{news.title}</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <span className="inline-block px-3 py-1 bg-[#fe7d17] text-white rounded-full text-sm font-semibold mb-4">
              {news.category.name}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {news.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <span className="flex items-center space-x-1">
                <FiClock className="w-4 h-4" />
                <span>{formatDate(news.published_at)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <FiEye className="w-4 h-4" />
                <span>{news.views} views</span>
              </span>
              <span>Oleh {news.author.name || news.author.username}</span>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Bagikan:</span>
              <ShareButton
                title={news.title}
                text={news.excerpt}
                url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://news.xinxun.us'}/news/${news.slug}`}
              />
            </div>
          </header>

          {/* Featured Image */}
          {news.thumbnail ? (
            <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={news.thumbnail}
                alt={news.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="h-64 md:h-96 mb-8 rounded-lg bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />

          {/* Tags */}
          {news.tags && news.tags.length > 0 && (
            <div className="mb-12">
              <h3 className="text-lg font-semibold mb-4">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {news.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related News */}
          {relatedNews.length > 0 && (
            <div className="mt-16 border-t border-gray-200 pt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Berita Terkait</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedNews.map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  )
}

