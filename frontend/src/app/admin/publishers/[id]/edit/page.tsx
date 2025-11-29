'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'
import type { User } from '@/types'

export default function EditPublisherPage() {
  const params = useParams()
  const router = useRouter()
  const [publisher, setPublisher] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    status: 'Active',
    balance: 0,
  })

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    loadPublisher()
  }, [router, params])

  const loadPublisher = async () => {
    try {
      const response = await adminApi.getPublisher(parseInt(params.id as string))
      setPublisher(response.data)
      setFormData({
        username: response.data.username,
        name: response.data.name,
        password: '',
        status: response.data.status || 'Active',
        balance: response.data.balance || 0,
      })
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      } else {
        toast.error('Gagal memuat data publisher')
        router.push('/admin/publishers')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (formData.password && formData.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setSaving(true)
    try {
      const updateData: any = {
        username: formData.username,
        name: formData.name,
        status: formData.status,
        balance: formData.balance,
      }
      if (formData.password) {
        updateData.password = formData.password
      }

      await adminApi.updatePublisher(parseInt(params.id as string), updateData)
      toast.success('Publisher berhasil diperbarui!')
      router.push('/admin/publishers')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memperbarui publisher')
    } finally {
      setSaving(false)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Publisher</h1>

        <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password Baru
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                className="input-field"
                placeholder="Kosongkan jika tidak ingin mengubah"
              />
              <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="input-field"
              >
                <option value="Active">Active</option>
                <option value="Suspend">Suspend</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Balance
              </label>
              <input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Informasi Lainnya</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Email: {publisher?.email || '-'}</p>
                <p>Xinxun ID: {publisher?.xinxun_id || '-'}</p>
                <p>Xinxun Number: {publisher?.xinxun_number || '-'}</p>
                <p>Reff Code: {publisher?.reff_code || '-'}</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
    </div>
  )
}

