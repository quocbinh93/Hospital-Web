# Hướng dẫn Triển khai Hệ thống Quản lý Phòng khám

## 🚀 Triển khai Local (Development)

### 1. Yêu cầu hệ thống
- Node.js v16+ 
- MongoDB v4.4+
- npm hoặc yarn

### 2. Cài đặt nhanh
```bash
# Clone project
git clone <repository-url>
cd clinic-management-system

# Chạy script cài đặt tự động
chmod +x setup.sh
./setup.sh

# Hoặc trên Windows
setup.bat
```

### 3. Cài đặt thủ công

#### Backend
```bash
cd server
npm install
cp .env.example .env
# Cập nhật thông tin trong file .env
npm run seed  # Khởi tạo dữ liệu mẫu
npm run dev
```

#### Frontend  
```bash
cd client
npm install
npm start
```

### 4. Truy cập ứng dụng
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- MongoDB: mongodb://localhost:27017

## 🐳 Triển khai với Docker

### 1. Sử dụng Docker Compose
```bash
# Build và chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

### 2. Build riêng lẻ
```bash
# Backend
cd server
docker build -t clinic-backend .
docker run -p 8080:8080 clinic-backend

# Frontend
cd client  
docker build -t clinic-frontend .
docker run -p 3000:3000 clinic-frontend
```

## ☁️ Triển khai Production

### 1. Heroku

#### Backend
```bash
# Tạo app Heroku
heroku create clinic-backend-api

# Thêm MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret
heroku config:set CLIENT_URL=https://your-frontend-domain.com

# Deploy
git subtree push --prefix server heroku main
```

#### Frontend
```bash
# Tạo app Heroku cho frontend
heroku create clinic-frontend-app

# Set build pack
heroku buildpacks:set mars/create-react-app

# Set environment
heroku config:set REACT_APP_API_URL=https://clinic-backend-api.herokuapp.com/api

# Deploy
git subtree push --prefix client heroku main
```

### 2. Vercel (Frontend)
```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Deploy từ thư mục client
cd client
vercel

# Set environment variables trong Vercel dashboard
REACT_APP_API_URL=https://your-backend-api.com/api
```

### 3. Railway (Backend)
```bash
# Cài đặt Railway CLI
npm i -g @railway/cli

# Login và init
railway login
railway init

# Deploy
railway up
```

### 4. AWS/DigitalOcean

#### Chuẩn bị server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Cài đặt PM2
sudo npm install -g pm2

# Cài đặt Nginx
sudo apt install nginx
```

#### Deploy Backend
```bash
# Clone code
git clone <repository-url>
cd clinic-management-system/server

# Cài đặt dependencies
npm install --production

# Tạo file .env production
cp .env.example .env
# Cập nhật các giá trị production

# Khởi tạo dữ liệu
npm run seed

# Chạy với PM2
pm2 start server.js --name "clinic-backend"
pm2 startup
pm2 save
```

#### Deploy Frontend
```bash
cd ../client

# Build production
npm install
npm run build

# Copy build files to nginx
sudo cp -r build/* /var/www/html/

# Cấu hình Nginx
sudo nano /etc/nginx/sites-available/default
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Restart Nginx
sudo systemctl restart nginx
```

## 🔒 SSL Certificate với Let's Encrypt
```bash
# Cài đặt Certbot
sudo apt install certbot python3-certbot-nginx

# Lấy certificate
sudo certbot --nginx -d your-domain.com

# Auto renewal
sudo crontab -e
# Thêm dòng: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring và Logging

### PM2 Monitoring
```bash
# Xem status
pm2 status

# Xem logs
pm2 logs

# Restart
pm2 restart clinic-backend

# Monitor
pm2 monit
```

### Database Backup
```bash
# MongoDB backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db clinic_management --out /backup/mongodb_$DATE
tar -zcvf /backup/mongodb_$DATE.tar.gz /backup/mongodb_$DATE
rm -rf /backup/mongodb_$DATE
```

## 🔧 Troubleshooting

### Common Issues

1. **Port đã được sử dụng**
```bash
# Kiểm tra port
sudo netstat -tulpn | grep :8080
# Kill process
sudo kill -9 <PID>
```

2. **MongoDB connection failed**
```bash
# Kiểm tra MongoDB status
sudo systemctl status mongod
# Restart MongoDB
sudo systemctl restart mongod
```

3. **CORS errors**
- Kiểm tra CLIENT_URL trong .env
- Đảm bảo frontend và backend đang chạy

4. **Memory issues**
```bash
# Increase Node.js memory
node --max-old-space-size=4096 server.js
```

### Health Checks
```bash
# Backend health
curl http://localhost:8080/api/health

# Database connection
mongo --eval "db.runCommand('ping')"
```

## 📋 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb://localhost:27017/clinic_management
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
CLIENT_URL=https://your-frontend-domain.com
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_APP_NAME=Clinic Management System
```

## 🔄 CI/CD với GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Deploy Backend
      run: |
        cd server
        npm install
        # Add deployment commands
        
    - name: Deploy Frontend  
      run: |
        cd client
        npm install
        npm run build
        # Add deployment commands
```
