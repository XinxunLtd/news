'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminTagApi } from '@/lib/api'
import type { Tag } from '@/types'
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({ name: '' })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    loadTags()
  }, [router])

  const loadTags = async () => {
    try {
      const response = await adminTagApi.getAll()
      setTags(response.data)
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      } else {
        toast.error('Gagal memuat tags')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTag) {
        await adminTagApi.update(editingTag.id, formData)
        toast.success('Tag berhasil diperbarui')
      } else {
        await adminTagApi.create(formData)
        toast.success('Tag berhasil dibuat')
      }
      setShowModal(false)
      setEditingTag(null)
      setFormData({ name: '' })
      loadTags()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan tag')
    }
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({ name: tag.name })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tag ini?')) return

    try {
      await adminTagApi.delete(id)
      toast.success('Tag berhasil dihapus')
      loadTags()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus tag')
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Kelola Tags</h1>
        <p className="text-gray-600">Tambah, edit, dan hapus tags berita</p>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setEditingTag(null)
            setFormData({ name: '' })
            setShowModal(true)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus className="w-5 h-5" />
          <span>Tambah Tag</span>
        </button>
      </div>

      {/* Tags List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-[#fe7d17] to-[#e66d0f]">
          <h2 className="text-xl font-semibold text-white">Daftar Tags</h2>
        </div>
        {tags.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Belum ada tags. Tambah tag pertama Anda!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tag.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{tag.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(tag)}
                          className="text-[#fe7d17] hover:text-[#e66d0f]"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          className="text-red-600 hover:text-red-800"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingTag ? 'Edit Tag' : 'Tambah Tag'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Tag *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                  className="input-field w-full"
                  placeholder="Contoh: Teknologi, Investasi, dll"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTag(null)
                    setFormData({ name: '' })
                  }}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingTag ? 'Simpan Perubahan' : 'Tambah Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

