'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'
import type { News } from '@/types'
import { FiCheck, FiX, FiArrowLeft } from 'react-icons/fi'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import RewardModal from '@/components/RewardModal'
import NewsPreviewModal from '@/components/NewsPreviewModal'

export default function PendingNewsDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [news, setNews] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    loadNews()
  }, [router, params])

  const loadNews = async () => {
    try {
      const response = await adminApi.getAllNews({ page: 1, limit: 1000 })
      const foundNews = response.data.find((n) => n.id === parseInt(params.id as string))
      if (!foundNews || foundNews.status !== 'pending') {
        toast.error('Artikel tidak ditemukan atau bukan pending')
        router.push('/admin/news/pending')
        return
      }
      setNews(foundNews)
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      } else {
        toast.error('Gagal memuat data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (amount: number) => {
    if (!news) return

    setProcessing(true)
    try {
      await adminApi.approveNews(news.id, amount)
      toast.success('Artikel berhasil di-approve!')
      setShowRewardModal(false)
      router.push('/admin/news/pending')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal approve artikel')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!news) return

    if (!confirm('Apakah Anda yakin ingin menolak artikel ini?')) return

    setProcessing(true)
    try {
      await adminApi.rejectNews(news.id)
      toast.success('Artikel ditolak')
      router.push('/admin/news/pending')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal reject artikel')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Memuat...</p>
      </div>
    )
  }

  if (!news) {
    return null
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/news/pending"
              className="text-[#fe7d17] hover:text-[#e66d0f] mb-4 inline-flex items-center space-x-2"
            >
              <FiArrowLeft />
              <span>Kembali ke Pending News</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Review Artikel</h1>
            <p className="text-gray-600 mt-2">Review detail artikel sebelum approve/reject</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Article Content - 1:1 dengan published view */}
            <article className="px-8 py-8">
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
                    <span>{formatDate(news.created_at)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>{news.views} views</span>
                  </span>
                  <span>Oleh {news.author?.name || news.author?.username || '-'}</span>
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

              {/* Excerpt */}
              {news.excerpt && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 italic">{news.excerpt}</p>
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

            {/* Action Buttons */}
            <div className="bg-gray-50 border-t border-gray-200 px-8 py-6 flex justify-between items-center">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPreview(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Preview
                </button>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <FiX />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => setShowRewardModal(true)}
                  disabled={processing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <FiCheck />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Modal */}
      <RewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        onConfirm={handleApprove}
        newsTitle={news.title}
      />

      {/* Preview Modal */}
      <NewsPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        news={news}
      />
    </>
  )
}

