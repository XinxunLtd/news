# Xinxun News Website

Aplikasi news website production-ready untuk Xinxun dengan backend Go dan frontend Next.js.

## 🏗️ Project Structure

```
NEWS/
├── backend/          # Go backend (Gin, GORM, MySQL)
├── frontend/         # Next.js frontend (App Router, TypeScript, Tailwind)
└── docker-compose.yml
```

## 🚀 Quick Start dengan Docker (Otomatis)

### Cara Otomatis (Recommended)

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

Script akan otomatis:
1. ✅ Check Docker installation
2. ✅ Setup environment files (.env)
3. ✅ Build Docker images
4. ✅ Start semua containers
5. ✅ Auto-migrate database
6. ✅ Auto-seed database (admin user + sample news)

### Cara Manual

**1. Clone Repository**
```bash
git clone <repository-url>
cd News
```

**2. Setup Environment Variables**

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env jika perlu (default sudah sesuai untuk Docker)
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local jika perlu
```

**3. Run dengan Docker Compose**
```bash
docker-compose up -d --build
```

**4. Database akan otomatis:**
- ✅ Schema dibuat dari `db.sql` saat MySQL container pertama kali start
- ✅ Migration otomatis saat backend start
- ✅ Seed data otomatis jika admin belum ada (first run)

Aplikasi akan berjalan di:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **MySQL:** localhost:3306

**5. (Optional) Manual Seed Database**
Jika perlu seed ulang:
```bash
docker exec -it xinxun_news_backend go run seeds/seed.go
```

## 🛠️ Manual Setup

### Backend Setup

Lihat [backend/README.md](./backend/README.md) untuk instruksi lengkap.

```bash
cd backend
go mod download
# Setup .env
go run cmd/main.go
```

### Frontend Setup

Lihat [frontend/README.md](./frontend/README.md) untuk instruksi lengkap.

```bash
cd frontend
npm install
# Setup .env.local
npm run dev
```

## 📋 Default Credentials

**Admin Login:**
- Username: `admin`
- Password: `admin123`

**PENTING:** Ganti password default setelah deployment!

## 🎨 Design

- **Background:** White (#FFFFFF)
- **Primary Color:** #fe7d17 (untuk buttons, links, highlights)
- **Design:** Clean, modern, elegant seperti website news profesional
- **Responsive:** Mobile-first design

## ✨ Features

### Public Features
- ✅ List news dengan pagination
- ✅ Search functionality
- ✅ Category filtering
- ✅ News detail page
- ✅ Related articles
- ✅ SEO optimized (meta tags, sitemap, structured data)
- ✅ Responsive design

### Admin Features
- ✅ JWT Authentication
- ✅ Dashboard dengan list semua artikel
- ✅ Create/Edit/Delete news
- ✅ Image upload
- ✅ Category management
- ✅ Draft/Published status

## 🔧 Tech Stack

### Backend
- Go 1.21+
- Gin Web Framework
- GORM (MySQL ORM)
- JWT Authentication
- Bcrypt

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- React Hook Form
- Axios
- Next-SEO

## 📡 API Endpoints

### Public
- `GET /api/news` - List news (dengan pagination, search, filter)
- `GET /api/news/:slug` - Get single news
- `GET /api/news/search?q=` - Search news
- `GET /api/categories` - List categories

### Admin (Protected)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/news` - Create news
- `PUT /api/admin/news/:id` - Update news
- `DELETE /api/admin/news/:id` - Delete news
- `POST /api/admin/upload` - Upload image

## 📝 Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=xinxun_news
JWT_SECRET=your-secret-key
PORT=8080
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_SITE_URL=https://news.xinxun.us
```

## 🐳 Docker

Docker Compose setup sudah termasuk:
- MySQL 8.0
- Go Backend
- Next.js Frontend
- Volume persistence untuk database
- Network configuration

## 📚 Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## 🔒 Security Notes

1. Ganti `JWT_SECRET` dengan secret key yang kuat di production
2. Ganti password admin default setelah deployment
3. Setup HTTPS untuk production
4. Konfigurasi CORS dengan benar
5. Gunakan environment variables untuk sensitive data

## 📄 License

Copyright © 2024 Xinxun. All rights reserved.

