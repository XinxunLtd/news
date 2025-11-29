import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Artikel Tidak Ditemukan</h1>
      <p className="text-gray-600 mb-8">
        Artikel yang Anda cari tidak ditemukan atau telah dihapus.
      </p>
      <Link href="/" className="btn-primary inline-block">
        Kembali ke Beranda
      </Link>
    </div>
  )
}

