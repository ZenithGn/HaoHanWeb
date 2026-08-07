<div align="center">

# HaoHanWeb

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Ruby on Rails](https://img.shields.io/badge/Rails-8.0-CC0000?style=for-the-badge&logo=rubyonrails&logoColor=white)](https://rubyonrails.org/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC292B?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

Ngôn ngữ: Tiếng Việt

</div>

## Giới thiệu

**HaoHanWeb** là hệ thống trang web chính thức dành cho cộng đồng Minecraft HaoHan SMP. Dự án bao gồm frontend Next.js hiện đại và backend Ruby on Rails API mạnh mẽ, sử dụng SQL Server làm cơ sở dữ liệu.

- **Frontend:** Next.js 16, React 19, Vanilla CSS với thiết kế hiện đại, responsive.
- **Backend:** Ruby on Rails 8 API cho hiệu năng tối ưu.
- **Database:** Microsoft SQL Server quản lý dữ liệu người chơi, giao dịch và hệ thống.
- **Tích hợp:** OAuth/Webhook Discord, thanh toán tự động PayOS, RCON điều khiển máy chủ Minecraft, xác thực an toàn bằng JWT.
- **Containerization:** Sẵn sàng triển khai nhanh qua Docker & Docker Compose.

## Cấu Trúc Dự Án

```text
HaoHanWeb/
├── backend/              # Rails API Backend
│   ├── app/
│   ├── config/
│   ├── db/
│   ├── Gemfile
│   └── Dockerfile
├── frontend/             # Next.js Frontend
│   ├── public/
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── .dockerignore
└── README.md
```

## Yêu Cầu

- **Node.js**: 20+ khuyến nghị cho frontend.
- **Ruby**: 3.4.x cho backend.
- **Bundler**: Cho quản lý Gem backend.
- **Docker Desktop**: Nếu chạy bằng Docker Compose.
- **SQL Server**: Phiên bản 2019/2022 hoặc container Docker.

## Cấu Hình Môi Trường

Tạo các file môi trường từ mẫu:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Biến Backend quan trọng (`backend/.env`):

```env
DB_HOST=localhost
DB_PORT=1433
DB_NAME=HaoHanDB
DB_USERNAME=sa
DB_PASSWORD=YourPassword123!

DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
RCON_HOST=127.0.0.1
RCON_PORT=25575
RCON_PASSWORD=your_rcon_password

PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

GAME_SERVER_TOKEN=your_token
JWT_SECRET=your_jwt_secret
```

### Biến Frontend quan trọng (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
BACKEND_URL=http://localhost:3001
```

## Chạy Nhanh Bằng Script Automate

Dự án đi kèm các script tự động hóa cho Windows:

### Build & Chạy bằng Script CMD

```bat
build.bat
```

Menu điều khiển sẽ xuất hiện:

```text
[1] Build toàn bộ hệ thống local
[2] Build bằng Docker Compose
[3] Chỉ build backend
[4] Chỉ build frontend
[5] Chỉ khởi động hệ thống, không build lại
```

### Build & Chạy bằng PowerShell

```powershell
.\build.ps1
```

Nếu gặp vấn đề về Execution Policy:

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

### Khởi Động Nhanh (Không Build)

```bat
run.bat
```

Địa chỉ truy cập mặc định:

- **Backend Rails API**: `http://localhost:3001`
- **Frontend Next.js**: `http://localhost:3000`

## Chạy Bằng Docker Compose

Dễ dàng khởi động SQL Server và Rails API với một lệnh:

```bash
docker compose up -d --build
```

Dừng dịch vụ:

```bash
docker compose down
```

## Thao Tác Thủ Công

### Backend (Ruby on Rails)

```bash
cd backend
bundle install
bin/rails db:create
bin/rails db:migrate
bin/rails server -p 3001
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Build production:

```bash
cd frontend
npm run build
npm run start
```
