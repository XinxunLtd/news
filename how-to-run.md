# Panduan Deployment Xinxun News di VPS

Panduan lengkap untuk deploy aplikasi Xinxun News di VPS Ubuntu/Debian dari awal hingga production-ready dengan SSL.

## 📋 Prasyarat

- VPS dengan Ubuntu 20.04+ atau Debian 11+
- Akses root atau user dengan sudo privileges
- Domain name yang sudah diarahkan ke IP VPS
- Minimal 2GB RAM dan 20GB storage

## 🚀 Step 1: Setup Awal VPS

### 1.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Dependencies

```bash
# Install tools dasar
sudo apt install -y curl wget git build-essential

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verifikasi instalasi
docker --version
docker-compose --version
```

### 1.3 Setup Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (penting! lakukan sebelum enable)
sudo ufw allow 22/tcp

# Allow HTTP dan HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow port untuk aplikasi (jika perlu akses langsung)
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp

# Check status
sudo ufw status
```

## 🐳 Step 2: Clone Repository

```bash
# Buat direktori untuk aplikasi
cd /opt
sudo git clone https://github.com/XinxunLtd/news.git
cd news

# Atau jika sudah ada, pull latest changes
cd /opt/news
sudo git pull origin main
```

## ⚙️ Step 3: Setup Environment Variables

### 3.1 Backend Environment

```bash
cd /opt/news/backend
sudo nano .env
```

Isi dengan konfigurasi berikut:

```env
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_password_here
DB_NAME=xinxun_news
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
PORT=8080
CORS_ORIGIN=https://news.xinxun.us
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your_bucket_name
```

**PENTING:** Ganti semua nilai dengan data yang sesuai!

### 3.2 Docker Compose Environment

Buat file `.env` di root project untuk Docker Compose:

```bash
cd /opt/news
sudo nano .env
```

Isi dengan:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your_bucket_name
MYSQL_ROOT_PASSWORD=your_secure_password_here
```

Docker Compose akan otomatis membaca file `.env` ini.

### 3.3 Frontend Environment

```bash
cd /opt/news/frontend
sudo nano .env.local
```

Isi dengan:

```env
NEXT_PUBLIC_API_URL=https://api.news.xinxun.us/api
NEXT_PUBLIC_SITE_URL=https://news.xinxun.us
```


## 🔒 Step 4: Setup SSL dengan Let's Encrypt (Certbot)

### 4.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 4.2 Install Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx
```

### 4.3 Setup Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/news.xinxun.us
```

Isi dengan konfigurasi berikut (sesuaikan domain):

```nginx
# Frontend (Next.js)
server {
    listen 80;
    server_name news.xinxun.us;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api-news.xinxun.us;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/news.xinxun.us /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.4 Generate SSL Certificate

```bash
# Untuk frontend
sudo certbot --nginx -d news.xinxun.us

# Untuk backend API
sudo certbot --nginx -d api.news.xinxun.us

