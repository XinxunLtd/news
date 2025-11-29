'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/contexts/SidebarContext'
import { FiHome, FiFileText, FiLogOut } from 'react-icons/fi'

export default function PublisherSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, close } = useSidebar()

  // Close sidebar on mobile when route changes
  useEffect(() => {
    close()
  }, [pathname, close])

  const handleLogout = () => {
    localStorage.removeItem('publisher_token')
    localStorage.removeItem('publisher_user')
    router.push('/publisher/login')
  }

  const menuItems = [
    { href: '/publisher/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/publisher/news/new', label: 'Tambah Artikel', icon: FiFileText },
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[45]"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-[50] w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white min-h-screen flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-[#fe7d17]">Publisher Panel</h2>
        <p className="text-sm text-gray-400 mt-1">Xinxun News</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#fe7d17] text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
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
      </div>
    </>
  )
}

