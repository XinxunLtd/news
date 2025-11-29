import { format, formatDistanceToNow } from 'date-fns'

export function formatDate(date: string | null): string {
  if (!date) return ''
  return format(new Date(date), 'dd MMMM yyyy')
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