# Atau jika backend di path yang sama, cukup satu domain
```

Certbot akan otomatis:
- Generate SSL certificate
- Update Nginx configuration
- Setup auto-renewal

### 4.5 Update Nginx untuk HTTPS

Setelah SSL terpasang, update konfigurasi Nginx:

```bash
sudo nano /etc/nginx/sites-available/news.xinxun.us
```

Update menjadi:

```nginx
# Frontend (Next.js)
server {
    listen 80;
    server_name news.xinxun.us;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name news.xinxun.us;

    ssl_certificate /etc/letsencrypt/live/news.xinxun.us/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/news.xinxun.us/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.news.xinxun.us;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.news.xinxun.us;

    ssl_certificate /etc/letsencrypt/live/api.news.xinxun.us/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.news.xinxun.us/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Restart Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4.6 Setup Auto-Renewal SSL

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot sudah otomatis setup cron job untuk auto-renewal
# Cek dengan:
sudo systemctl status certbot.timer
```

## 🗄️ Step 5: Setup Database

### 5.1 Update Docker Compose untuk Production

```bash
cd /opt/news
sudo nano docker-compose.yml
```

Pastikan konfigurasi database aman:

```yaml
db:
  image: mysql:8.0
  container_name: xinxun_news_db
  restart: unless-stopped
  environment:
    MYSQL_ROOT_PASSWORD: your_secure_password_here
    MYSQL_DATABASE: xinxun_news
  volumes:
    - db_data:/var/lib/mysql
    - ./backend/db.sql:/docker-entrypoint-initdb.d/init.sql
  networks:
    - xinxun_network
  # Jangan expose port 3306 ke public di production
  # ports:
  #   - "3306:3306"  # Hapus ini untuk security
```

## 🚀 Step 6: Build dan Run Aplikasi

### 6.1 Build Docker Images

```bash
cd /opt/news
sudo docker-compose build --no-cache
```

### 6.2 Start Services

```bash
# Start semua services
sudo docker-compose up -d

# Check logs
sudo docker-compose logs -f

# Check status
sudo docker-compose ps
```

### 6.3 Verifikasi

```bash
# Check apakah semua container running
sudo docker ps

# Test frontend
curl http://localhost:3000

# Test backend
curl http://localhost:8080/health

# Test dari browser
# https://news.xinxun.us
```

## 🔧 Step 7: Setup Systemd Service (Opsional)

Untuk auto-start saat reboot:

```bash
sudo nano /etc/systemd/system/xinxun-news.service
```

Isi dengan:

```ini
[Unit]
Description=Xinxun News Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/news
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable xinxun-news.service
sudo systemctl start xinxun-news.service
```

## 📊 Step 8: Monitoring dan Maintenance

### 8.1 Check Logs

```bash
# Semua services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f backend
sudo docker-compose logs -f frontend
sudo docker-compose logs -f db
```

### 8.2 Backup Database

```bash
# Create backup script
sudo nano /opt/news/backup-db.sh
```

Isi dengan:

```bash
#!/bin/bash
BACKUP_DIR="/opt/news/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker exec xinxun_news_db mysqldump -u root -p$MYSQL_ROOT_PASSWORD xinxun_news > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

Make executable:

```bash
chmod +x /opt/news/backup-db.sh
```

Setup cron untuk auto-backup:

```bash
sudo crontab -e
```

Tambahkan:

```
0 2 * * * /opt/news/backup-db.sh
```

### 8.3 Update Aplikasi

```bash
cd /opt/news

# Pull latest changes
sudo git pull origin main

# Rebuild dan restart
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

## 🔐 Step 9: Security Best Practices

### 9.1 Update Default Admin Password

Setelah pertama kali login, segera ganti password admin default.

### 9.2 Setup Fail2Ban (Opsional)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 9.3 Regular Updates

```bash
# Update system secara berkala
sudo apt update && sudo apt upgrade -y

# Update Docker images
sudo docker-compose pull
sudo docker-compose up -d
```

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check database logs
sudo docker-compose logs db

# Check database container
sudo docker exec -it xinxun_news_db mysql -u root -p
```

### Port Already in Use

```bash
# Check port usage
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8080

# Kill process jika perlu
sudo kill -9 <PID>
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx config
sudo nginx -t
```

### Docker Issues

```bash
# Clean up Docker
sudo docker system prune -a

# Restart Docker
sudo systemctl restart docker
```

## 📝 Checklist Deployment

- [ ] VPS setup dan update
- [ ] Docker & Docker Compose installed
- [ ] Firewall configured
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] Nginx installed dan configured
- [ ] SSL certificate generated
- [ ] Docker containers built dan running
- [ ] Database initialized
- [ ] Frontend accessible via HTTPS
- [ ] Backend API accessible via HTTPS
- [ ] Admin login tested
- [ ] Backup script configured
- [ ] Systemd service configured (optional)
- [ ] Monitoring setup

## 🔗 Useful Commands

```bash
# Start services
sudo docker-compose up -d

# Stop services
sudo docker-compose down

# View logs
sudo docker-compose logs -f

# Restart specific service
sudo docker-compose restart backend

# Check container status
sudo docker-compose ps

# Access database
sudo docker exec -it xinxun_news_db mysql -u root -p

# Access backend container
sudo docker exec -it xinxun_news_backend sh

# Access frontend container
sudo docker exec -it xinxun_news_frontend sh
```

## 📞 Support

Jika ada masalah, check:
1. Docker logs: `sudo docker-compose logs -f`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. System logs: `sudo journalctl -xe`

---

**Selamat! Aplikasi Xinxun News sudah berjalan di production! 🎉**

