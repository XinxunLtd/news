# Xinxun News Website

Platform berita untuk Xinxun dengan fitur admin panel dan publisher dashboard.

## 🚀 Tech Stack

### Backend
- **Go 1.21+** dengan Gin Framework
- **MySQL 8.0** database
- **GORM** untuk ORM
- **JWT** untuk authentication
- **AWS S3** untuk image storage

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **React Quill** untuk WYSIWYG editor

### Infrastructure
- **Docker & Docker Compose**
- **Nginx** sebagai reverse proxy
- **Let's Encrypt** untuk SSL

## 📁 Project Structure

```
news/
├── backend/          # Go backend API
│   ├── cmd/         # Main application entry
│   ├── internal/    # Internal packages
│   │   ├── config/  # Configuration
│   │   ├── database/ # Database connection
│   │   ├── handlers/ # HTTP handlers
│   │   ├── middleware/ # Middleware (auth, etc)
│   │   ├── models/  # Data models
│   │   ├── repository/ # Data access layer
│   │   ├── routes/  # API routes
│   │   └── services/ # Business logic
│   ├── db.sql       # Database schema
│   └── Dockerfile
├── frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/     # Next.js app router pages
│   │   ├── components/ # React components
│   │   ├── lib/     # Utilities & API client
│   │   └── types/   # TypeScript types
│   └── Dockerfile
├── docker-compose.yml
└── how-to-run.md    # Deployment guide
```

## 🛠️ Development Setup

### Prerequisites
- Docker & Docker Compose
- Go 1.21+ (untuk development backend)
- Node.js 20+ (untuk development frontend)

### Quick Start

1. **Clone repository**
```bash
git clone https://github.com/XinxunLtd/news.git
cd news
```

2. **Setup environment variables**

Backend:
```bash
cd backend
cp .env.example .env
# Edit .env dengan konfigurasi yang sesuai
```

Frontend:
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local dengan konfigurasi yang sesuai
```

3. **Run with Docker**
```bash
docker-compose up -d
```

4. **Access application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- Health Check: http://localhost:8080/health

## 📝 Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**⚠️ PENTING:** Ganti password default setelah deployment!

## 🌐 Production Deployment

Lihat [how-to-run.md](./how-to-run.md) untuk panduan lengkap deployment di VPS.

### Quick Production Setup

1. Setup VPS dengan Ubuntu/Debian
2. Install Docker & Docker Compose
3. Clone repository
4. Setup environment variables
5. Setup Nginx reverse proxy
6. Setup SSL dengan Let's Encrypt
7. Run `docker-compose up -d`

## 🔗 Endpoints

### Production URLs
- Frontend: https://news.xinxun.us
- Backend API: https://api.news.xinxun.us/api

### API Endpoints

**Public:**
- `GET /api/news` - List news
- `GET /api/news/:slug` - Get news by slug
- `GET /api/news/featured` - Get featured news
- `GET /api/categories` - List categories

**Admin (Protected):**
- `POST /api/admin/login` - Admin login
- `GET /api/admin/news` - List all news (all statuses)
- `POST /api/admin/news` - Create news
- `PUT /api/admin/news/:id` - Update news
- `DELETE /api/admin/news/:id` - Delete news
- `POST /api/admin/news/:id/approve` - Approve news
- `POST /api/admin/news/:id/reject` - Reject news

**Publisher (Protected):**
- `POST /api/publisher/login` - Publisher login
- `POST /api/publisher/news` - Create news (auto pending)
- `PUT /api/publisher/news/:id` - Update news

## 🔐 Features

- ✅ Admin panel dengan CRUD news
- ✅ Publisher dashboard untuk submit artikel
- ✅ News approval workflow
- ✅ Category management dengan admin-only categories
- ✅ Image upload ke AWS S3
- ✅ WYSIWYG editor untuk konten
- ✅ SEO optimized
- ✅ Responsive design

## 📄 License

Copyright © 2025 Xinxun, Ltd. All rights reserved.
