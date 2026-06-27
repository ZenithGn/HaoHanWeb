# HaoHanWeb

Website cho cộng đồng Minecraft HaoHan SMP. Dự án gồm frontend Next.js và backend Ruby on Rails API, dùng SQL Server cho dữ liệu.

## Tổng Quan

- Frontend: Next.js 16, React 19, CSS thuần.
- Backend: Ruby on Rails 8 API.
- Database: Microsoft SQL Server.
- Tích hợp: Discord OAuth/Webhook, PayOS, RCON, JWT.
- Docker: `docker-compose.yml` hiện chạy SQL Server và backend.

## Cấu Trúc Dự Án

```text
HaoHanWeb/
├── backend/              # Rails API
│   ├── app/
│   ├── config/
│   ├── db/
│   ├── Gemfile
│   └── Dockerfile
├── frontend/             # Next.js app
│   ├── public/
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── .dockerignore
└── README.md
```

## Yêu Cầu

- Node.js 20+ khuyến nghị cho frontend.
- Ruby 3.4.x cho backend.
- Bundler.
- Docker Desktop nếu chạy bằng Docker.
- SQL Server hoặc container SQL Server từ `docker-compose.yml`.

## Cấu Hình Môi Trường

Tạo file môi trường từ file mẫu:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Các biến Backend quan trọng (`backend/.env`):

```env
DB_HOST=
DB_PORT=1433
DB_NAME=
DB_USERNAME=
DB_PASSWORD=

DISCORD_WEBHOOK_URL=
RCON_HOST=
RCON_PORT=25575
RCON_PASSWORD=

PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

GAME_SERVER_TOKEN=
JWT_SECRET=
```

Các biến Frontend quan trọng (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
BACKEND_URL=http://localhost:3001
```

## Setup Và Chạy Nhanh Bằng Script

Ở thư mục gốc dự án có sẵn script cho Windows:

- `build.bat`
- `build.ps1`
- `run.bat`
- `run.ps1`

### Build Và Chạy Bằng CMD

```bat
build.bat
```

Script sẽ hiện menu:

```text
[1] Build toàn bộ hệ thống local
[2] Build bằng Docker Compose
[3] Chỉ build backend
[4] Chỉ build frontend
[5] Chỉ khởi động hệ thống, không build lại
```

Sau khi build local xong, script có thể mở backend và frontend trong cửa sổ mới.

### Build Và Chạy Bằng PowerShell

```powershell
.\build.ps1
```

Nếu PowerShell chặn script, có thể chạy:

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

### Chỉ Khởi Động Project

CMD:

```bat
run.bat
```

PowerShell:

```powershell
.\run.ps1
```

Các script khởi động:

- Backend Rails: `http://localhost:3001`
- Frontend Next.js: `http://localhost:3000`

## Chạy Bằng Docker

Docker Compose hiện khởi động SQL Server và Rails backend:

```bash
docker compose up -d --build
```

Các service mặc định:

- SQL Server: `localhost:1433`
- Backend API: `http://localhost:3001`

Dừng container:

```bash
docker compose down
```

Dừng và xoá volume database local:

```bash
docker compose down -v
```

## Chạy Backend Thủ Công

```bash
cd backend
bundle install
bin/rails db:create
bin/rails db:migrate
bin/rails server -p 3001
```

Backend chạy tại:

```text
http://localhost:3001
```

## Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại:

```text
http://localhost:3000
```

Build production:

```bash
cd frontend
npm run build
npm run start
```

Kiểm tra lint:

```bash
cd frontend
npm run lint
```

## Scripts Hữu Ích

Backend:

```bash
cd backend
bin/rails db:migrate
bin/rails db:seed
bin/rails test
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

Docker:

```bash
docker compose up -d --build
docker compose logs -f backend
docker compose logs -f db
```

## Ghi Chú Phát Triển

- Không commit file `.env`, key, token, database dump hoặc file build.
- Giữ backend/.env.example và frontend/.env.example được cập nhật khi thêm biến môi trường mới.
- File SQL dump local như `HaoHanDB.sql` đang được ignore.
- Frontend assets nằm trong `frontend/public/assets`.
- Nội dung đa ngôn ngữ nằm trong `frontend/src/dictionaries`.

## Đóng Góp

1. Tạo branch mới cho thay đổi.
2. Chạy build/test phù hợp trước khi mở pull request.
3. Mô tả ngắn gọn thay đổi và ảnh hưởng nếu có.
