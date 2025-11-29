'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'
import type { News } from '@/types'
import { FiCheck, FiX, FiEye } from 'react-icons/fi'

export default function PendingNewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    loadPendingNews()
  }, [router])

  const loadPendingNews = async () => {
    try {
      const response = await adminApi.getPendingNews()
      setNews(response.data)
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


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Memuat...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="text-[#fe7d17] hover:text-[#e66d0f] mb-4 inline-block"
          >
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pending Artikel Baru</h1>
          <p className="text-gray-600 mt-2">Review dan approve/reject artikel baru dari publisher</p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {news.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Tidak ada artikel pending</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {news.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#fe7d17]/10 text-[#fe7d17]">
                          {item.category.name}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {item.status}
                        </span>
                        <span className="text-sm text-gray-600">
                          Oleh: {item.author?.name || item.author?.username || '-'}
                        </span>
                      </div>
                      {item.excerpt && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.excerpt}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                        <span>•</span>
                        <span>{item.views} views</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Link
                        href={`/admin/news/pending/${item.id}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
                      >
                        <FiEye />
                        <span>Review</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  )
}

