'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { FiSearch, FiMenu, FiX } from 'react-icons/fi'
import SearchBar from './SearchBar'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="Xinxun News"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation - Removed categories */}

          {/* Search, Publisher Login & CTA */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-700 hover:text-[#fe7d17] transition-colors"
              aria-label="Search"
            >
              <FiSearch className="w-5 h-5" />
            </button>

            {/* Login Publisher Button */}
            <Link
              href="/publisher/login"
              className="px-4 py-2 text-gray-700 hover:text-[#fe7d17] transition-colors font-medium hidden sm:inline-block"
            >
              Login Publisher
            </Link>

            {/* Investasi Sekarang Button */}
            <a
              href="https://xinxun.us"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary hidden sm:inline-block"
            >
              Investasi Sekarang
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700"
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="py-4 border-t border-gray-200">
            <SearchBar onClose={() => setIsSearchOpen(false)} />
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/publisher/login"
                className="text-gray-700 hover:text-[#fe7d17] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login Publisher
              </Link>
              <a
                href="https://xinxun.us"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Investasi Sekarang
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

