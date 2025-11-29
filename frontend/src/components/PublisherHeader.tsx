'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FiMenu, FiX } from 'react-icons/fi'
import { useSidebar } from '@/contexts/SidebarContext'

export default function PublisherHeader() {
  const { isOpen, toggle } = useSidebar()

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button - only visible on mobile */}
            <button
              onClick={toggle}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
            <Link href="/publisher/dashboard" className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="Xinxun News"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
              {/* Hide text on mobile */}
              <span className="hidden lg:inline text-xl font-bold text-gray-900 ml-2">Publisher Panel</span>
            </Link>
          </div>
          {/* Hide text on mobile */}
          <div className="hidden lg:block text-sm text-gray-600">
            Xinxun News Publisher Dashboard
          </div>
        </div>
      </div>
    </header>
  )
}

