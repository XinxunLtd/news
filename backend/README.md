# Xinxun News Backend

Backend API untuk aplikasi news website Xinxun menggunakan Go (Gin framework) dan MySQL.

## Tech Stack

- Go 1.21+
- Gin Web Framework
- GORM (MySQL ORM)
- JWT Authentication
- Bcrypt untuk password hashing

## Setup

### 1. Install Dependencies

```bash
go mod download
```

### 2. Setup Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan konfigurasi:

```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=xinxun_news
JWT_SECRET=your-super-secret-jwt-key
PORT=8080
CORS_ORIGIN=http://localhost:3000
```

### 3. Setup Database

Pastikan MySQL sudah berjalan dan buat database:

```sql
CREATE DATABASE xinxun_news;
```

### 4. Run Migrations & Seed Data

Migrations akan berjalan otomatis saat aplikasi start. Untuk seed data:

```bash
go run seeds/seed.go
```

### 5. Run Application

```bash
go run cmd/main.go
```

Server akan berjalan di `http://localhost:8080`

## API Endpoints

### Public Endpoints

- `GET /v1/news` - List semua news (dengan pagination, search, filter)
- `GET /v1/:slug` - Get single news by slug
- `GET /v1/news/search?q=query` - Search news
- `GET /v1/news/featured` - Get featured news
- `GET /v1/categories` - List categories
- `GET /v1/xinxun/newest` - Get 3 newest published news

### Admin Endpoints (Protected)

- `POST /v1/admin/login` - Admin login
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```

- `POST /v1/admin/news` - Create news (requires JWT token)
- `PUT /v1/admin/news/:id` - Update news (requires JWT token)
- `DELETE /v1/admin/news/:id` - Delete news (requires JWT token)
- `POST /v1/admin/upload` - Upload image (requires JWT token)

### Publisher Endpoints (Protected)

- `POST /v1/publisher/login` - Publisher login
- `POST /v1/publisher/news` - Create news (auto pending, requires JWT token)
- `PUT /v1/publisher/news/:id` - Update news (requires JWT token)

## Authentication

Untuk mengakses admin endpoints, tambahkan header:

```
Authorization: Bearer <your-jwt-token>
```

## Default Admin Credentials

- Username: `admin`
- Password: `admin123`

**PENTING:** Ganti password default setelah deployment!

## Docker

Lihat `docker-compose.yml` di root project untuk setup dengan Docker.

