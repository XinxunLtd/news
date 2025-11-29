import axios, { AxiosInstance } from 'axios'
import type { NewsResponse, SingleNewsResponse, Category, News } from '@/types'

// Get API URL based on environment
// Server-side (SSR): use service name in Docker, localhost for local dev
// Client-side: always use localhost (accessed from browser)
const getApiUrl = (): string => {
  // Server-side rendering (no window object)
  if (typeof window === 'undefined') {
    // In Docker, use service name. For local dev, use localhost
    return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
  }
  // Client-side: try NEXT_PUBLIC_API_URL first, then fallback to 127.0.0.1 if localhost doesn't work
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api'
  // Replace localhost with 127.0.0.1 for better Windows compatibility
  return apiUrl.replace('localhost', '127.0.0.1')
}

// Cache for axios instances
let serverInstance: AxiosInstance | null = null
let clientInstance: AxiosInstance | null = null

// Get axios instance with correct baseURL (cached per environment)
const getApi = (): AxiosInstance => {
  const isServer = typeof window === 'undefined'
  
  // Return cached instance if available
  if (isServer && serverInstance) {
    return serverInstance
  }
  if (!isServer && clientInstance) {
    return clientInstance
  }

  // Create new instance
  const instance = axios.create({
    baseURL: getApiUrl(),
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds timeout
  })

  // Add request interceptor for logging and auth
  instance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      // Try admin token first, then publisher token
      const token = localStorage.getItem('admin_token') || localStorage.getItem('publisher_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      // Log request for debugging
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    }
    return config
  })

  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => {
      if (typeof window !== 'undefined') {
        console.log(`[API Response] ${response.status} ${response.config.url}`)
      }
      return response
    },
    (error) => {
      if (typeof window !== 'undefined') {
        console.error('[API Error]', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
          code: error.code,
        })
      }
      return Promise.reject(error)
    }
  )

  // Cache instance
  if (isServer) {
    serverInstance = instance
  } else {
    clientInstance = instance
  }

  return instance
}

// Create default instance
const api = getApi()

export const newsApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    q?: string
    category?: string
  }): Promise<NewsResponse> => {
    const apiInstance = getApi()
    const response = await apiInstance.get('/news', { params })
    return response.data
  },

  getBySlug: async (slug: string): Promise<SingleNewsResponse> => {
    const apiInstance = getApi()
    const response = await apiInstance.get(`/news/${slug}`)
    return response.data
  },

  search: async (query: string, page = 1, limit = 10): Promise<NewsResponse> => {
    const apiInstance = getApi()
    const response = await apiInstance.get('/news/search', {
      params: { q: query, page, limit },
    })
    return response.data
  },

  getFeatured: async (limit = 5): Promise<{ data: News[] }> => {
    const apiInstance = getApi()
    const response = await apiInstance.get('/news/featured', {
      params: { limit },
    })
    return response.data
  },
}

export const categoryApi = {
  getAll: async (): Promise<{ data: Category[] }> => {
    const apiInstance = getApi()
    const response = await apiInstance.get('/categories')
    return response.data
  },
}

export const adminCategoryApi = {
  getAll: async (): Promise<{ data: Category[] }> => {
    const apiInstance = getApi()
    const response = await apiInstance.get('/admin/categories')
    return response.data
  },

  create: async (data: { name: string; is_admin_only?: boolean }) => {
    const apiInstance = getApi()
    const response = await apiInstance.post('/admin/categories', data)
    return response.data
  },

  update: async (id: number, data: { name?: string; is_admin_only?: boolean }) => {
    const apiInstance = getApi()
    const response = await apiInstance.put(`/admin/categories/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    const apiInstance = getApi()
    const response = await apiInstance.delete(`/admin/categories/${id}`)
    return response.data
  },
}

export const adminApi = {
  login: async (username: string, password: string) => {
    const apiInstance = getApi()
    const response = await apiInstance.post('/admin/login', { username, password })
    return response.data
  },

  getAllNews: async (params?: {
    page?: number
    limit?: number
    q?: string
    category?: string
  }): Promise<NewsResponse> => {
    const apiInstance = getApi()
    const response = await apiInstance.get('/admin/news', { params })
    return response.data
  },

  createNews: async (data: any) => {
    const apiInstance = getApi()
    const response = await apiInstance.post('/admin/news', data)
    return response.data
  },

  updateNews: async (id: number, data: any) => {
    const apiInstance = getApi()
    const response = await apiInstance.put(`/admin/news/${id}`, data)
    return response.data
  },

  deleteNews: async (id: number) => {
    const apiInstance = getApi()
    const response = await apiInstance.delete(`/admin/news/${id}`)
    return response.data
  },

  uploadImage: async (file: File) => {
    const apiInstance = getApi()
    const formData = new FormData()
    formData.append('image', file)
    const response = await apiInstance.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Admin approval endpoints
  getPendingNews: async () => {
    const apiInstance = getApi()
    const response = await apiInstance.get('/admin/news/pending')
    return response.data
  },

  approveNews: async (id: number, rewardAmount: number) => {
    const apiInstance = getApi()
    const response = await apiInstance.post(`/admin/news/${id}/approve`, {
      reward_amount: rewardAmount,
    })
    return response.data
  },

  rejectNews: async (id: number) => {
    const apiInstance = getApi()
    const response = await apiInstance.post(`/admin/news/${id}/reject`)
    return response.data
  },

  getStatistics: async () => {
    const apiInstance = getApi()
    const response = await apiInstance.get('/admin/news/statistics')
    return response.data
  },

  // User profile management
  getProfile: async () => {
    const apiInstance = getApi()
    const response = await apiInstance.get('/admin/profile')
    return response.data
  },

  updateProfile: async (data: { username?: string; name?: string; password?: string }) => {
    const apiInstance = getApi()
    const response = await apiInstance.put('/admin/profile', data)
    return response.data
  },

  // Publisher management
  getAllPublishers: async () => {
    const apiInstance = getApi()
    const response = await apiInstance.get('/admin/publishers')
    return response.data
  },

  getPublisher: async (id: number) => {
    const apiInstance = getApi()
    const response = await apiInstance.get(`/admin/publishers/${id}`)
    return response.data
  },

  updatePublisher: async (id: number, data: { username?: string; name?: string; password?: string; status?: string; balance?: number }) => {
    const apiInstance = getApi()
    const response = await apiInstance.put(`/admin/publishers/${id}`, data)
    return response.data
  },

  deletePublisher: async (id: number) => {
    const apiInstance = getApi()
    const response = await apiInstance.delete(`/admin/publishers/${id}`)
    return response.data
  },
}

export const publisherApi = {
  login: async (number: string, password: string) => {
    const apiInstance = getApi()
    const response = await apiInstance.post('/publisher/login', { number, password })
    return response.data
  },

  createNews: async (data: any) => {
    const apiInstance = getApi()
    const response = await apiInstance.post('/publisher/news', data)
    return response.data
  },

  updateNews: async (id: number, data: any) => {
    const apiInstance = getApi()
    const response = await apiInstance.put(`/publisher/news/${id}`, data)
    return response.data
  },

  getStatistics: async () => {
    const apiInstance = getApi()
    const response = await apiInstance.get('/publisher/statistics')
    return response.data
  },
}

export default api

