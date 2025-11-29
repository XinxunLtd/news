'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { newsApi, categoryApi, adminApi, adminCategoryApi, tagApi } from '@/lib/api'
import type { Category, News, Tag } from '@/types'
import toast from 'react-hot-toast'
import RichTextEditor from '@/components/RichTextEditor'
import Image from 'next/image'
import NewsPreviewModal from '@/components/NewsPreviewModal'

export default function EditNewsPage() {
  const params = useParams()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [news, setNews] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    thumbnail: '',
    category_id: 0,
    status: 'draft',
  })
  const [contentImages, setContentImages] = useState<Map<string, File>>(new Map()) // Store base64->File mapping
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null) // Store thumbnail file for upload
  const [oldThumbnail, setOldThumbnail] = useState<string>('') // Store old thumbnail URL for deletion

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    loadData()
  }, [router, params])

  const loadData = async () => {
    try {
      const [newsResponse, categoriesResponse, tagsResponse] = await Promise.all([
        adminApi.getAllNews({ page: 1, limit: 1000 }),
        adminCategoryApi.getAll(),
        tagApi.getAll(),
      ])

      const foundNews = newsResponse.data.find((n) => n.id === parseInt(params.id as string))
      if (!foundNews) {
        toast.error('Artikel tidak ditemukan')
        router.push('/admin/dashboard')
        return
      }

      setNews(foundNews)
      setCategories(categoriesResponse.data)
      setTags(tagsResponse.data)
      setSelectedTagIds(foundNews.tags?.map((t) => t.id) || [])
      setOldThumbnail(foundNews.thumbnail || '')
      setFormData({
        title: foundNews.title,
        content: foundNews.content,
        excerpt: foundNews.excerpt,
        thumbnail: foundNews.thumbnail,
        category_id: foundNews.category_id,
        status: foundNews.status,
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
      const token = localStorage.getItem('admin_token')
      let finalThumbnail = formData.thumbnail
      let thumbnailToDelete = ''

      // Upload new thumbnail if file is selected
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
        if (oldThumbnail) {
          thumbnailToDelete = oldThumbnail
        }
      }

      // Upload all content images first
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

      // Update database
      await adminApi.updateNews(parseInt(params.id as string), {
        ...formData,
        content: finalContent,
        thumbnail: finalThumbnail,
        tag_ids: selectedTagIds,
      })

      // Delete old thumbnail from S3 if changed
      if (thumbnailToDelete && thumbnailToDelete.includes('s3.amazonaws.com')) {
        try {
          const key = thumbnailToDelete.split('s3.amazonaws.com/')[1]?.split('?')[0]
          if (key) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/upload/delete`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ key }),
            })
          }
        } catch (err) {
          console.error('Failed to delete old thumbnail:', err)
          // Don't fail the whole operation if deletion fails
        }
      }

      toast.success('Artikel berhasil diperbarui!')
      router.push('/admin/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memperbarui artikel')
    } finally {
      setSaving(false)
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
              onImageAdded={handleImageAdded}
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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg min-h-[60px]">
              {tags.length === 0 ? (
                <p className="text-sm text-gray-500">Memuat tags...</p>
              ) : (
                tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTagIds([...selectedTagIds, tag.id])
                        } else {
                          setSelectedTagIds(selectedTagIds.filter((id) => id !== tag.id))
                        }
                      }}
                      className="rounded border-gray-300 text-[#fe7d17] focus:ring-[#fe7d17]"
                    />
                    <span className="text-sm text-gray-700">{tag.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input-field"
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => {
                if (!formData.title || !formData.content || !formData.thumbnail) {
                  toast.error('Harap isi judul, konten, dan thumbnail terlebih dahulu')
                  return
                }
                setShowPreview(true)
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Preview
            </button>
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

        {/* Preview Modal */}
        {showPreview && (
          <NewsPreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            news={{
              title: formData.title,
              content: formData.content,
              excerpt: formData.excerpt,
              thumbnail: formData.thumbnail,
              category: categories.find((c) => c.id === formData.category_id) || categories[0],
              tags: tags.filter((t) => selectedTagIds.includes(t.id)),
            }}
          />
        )}
        </form>
    </div>
  )
}

