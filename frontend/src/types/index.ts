export interface News {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  thumbnail: string
  category_id: number
  category: Category
  author_id: number
  author: User
  tags: Tag[]
  published_at: string | null
  views: number
  status: 'draft' | 'published' | 'pending' | 'rejected'
  reward_amount?: number
  is_rewarded?: boolean
  revision_of?: number | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  is_admin_only?: boolean
  order?: number
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  slug: string
  order?: number
}

export interface User {
  id: number
  username: string
  name: string
  email: string
  user_type?: 'admin' | 'publisher'
  xinxun_id?: number
  xinxun_number?: string
  balance?: number
  status?: string
  reff_code?: string
}

export interface NewsResponse {
  data: News[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface SingleNewsResponse {
  data: News
}

