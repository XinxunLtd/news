import { Metadata } from 'next'
import { newsApi, categoryApi } from '@/lib/api'
import NewsCard from '@/components/NewsCard'
import FeaturedSlider from '@/components/FeaturedSlider'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Xinxun News - Berita Terbaru tentang Investasi dan Teknologi',
  description: 'Dapatkan berita terbaru tentang investasi, teknologi, dan update dari Xinxun. Platform investasi terpercaya dengan teknologi terkini.',
}

interface HomePageProps {
  searchParams: {
    page?: string
    q?: string
    category?: string
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const page = parseInt(searchParams.page || '1')
  const search = searchParams.q || ''
  const category = searchParams.category || ''

  const [newsData, categoriesData] = await Promise.all([
    newsApi.getAll({
      page,
      limit: 12,
      q: search,
      category,
    }),
    categoryApi.getAll(),
  ])

  const regularNews = newsData.data

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Featured Slider - Top Views (show when no search, category filter is OK) */}
      {!search && (
        <FeaturedSlider />
      )}

      {/* Page Title */}
      <div className="mb-8">
        {search ? (
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hasil Pencarian: &quot;{search}&quot;
          </h1>
        ) : category ? (
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Kategori: {categoriesData.data.find((c) => c.slug === category)?.name || category}
          </h1>
        ) : (
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Berita Terbaru</h1>
        )}
        <p className="text-gray-600">
          {newsData.meta.total} artikel ditemukan
        </p>
      </div>

      {/* Categories Filter */}
      {!search && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              !category
                ? 'bg-[#fe7d17] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </Link>
          {categoriesData.data.map((cat) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                category === cat.slug
                  ? 'bg-[#fe7d17] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* News Grid */}
      {newsData.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {regularNews.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>

          {/* Pagination */}
          {newsData.meta.pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              {page > 1 && (
                <Link
                  href={`/?page=${page - 1}${search ? `&q=${search}` : ''}${category ? `&category=${category}` : ''}`}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sebelumnya
                </Link>
              )}
              <span className="px-4 py-2 text-gray-700">
                Halaman {page} dari {newsData.meta.pages}
              </span>
              {page < newsData.meta.pages && (
                <Link
                  href={`/?page=${page + 1}${search ? `&q=${search}` : ''}${category ? `&category=${category}` : ''}`}
                  className="px-4 py-2 bg-[#fe7d17] text-white rounded-lg hover:bg-[#e66d0f] transition-colors"
                >
                  Selanjutnya
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Tidak ada berita ditemukan.</p>
        </div>
      )}
    </div>
  )
}

