# Xinxun News Frontend

Frontend aplikasi news website Xinxun menggunakan Next.js 14 dengan App Router, TypeScript, dan TailwindCSS.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- React Hook Form
- Axios
- Next-SEO
- React Icons
- React Hot Toast

## Setup

### 1. Install Dependencies

```bash
npm install
# atau
yarn install
```

### 2. Setup Environment Variables

Copy `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080/v1
NEXT_PUBLIC_SITE_URL=https://news.xinxun.us
```

### 3. Run Development Server

```bash
npm run dev
# atau
yarn dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## Features

- ✅ Server-side rendering (SSR) untuk SEO
- ✅ Static generation untuk performa
- ✅ Responsive design (mobile-first)
- ✅ SEO optimization (meta tags, sitemap, structured data)
- ✅ Search functionality
- ✅ Category filtering
- ✅ Pagination
- ✅ Admin panel dengan authentication
- ✅ Image optimization dengan Next/Image

## Pages

- `/` - Homepage dengan list news
- `/news/[slug]` - Detail artikel
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin dashboard
- `/admin/news/new` - Tambah artikel baru
- `/admin/news/[id]/edit` - Edit artikel

## SEO Features

- Dynamic meta tags per halaman
- Open Graph tags
- Twitter Card tags
- Structured data (JSON-LD)
- Sitemap.xml generation
- Robots.txt
- Semantic HTML

## Design

- Background: White (#FFFFFF)
- Primary Color: #fe7d17 (untuk buttons, links, highlights)
- Clean, modern, elegant design
- Professional news-style typography
- Responsive di semua devices

