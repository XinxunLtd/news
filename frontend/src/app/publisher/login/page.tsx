'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { publisherApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function PublisherLoginPage() {
  const [formData, setFormData] = useState({
    number: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate number starts with 8
    if (formData.number.length === 0 || formData.number[0] !== '8') {
      toast.error('Nomor telepon harus dimulai dengan 8')
      setLoading(false)
      return
    }

    // Validate password min 6 characters
    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      setLoading(false)
      return
    }

    try {
      // Add +62 prefix if not already present
      let phoneNumber = formData.number.trim()
      if (!phoneNumber.startsWith('+62')) {
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '+62' + phoneNumber.substring(1)
        } else if (phoneNumber.startsWith('8')) {
          phoneNumber = '+62' + phoneNumber
        } else {
          phoneNumber = '+62' + phoneNumber
        }
      }
      
      const response = await publisherApi.login(phoneNumber.replace('+62', ''), formData.password)
      if (response.success) {
        localStorage.setItem('publisher_token', response.data.token)
        localStorage.setItem('publisher_user', JSON.stringify(response.data.user))
        toast.success('Login berhasil!')
        router.push('/publisher/dashboard')
      } else {
        toast.error(response.message || 'Login gagal')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('timeout')) {
        toast.error('Tidak dapat terhubung ke server. Mohon tunggu beberapa saat dan coba lagi.')
      } else {
        toast.error(error.response?.data?.message || error.message || 'Login gagal. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Login Publisher
          </h1>
          <p className="text-gray-600 text-center mb-2">
            Login menggunakan akun Xinxun Anda
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-800 text-center">
              Masukkan nomor telepon Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Telepon *
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-gray-700">
                  +62
                </span>
                <input
                  type="tel"
                  value={formData.number}
                  onChange={(e) => {
                    // Only allow numbers starting with 8
                    const value = e.target.value.replace(/\D/g, '')
                    if (value === '' || value.startsWith('8')) {
                      setFormData({ ...formData, number: value })
                    }
                  }}
                  required
                  placeholder="8xxxxxxxxxx"
                  className="input-field rounded-l-none"
                  pattern="^8[0-9]+"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Nomor telepon harus dimulai dengan 8
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

