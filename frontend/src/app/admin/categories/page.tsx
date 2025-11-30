'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminCategoryApi } from '@/lib/api'
import type { Category } from '@/types'
import { FiEdit, FiTrash2, FiPlus, FiLock } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', is_admin_only: false, order: 0 })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    loadCategories()
  }, [router])

  const loadCategories = async () => {
    try {
      const response = await adminCategoryApi.getAll()
      setCategories(response.data)
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      } else {
        toast.error('Gagal memuat kategori. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await adminCategoryApi.update(editingCategory.id, formData)
        toast.success('Kategori berhasil diperbarui')
      } else {
        await adminCategoryApi.create(formData)
        toast.success('Kategori berhasil dibuat')
      }
      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', is_admin_only: false, order: 0 })
      loadCategories()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan kategori. Silakan coba lagi.')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({ 
      name: category.name, 
      is_admin_only: category.is_admin_only || false,
      order: category.order || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return

    try {
      await adminCategoryApi.delete(id)
      toast.success('Kategori berhasil dihapus')
      loadCategories()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus kategori. Silakan coba lagi.')
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Kelola Kategori</h1>
            <p className="text-gray-600">Tambah, edit, dan hapus kategori berita</p>
          </div>

        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setEditingCategory(null)
              setFormData({ name: '', is_admin_only: false, order: 0 })
              setShowModal(true)
            }}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <FiPlus />
            <span>Tambah Kategori</span>
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-semibold text-[#fe7d17] bg-[#fe7d17]/10 px-2 py-1 rounded">
                      #{category.order || index + 1}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500">Slug: {category.slug}</p>
                </div>
                {category.is_admin_only && (
                  <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center space-x-1">
                    <FiLock className="w-3 h-3" />
                    <span>Admin Only</span>
                  </span>
                )}
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 px-4 py-2 bg-[#fe7d17] text-white rounded-lg hover:bg-[#e66d0f] transition-colors flex items-center justify-center space-x-2"
                >
                  <FiEdit />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-600">Belum ada kategori. Tambah kategori pertama Anda!</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Kategori
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fe7d17] focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fe7d17] focus:border-transparent"
                    placeholder="1, 2, 3, ... (kosongkan untuk otomatis)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Urutan tampilan kategori. Angka lebih kecil akan tampil lebih dulu.
                  </p>
                </div>
                <div className="mb-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_admin_only}
                      onChange={(e) =>
                        setFormData({ ...formData, is_admin_only: e.target.checked })
                      }
                      className="w-4 h-4 text-[#fe7d17] border-gray-300 rounded focus:ring-[#fe7d17]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Hanya untuk Admin (Publisher tidak bisa menggunakan)
                    </span>
                  </label>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingCategory(null)
                      setFormData({ name: '', is_admin_only: false, order: 0 })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#fe7d17] text-white rounded-lg hover:bg-[#e66d0f] transition-colors"
                  >
                    {editingCategory ? 'Simpan' : 'Tambah'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}

