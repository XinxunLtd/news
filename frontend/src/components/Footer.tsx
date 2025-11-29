'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FaEnvelope, FaTelegram } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image
                src="/logo.png"
                alt="Xinxun News"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-400 text-sm">
              Platform berita terpercaya tentang investasi, teknologi, dan update terbaru dari Xinxun.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Peta Situs</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#fe7d17] transition-colors text-sm">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/publisher/login" className="text-gray-400 hover:text-[#fe7d17] transition-colors text-sm">
                  Masuk sebagai Publisher
                </Link>
              </li>
              <li>
                <a
                  href="https://xinxun.us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#fe7d17] transition-colors text-sm"
                >
                  Website XinXun
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Bantuan</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li> <FaEnvelope className="inline-block mr-2" /> <a href="mailto:help@xinxun.us" target="_blank" rel="noopener noreferrer"><span className="hidden">Email: </span>help@xinxun.us</a></li>
              <li> <FaTelegram className="inline-block mr-2" /> <a href="https://t.me/xinxun_cs" target="_blank" rel="noopener noreferrer"><span className="hidden">Telegram CS: </span>@xinxun_cs</a></li>
              <li> <FaTelegram className="inline-block mr-2" /> <a href="https://t.me/xinxun_group" target="_blank" rel="noopener noreferrer"><span className="hidden">Telegram Group: </span>@xinxun_group</a></li>
            </ul>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="https://xinxun.us/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#fe7d17] transition-colors text-sm"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-600">|</span>
            <Link
              href="https://xinxun.us/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#fe7d17] transition-colors text-sm"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Xinxun, Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
