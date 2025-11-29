'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { categoryApi, publisherApi } from '@/lib/api'
import type { Category } from '@/types'
import toast from 'react-hot-toast'
import RichTextEditor from '@/components/RichTextEditor'
import Image from 'next/image'
import PublisherSidebar from '@/components/PublisherSidebar'

export default function NewPublisherNewsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    thumbnail: '',
    category_id: 0,
  })
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null) // Store thumbnail file for upload on submit
  const [contentImages, setContentImages] = useState<Map<string, File>>(new Map()) // Store base64->File mapping
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('publisher_token')
    if (!token) {
      router.push('/publisher/login')
      return
    }

    loadCategories()
  }, [router])

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getAll()
      // Filter out admin-only categories completely - don't show them to publisher
      const availableCategories = response.data.filter((cat) => !cat.is_admin_only)
      setCategories(availableCategories) // Only show non-admin-only categories
      if (availableCategories.length > 0) {
        setFormData((prev) => ({ ...prev, category_id: availableCategories[0].id }))
      }
    } catch (error) {
      toast.error('Gagal memuat kategori')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validate title length (max 100 words)
    const titleWords = formData.title.trim().split(/\s+/).filter(w => w.length > 0)
    if (titleWords.length > 100) {
      toast.error('Judul maksimal 100 kata')
      return
    }
    
    // Validate required fields
    if (!formData.excerpt || formData.excerpt.trim() === '') {
      toast.error('Excerpt harus diisi')
      return
    }
    
    // Validate excerpt length (max 200 words)
    const excerptWords = formData.excerpt.trim().split(/\s+/).filter(w => w.length > 0)
    if (excerptWords.length > 200) {
      toast.error('Excerpt maksimal 200 kata')
      return
    }
    
    if (!thumbnailFile && !formData.thumbnail) {
      toast.error('Thumbnail harus diupload')
      return
    }
    
    setLoading(true)

    try {
      const token = localStorage.getItem('publisher_token')
      if (!token) {
        toast.error('Anda tidak terautentikasi')
        router.push('/publisher/login')
        return
      }

      // Upload thumbnail first if new file selected
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

      // Upload all content images
      let finalContent = formData.content
      if (contentImages.size > 0) {
        const uploadPromises = Array.from(contentImages.entries()).map(async ([base64, file]) => {
          const formData = new FormData()
          formData.append('image', file)
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/upload`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          })
          if (!response.ok) throw new Error('Upload gagal')
          const data = await response.json()
          return { base64, url: data.url }
        })

        const uploadResults = await Promise.all(uploadPromises)
        
        // Replace base64 images with S3 URLs in content
        uploadResults.forEach(({ base64, url }) => {
          finalContent = finalContent.replace(base64, url)
        })
      }

      // Submit with updated content and thumbnail
      await publisherApi.createNews({ ...formData, content: finalContent, thumbnail: finalThumbnail })
      toast.success('Artikel berhasil dibuat! Menunggu approval admin.')
      router.push('/publisher/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat artikel')
    } finally {
      setLoading(false)
    }
  }

  const handleImageAdded = (base64: string, file: File) => {
    setContentImages((prev) => {
      const newMap = new Map(prev)
      newMap.set(base64, file)
      return newMap
    })
  }

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setThumbnailFile(null)
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <PublisherSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Tambah Artikel Baru</h1>

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
              Excerpt *
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
              required
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
              onImageAdded={handleImageAdded}
              placeholder="Tulis konten artikel di sini..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail *
            </label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailFileChange}
                required
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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Catatan:</strong> Artikel yang Anda buat akan masuk ke status "Pending" dan menunggu approval dari admin sebelum dipublikasikan.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Artikel'}
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
    </div>
  )
}

