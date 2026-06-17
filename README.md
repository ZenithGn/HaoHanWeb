# HaoHanWeb

Website cho server Minecraft SMP (Survival Multiplayer) của bạn.

## Mô Tả Dự Án

HaoHanWeb là một ứng dụng web được xây dựng để quản lý và giới thiệu server Minecraft SMP. Dự án sử dụng kiến trúc **full-stack** hiện đại:

- **Frontend**: Next.js + React (TypeScript/JavaScript)
- **Backend**: Ruby on Rails
- **Database**: SQL Server (T-SQL)
- **Styling**: CSS
- **DevOps**: Docker

## Tech Stack

| Thành Phần | Công Nghệ | Tỷ Lệ |
|-----------|----------|-------|
| Backend | Ruby | 50.5% |
| Styling | CSS | 25.2% |
| Frontend | JavaScript | 17.8% |
| Database | T-SQL | 2.7% |
| DevOps | Docker | 1.8% |
| Shell Scripts | - | 1.5% |

## Yêu Cầu Hệ Thống

### Yêu Cầu Chung
- Git
- Node.js 18+ (cho frontend)
- Ruby 3.0+ (cho backend)
- Docker (tùy chọn, nhưng được khuyến nghị)

### Nếu không dùng Docker
- Rails 7+
- SQL Server hoặc PostgreSQL
- Bundler

## Cách Cài Đặt & Chạy

### Option 1: Sử dụng Docker (Khuyến Nghị)

```bash
# Clone repository
git clone https://github.com/ZenithGn/HaoHanWeb.git
cd HaoHanWeb

# Checkout branch rework_web
git checkout rework_web

# Build và chạy với Docker Compose
docker-compose up -d

# Ứng dụng sẽ có sẵn tại:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3000/api
```

### Option 2: Cài Đặt Thủ Công

#### Backend (Ruby on Rails)

```bash
# Vào thư mục backend
cd backend

# Cài đặt dependencies
bundle install

# Thiết lập database
bundle exec rails db:create
bundle exec rails db:migrate
bundle exec rails db:seed  # (nếu có seed data)

# Chạy Rails server
bundle exec rails s -p 3001
```

Backend sẽ chạy tại: `http://localhost:3001`

#### Frontend (Next.js)

```bash
# Vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install
# hoặc
yarn install
# hoặc
pnpm install

# Chạy development server
npm run dev
# hoặc
yarn dev
# hoặc
pnpm dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## Cấu Trúc Thư Mục

```
HaoHanWeb/
├── backend/           # Ruby on Rails API
│   ├── app/
│   ├── config/
│   ├── db/
│   ├── Gemfile
│   └── ...
├── frontend/          # Next.js Frontend
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── ...
├── docker-compose.yml # Docker configuration
├── Dockerfile
└── README.md
```

## Cấu Hình

### Backend
- Xem `backend/config/database.yml` để cấu hình database
- Xem `backend/config/secrets.yml` cho API keys và environment variables

### Frontend
- Xem `frontend/.env.local` cho environment variables
- Xem `frontend/next.config.js` cho Next.js configuration

## Environment Variables

### Backend (.env hoặc .env.local)
```
DATABASE_URL=your_database_url
RAILS_ENV=development
SECRET_KEY_BASE=your_secret_key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=HaoHanWeb
```

## Đóng Góp

Hãy tạo một pull request nếu bạn muốn đóng góp cho dự án!

1. Fork repository
2. Tạo branch cho feature của bạn (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request
