'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { formatDate } from '@/lib/utils'
import type { News } from '@/types'
import { newsApi } from '@/lib/api'

export default function FeaturedSlider() {
  const [news, setNews] = useState<News[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFeaturedNews()
  }, [])

  const loadFeaturedNews = async () => {
    try {
      const response = await newsApi.getFeatured(5)
      setNews(response.data)
      setError(null)
    } catch (error) {
      console.error('Failed to load featured news:', error)
      setError('Gagal memuat berita unggulan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (news.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length)
      }, 5000) // Auto slide every 5 seconds
      return () => clearInterval(interval)
    }
  }, [news.length])

  if (loading) {
    return (
      <div className="relative mb-12 h-64 md:h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Memuat berita unggulan...</p>
      </div>
    )
  }

  if (error || news.length === 0) {
    return null // Silently hide slider if error or no news
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + news.length) % news.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % news.length)
  }

  return (
    <div className="relative mb-12">
      <div className="relative h-64 md:h-96 overflow-hidden rounded-lg">
        {news.map((item, index) => (
          <Link
            key={item.id}
            href={`/${item.slug}`}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="relative h-full">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  className="object-cover"
                  priority={index === currentIndex}
                />
              ) : (
                <div className="w-full h-full bg-gray-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                <span className="inline-block px-3 py-1 bg-[#fe7d17] rounded-full text-sm font-semibold mb-3">
                  {item.category?.name}
                </span>
                <h2 className="text-2xl md:text-4xl font-bold mb-3 line-clamp-2">
                  {item.title}
                </h2>
                <p className="text-gray-200 mb-4 line-clamp-2 hidden md:block">
                  {item.excerpt || item.content.replace(/<[^>]*>/g, '').slice(0, 150)}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <span>{formatDate(item.published_at)}</span>
                  <span>•</span>
                  <span>{item.views} views</span>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Navigation Arrows */}
        {news.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault()
                goToPrevious()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Previous"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                goToNext()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Next"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {news.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
            {news.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault()
                  goToSlide(index)
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-[#fe7d17]'
                    : 'w-2 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

