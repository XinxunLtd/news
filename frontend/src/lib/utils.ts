import { format, formatDistanceToNow } from 'date-fns'
import DOMPurify from 'isomorphic-dompurify'

export function formatDate(date: string | null): string {
  if (!date) return ''
  return format(new Date(date), 'dd MMMM yyyy')
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style', 'width', 'height'
    ],
    ALLOW_DATA_ATTR: false,
  })
}

export function formatRelativeTime(date: string | null): string {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

