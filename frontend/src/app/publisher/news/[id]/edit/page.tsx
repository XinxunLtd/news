'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { newsApi, categoryApi, publisherApi } from '@/lib/api'
import type { Category, News } from '@/types'
import toast from 'react-hot-toast'
import RichTextEditor from '@/components/RichTextEditor'
import Image from 'next/image'

export default function EditPublisherNewsPage() {
  const params = useParams()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [news, setNews] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    thumbnail: '',
    category_id: 0,
  })
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null) // Store thumbnail file for upload on submit
  const [oldThumbnail, setOldThumbnail] = useState<string>('') // To track original thumbnail for deletion

  useEffect(() => {
    const token = localStorage.getItem('publisher_token')
    if (!token) {
      router.push('/publisher/login')
      return
    }

    loadData()
  }, [router, params])

  const loadData = async () => {
    try {
      const [newsResponse, categoriesResponse] = await Promise.all([
        newsApi.getAll({ page: 1, limit: 1000 }),
        categoryApi.getAll(),
      ])

      const user = JSON.parse(localStorage.getItem('publisher_user') || '{}')
      const foundNews = newsResponse.data.find(
        (n) => n.id === parseInt(params.id as string) && n.author_id === user.id
      )
      if (!foundNews) {
        toast.error('Artikel tidak ditemukan atau bukan milik Anda')
        router.push('/publisher/dashboard')
        return
      }

      setNews(foundNews)
      // Filter out admin-only categories completely - don't show them to publisher
      const availableCategories = categoriesResponse.data.filter((cat) => !cat.is_admin_only)
      setCategories(availableCategories)
      setOldThumbnail(foundNews.thumbnail)
      setFormData({
        title: foundNews.title,
        content: foundNews.content,
        excerpt: foundNews.excerpt,
        thumbnail: foundNews.thumbnail,
        category_id: foundNews.category_id,
      })
    } catch (error: any) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validate title length (max 100 words)
    if (formData.title) {
      const titleWords = formData.title.trim().split(/\s+/).filter(w => w.length > 0)
      if (titleWords.length > 100) {
        toast.error('Judul maksimal 100 kata')
        return
      }
    }
    
    // Validate excerpt length (max 200 words)
    if (formData.excerpt) {
      const excerptWords = formData.excerpt.trim().split(/\s+/).filter(w => w.length > 0)
      if (excerptWords.length > 200) {
        toast.error('Excerpt maksimal 200 kata')
        return
      }
    }
    
    setSaving(true)

    try {
      const token = localStorage.getItem('publisher_token')
      if (!token) {
        toast.error('Anda tidak terautentikasi')
        router.push('/publisher/login')
        return
      }

      // Upload thumbnail if new file was selected
      let finalThumbnail = formData.thumbnail
      if (thumbnailFile) {
        const formDataUpload = new FormData()
        formDataUpload.append('image', thumbnailFile)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataUpload,
        })
        if (!response.ok) throw new Error('Upload thumbnail gagal')
        const data = await response.json()
        finalThumbnail = data.url
      }

      await publisherApi.updateNews(parseInt(params.id as string), {
        ...formData,
        thumbnail: finalThumbnail,
      })
      toast.success('Artikel berhasil diperbarui!')
      router.push('/publisher/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memperbarui artikel')
    } finally {
      setSaving(false)
    }
  }

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setThumbnailFile(null)
      setFormData((prev) => ({ ...prev, thumbnail: oldThumbnail })) // Revert to old thumbnail if no new file
      return
    }

    // Validate file type (png, jpg, jpeg, heic, webp, gif)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/heic', 'image/heif', 'image/webp', 'image/gif']
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.heic', '.heif', '.webp', '.gif']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error('Format file tidak didukung. Gunakan PNG, JPG, JPEG, HEIC, WEBP, atau GIF')
      setThumbnailFile(null)
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB')
      setThumbnailFile(null)
      return
    }

    // Store file and convert to base64 for preview (will be uploaded on submit)
    setThumbnailFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setFormData((prev) => ({ ...prev, thumbnail: base64 }))
    }
    reader.readAsDataURL(file)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Artikel</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={500}
              className="input-field"
              placeholder="Masukkan judul artikel (maksimal 100 kata)"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.trim().split(/\s+/).filter(w => w.length > 0).length} / 100 kata
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
              maxLength={1000}
              className="input-field"
              placeholder="Ringkasan artikel (maksimal 200 kata)"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.excerpt.trim().split(/\s+/).filter(w => w.length > 0).length} / 200 kata
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konten *
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder="Tulis konten artikel di sini..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail
            </label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailFileChange}
                className="input-field"
              />
              {formData.thumbnail && (
                <div className="mt-2">
                  <Image
                    src={formData.thumbnail}
                    alt="Thumbnail preview"
                    width={200}
                    height={150}
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
              required
              className="input-field"
            >
              <option value={0}>Pilih kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {news && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Status:</strong> {news.status}
                {news.status === 'pending' && ' - Menunggu approval admin'}
                {news.status === 'rejected' && ' - Ditolak oleh admin'}
              </p>
            </div>
          )}

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
  )
}

