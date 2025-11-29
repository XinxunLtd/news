import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-8">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <Link href="/" className="btn-primary inline-block">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}

