'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'
import type { News } from '@/types'
import { FiCheck, FiX, FiEye } from 'react-icons/fi'
import RewardModal from '@/components/RewardModal'

export default function PendingRevisionsPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<number | null>(null)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    loadPendingRevisions()
  }, [router])

  const loadPendingRevisions = async () => {
    try {
      const response = await adminApi.getPendingRevisions()
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

  const handleApprove = (id: number) => {
    setSelectedNewsId(id)
    // For revisions, no reward needed
    handleConfirmApprove(0)
  }

  const handleConfirmApprove = async (rewardAmount: number) => {
    if (!selectedNewsId) return

    setApprovingId(selectedNewsId)
    try {
      await adminApi.approveNews(selectedNewsId, rewardAmount)
      toast.success('Edit artikel berhasil disetujui')
      loadPendingRevisions()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyetujui artikel')
    } finally {
      setApprovingId(null)
      setShowRewardModal(false)
      setSelectedNewsId(null)
    }
  }

  const handleReject = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menolak edit artikel ini?')) return

    try {
      await adminApi.rejectNews(id)
      toast.success('Edit artikel ditolak')
      loadPendingRevisions()
    } catch (error: any) {
      toast.error('Gagal menolak artikel')
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
        <h1 className="text-3xl font-bold text-gray-900">Pending Edit Artikel</h1>
        <p className="text-gray-600 mt-2">Review dan approve/reject edit artikel dari publisher</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Tidak ada edit artikel pending</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {news.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Edit Artikel
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#fe7d17]/10 text-[#fe7d17]">
                        {item.category.name}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
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
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={approvingId === item.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      <FiCheck />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <FiX />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RewardModal
        isOpen={showRewardModal}
        onClose={() => {
          setShowRewardModal(false)
          setSelectedNewsId(null)
        }}
        onConfirm={handleConfirmApprove}
        loading={approvingId !== null}
      />
    </div>
  )
}

