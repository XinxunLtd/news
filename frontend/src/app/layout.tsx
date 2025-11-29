import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Xinxun News - Berita Terbaru tentang Investasi dan Teknologi',
  description: 'Dapatkan berita terbaru tentang investasi, teknologi, dan update dari Xinxun. Platform investasi terpercaya dengan teknologi terkini.',
  keywords: 'xinxun, investasi, crypto, blockchain, teknologi, berita',
  authors: [{ name: 'Xinxun' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'Xinxun News - Berita Terbaru tentang Investasi',
    description: 'Dapatkan berita terbaru tentang investasi dan teknologi dari Xinxun',
    url: 'https://news.xinxun.us',
    siteName: 'Xinxun News',
    type: 'website',
    images: [
      {
        url: 'https://news.xinxun.us/logo.png',
        width: 1200,
        height: 630,
        alt: 'Xinxun News',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xinxun News',
    description: 'Berita terbaru tentang investasi dan teknologi',
    images: ['https://news.xinxun.us/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

