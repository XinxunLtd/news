'use client'

import { Fragment } from 'react'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import { FiX, FiClock, FiEye } from 'react-icons/fi'
import type { Category, User, Tag } from '@/types'

interface NewsPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  news: {
    title: string
    content: string
    excerpt: string
    thumbnail: string
    category: Category
    author?: User
    tags?: Tag[]
    created_at?: string
    views?: number
  }
}

export default function NewsPreviewModal({ isOpen, onClose, news }: NewsPreviewModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-bold text-gray-900">Preview Artikel</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content - 1:1 dengan halaman detail */}
          <article className="px-6 py-8">
            {/* Header */}
            <header className="mb-8">
              <span className="inline-block px-3 py-1 bg-[#fe7d17] text-white rounded-full text-sm font-semibold mb-4">
                {news.category.name}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {news.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                {news.created_at && (
                  <span className="flex items-center space-x-1">
                    <FiClock className="w-4 h-4" />
                    <span>{formatDate(news.created_at)}</span>
                  </span>
                )}
                {news.views !== undefined && (
                  <span className="flex items-center space-x-1">
                    <FiEye className="w-4 h-4" />
                    <span>{news.views} views</span>
                  </span>
                )}
                {news.author && (
                  <span>Oleh {news.author.name || news.author.username}</span>
                )}
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
          </article>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#fe7d17] text-white rounded-lg hover:bg-[#e66d0f] transition-colors"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

