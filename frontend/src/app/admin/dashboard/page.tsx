'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { newsApi, adminApi } from '@/lib/api'
import type { News } from '@/types'
import { FiEdit, FiTrash2, FiTrendingUp, FiFileText, FiClock, FiEye, FiUsers, FiEye as FiPreview } from 'react-icons/fi'
import { useState } from 'react'
import NewsPreviewModal from '@/components/NewsPreviewModal'
import toast from 'react-hot-toast'

interface Statistics {
  total_published: number
  total_pending: number
  total_draft: number
  total_rejected: number
  total_views: number
  total_publishers: number
  top_news: News[]
}

export default function AdminDashboard() {
  const [news, setNews] = useState<News[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewNews, setPreviewNews] = useState<News | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const [newsResponse, statsResponse] = await Promise.all([
        adminApi.getAllNews({ page: 1, limit: 50 }),
        adminApi.getStatistics(),
      ])
      setNews(newsResponse.data)
      setStatistics(statsResponse.data)
    } catch (error: any) {
      console.error('Error loading data:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        router.push('/admin/login')
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('timeout')) {
        toast.error('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.')
      } else {
        toast.error(error.response?.data?.error || error.message || 'Gagal memuat data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return

    try {
      await adminApi.deleteNews(id)
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
    <div className="container mx-auto px-6 py-8 max-w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Admin</h1>
        <p className="text-gray-600">Kelola artikel, kategori, dan publisher</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Published</p>
                      <p className="text-3xl font-bold text-gray-900">{statistics.total_published}</p>
                    </div>
                    <FiFileText className="w-12 h-12 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                      <p className="text-3xl font-bold text-gray-900">{statistics.total_pending}</p>
                    </div>
                    <FiClock className="w-12 h-12 text-yellow-500" />
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
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Publishers</p>
                      <p className="text-3xl font-bold text-gray-900">{statistics.total_publishers}</p>
                    </div>
                    <FiUsers className="w-12 h-12 text-purple-500" />
                  </div>
                </div>
        </div>
      )}

      {/* Top News Section */}
      {statistics && statistics.top_news.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <FiTrendingUp className="w-6 h-6 text-[#fe7d17]" />
                  <h2 className="text-xl font-semibold text-gray-900">Top 5 Artikel Terpopuler</h2>
                </div>
                <div className="space-y-3">
                  {statistics.top_news.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4 flex-1">
                        <span className="text-2xl font-bold text-[#fe7d17] w-8">{index + 1}</span>
                        <div className="flex-1">
                          <Link href={`/news/${item.slug}`} className="text-sm font-medium text-gray-900 hover:text-[#fe7d17]">
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
          <h2 className="text-xl font-semibold text-white">Daftar Artikel</h2>
        </div>
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
                  Author
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.author?.name || item.author?.username || '-'}
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
                        href={`/admin/news/${item.id}/edit`}
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
