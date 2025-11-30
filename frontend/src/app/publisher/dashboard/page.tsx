'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { newsApi, publisherApi } from '@/lib/api'
import type { News } from '@/types'
import { FiEdit, FiTrash2, FiTrendingUp, FiFileText, FiClock, FiEye, FiX, FiEye as FiPreview } from 'react-icons/fi'
import NewsPreviewModal from '@/components/NewsPreviewModal'
import toast from 'react-hot-toast'

interface PublisherStatistics {
  total_published: number
  total_pending: number
  total_draft: number
  total_rejected: number
  total_views: number
  top_news: News[]
}

export default function PublisherDashboard() {
  const [news, setNews] = useState<News[]>([])
  const [statistics, setStatistics] = useState<PublisherStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewNews, setPreviewNews] = useState<News | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('publisher_token')
    if (!token) {
      router.push('/publisher/login')
      return
    }

    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const [response, statsResponse] = await Promise.all([
        newsApi.getAll({ page: 1, limit: 50 }),
        publisherApi.getStatistics(),
      ])
      // Filter hanya news yang dibuat oleh publisher ini
      const user = JSON.parse(localStorage.getItem('publisher_user') || '{}')
      const myNews = response.data.filter((item) => item.author_id === user.id)
      setNews(myNews)
      setStatistics(statsResponse.data)
    } catch (error: any) {
      console.error('Error loading data:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('publisher_token')
        localStorage.removeItem('publisher_user')
        router.push('/publisher/login')
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('timeout')) {
        toast.error('Tidak dapat terhubung ke server. Mohon tunggu beberapa saat dan coba lagi.')
      } else {
        toast.error(error.response?.data?.error || error.message || 'Gagal memuat data. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return

    try {
      await publisherApi.updateNews(id, { status: 'draft' }) // Soft delete
      toast.success('Artikel berhasil dihapus')
      loadData()
    } catch (error: any) {
      toast.error('Gagal menghapus artikel')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Memuat...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Dashboard Publisher</h1>
        <p className="text-gray-600 text-sm md:text-base">Kelola artikel Anda dan pantau performa</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Published</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.total_published}</p>
              </div>
              <FiFileText className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.total_pending}</p>
              </div>
              <FiClock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.total_rejected}</p>
              </div>
              <FiX className="w-12 h-12 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Views</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.total_views.toLocaleString('id-ID')}</p>
              </div>
              <FiEye className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Top News Section */}
      {statistics && statistics.top_news.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <FiTrendingUp className="w-6 h-6 text-[#fe7d17]" />
            <h2 className="text-xl font-semibold text-gray-900">Top 5 Artikel Terpopuler Saya</h2>
          </div>
          <div className="space-y-3">
            {statistics.top_news.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4 flex-1">
                  <span className="text-2xl font-bold text-[#fe7d17] w-8">{index + 1}</span>
                  <div className="flex-1">
                    <Link href={`/${item.slug}`} className="text-sm font-medium text-gray-900 hover:text-[#fe7d17]">
                      {item.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.category.name} • {item.views.toLocaleString('id-ID')} views
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-[#fe7d17] to-[#e66d0f]">
          <h2 className="text-xl font-semibold text-white">Artikel Saya</h2>
        </div>
        {news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Belum ada artikel. Buat artikel pertama Anda!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Judul
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {news.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#fe7d17]/10 text-[#fe7d17]">
                      {item.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : item.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setPreviewNews(item)
                          setShowPreview(true)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Preview"
                      >
                        <FiPreview className="w-5 h-5" />
                      </button>
                      <Link
                        href={`/publisher/news/${item.id}/edit`}
                        className="text-[#fe7d17] hover:text-[#e66d0f]"
                        title="Edit"
                      >
                        <FiEdit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && previewNews && (
        <NewsPreviewModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false)
            setPreviewNews(null)
          }}
          news={previewNews}
        />
      )}
    </div>
  )
}

