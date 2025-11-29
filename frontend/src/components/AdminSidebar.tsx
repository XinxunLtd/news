'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useSidebar } from '@/contexts/SidebarContext'
import { adminApi } from '@/lib/api'
import {
  FiHome,
  FiFileText,
  FiUsers,
  FiTag,
  FiClock,
  FiLogOut,
  FiUser,
  FiEdit,
} from 'react-icons/fi'

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, close } = useSidebar()
  const [pendingCounts, setPendingCounts] = useState({ pending_new: 0, pending_revision: 0 })
  const [prevPathname, setPrevPathname] = useState(pathname)

  // Close sidebar on mobile when route changes (but not on initial mount)
  useEffect(() => {
    // Only close if pathname actually changed and sidebar is open
    if (prevPathname !== pathname && isOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
      close()
    }
    setPrevPathname(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Load pending counts
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      loadPendingCounts()
      // Refresh every 30 seconds
      const interval = setInterval(loadPendingCounts, 30000)
      return () => clearInterval(interval)
    }
  }, [])

  const loadPendingCounts = async () => {
    try {
      const response = await adminApi.getPendingCounts()
      setPendingCounts(response.data)
    } catch (error) {
      // Silent fail
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    toast.success('Anda telah logout')
    router.push('/admin/login')
  }

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/admin/news/new', label: 'Tambah Artikel', icon: FiFileText },
    { href: '/admin/news/pending', label: 'Pending Artikel Baru', icon: FiClock, count: pendingCounts.pending_new },
    { href: '/admin/news/pending/revisions', label: 'Pending Edit Artikel', icon: FiEdit, count: pendingCounts.pending_revision },
    { href: '/admin/categories', label: 'Kelola Kategori', icon: FiTag },
    { href: '/admin/tags', label: 'Kelola Tags', icon: FiTag },
    { href: '/admin/publishers', label: 'Kelola Publisher', icon: FiUsers },
    { href: '/admin/profile', label: 'Profil Saya', icon: FiUser },
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[60]"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            close()
          }}
          onTouchStart={(e) => {
            e.preventDefault()
            e.stopPropagation()
            close()
          }}
          style={{ zIndex: 60 }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white min-h-screen flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ zIndex: 70 }}
        aria-label="Sidebar"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-[#fe7d17]">Admin Panel</h2>
        <p className="text-sm text-gray-400 mt-1">Xinxun News</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const count = item.count || 0
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => {
                    // Close sidebar on mobile when link is clicked
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      close()
                    }
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#fe7d17] text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {count > 0 && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      isActive ? 'bg-white text-[#fe7d17]' : 'bg-[#fe7d17] text-white'
                    }`}>
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
      </aside>
    </>
  )
}

