import Link from 'next/link'
import Image from 'next/image'
import { formatDate, truncateText } from '@/lib/utils'
import type { News } from '@/types'
import { FiClock, FiEye } from 'react-icons/fi'

interface NewsCardProps {
  news: News
  featured?: boolean
}

export default function NewsCard({ news, featured = false }: NewsCardProps) {
  if (featured) {
    return (
      <Link href={`/${news.slug}`} className="block">
        <article className="card group">
          <div className="relative h-64 md:h-96 overflow-hidden">
            {news.thumbnail ? (
              <Image
                src={news.thumbnail}
                alt={news.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <span className="inline-block px-3 py-1 bg-[#fe7d17] rounded-full text-sm font-semibold mb-2">
                {news.category.name}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 line-clamp-2">
                {news.title}
              </h2>
              <p className="text-gray-200 line-clamp-2 mb-3">
                {truncateText(news.excerpt || news.content.replace(/<[^>]*>/g, ''), 150)}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <span className="flex items-center space-x-1">
                  <FiClock className="w-4 h-4" />
                  <span>{formatDate(news.published_at)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FiEye className="w-4 h-4" />
                  <span>{news.views} views</span>
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/news/${news.slug}`} className="block">
      <article className="card group h-full">
        <div className="relative h-48 overflow-hidden">
          {news.thumbnail ? (
            <Image
              src={news.thumbnail}
              alt={news.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <span className="inline-block px-2 py-1 bg-[#fe7d17]/10 text-[#fe7d17] rounded text-xs font-semibold mb-2">
            {news.category.name}
          </span>
          <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-[#fe7d17] transition-colors">
            {news.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {truncateText(news.excerpt || news.content.replace(/<[^>]*>/g, ''), 100)}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatDate(news.published_at)}</span>
            <span className="flex items-center space-x-1">
              <FiEye className="w-3 h-3" />
              <span>{news.views}</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

