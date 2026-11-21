# Auto-build & Run script for HaoHanWeb (PowerShell version)
# Supports Rust (Axum + SQLite WAL) backend and Next.js frontend

$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$BackendTestBuildScript = Join-Path $BackendDir "scripts\test_and_build.ps1"
$BackendReleaseExe = Join-Path $BackendDir "target\release\haohan-backend.exe"

function Start-BackendServer {
    if (Test-Path $BackendReleaseExe) {
        Start-Process powershell -WorkingDirectory $BackendDir -ArgumentList @(
            "-NoExit",
            "-Command",
            "Write-Host '--- KHOI DONG BACKEND RUST (RELEASE) ---' -ForegroundColor Yellow; & '.\target\release\haohan-backend.exe'"
        )
    } else {
        Start-Process powershell -WorkingDirectory $BackendDir -ArgumentList @(
            "-NoExit",
            "-Command",
            "Write-Host '--- KHOI DONG BACKEND RUST (CARGO RUN) ---' -ForegroundColor Yellow; cargo run"
        )
    }
}

function Start-FrontendServer {
    Start-Process powershell -WorkingDirectory $FrontendDir -ArgumentList @(
        "-NoExit",
        "-Command",
        "Write-Host '--- KHOI DONG FRONTEND (NEXT.JS) ---' -ForegroundColor Yellow; npm run dev"
    )
}

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "     HAO HAN WEB - AUTOMATIC BUILD & RUN SYSTEM" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vui long chon che do:" -ForegroundColor White
Write-Host "[1] Build toan bo he thong (Local: Rust + Next.js) - Mac dinh" -ForegroundColor Green
Write-Host "[2] Build toan bo he thong (Docker Compose)" -ForegroundColor Yellow
Write-Host "[3] Chi Build & Test Backend (Rust)" -ForegroundColor Blue
Write-Host "[4] Chi Build Frontend (Next.js)" -ForegroundColor Magenta
Write-Host "[5] Chi khoi dong he thong (Khong build lai)" -ForegroundColor Cyan
Write-Host ""

$opt = Read-Host "Chon [1-5] (Mac dinh la 1)"
if ([string]::IsNullOrWhiteSpace($opt)) {
    $opt = "1"
}

switch ($opt) {
    "1" {
        Write-Host "`n===================================================" -ForegroundColor Cyan
        Write-Host "[1/2] Dang chay Unit Tests & Build Backend (Rust)..." -ForegroundColor Yellow
        Write-Host "===================================================" -ForegroundColor Cyan

        & powershell -ExecutionPolicy Bypass -File $BackendTestBuildScript
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[LOI] Test hoac Build Backend Rust that bai!" -ForegroundColor Red
            break
        }

        Write-Host "`n===================================================" -ForegroundColor Cyan
        Write-Host "[2/2] Dang build Frontend (Next.js)..." -ForegroundColor Yellow
        Write-Host "===================================================" -ForegroundColor Cyan

        Push-Location $FrontendDir
        & npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[LOI] npm install that bai!" -ForegroundColor Red
            Pop-Location
            break
        }
        Write-Host "Dang xoa cache build cu cua Frontend..." -ForegroundColor Gray
        Remove-Item -Recurse -Force .next, .turbo -ErrorAction SilentlyContinue
        & npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[LOI] npm run build that bai!" -ForegroundColor Red
            Pop-Location
            break
        }
        Pop-Location

        Write-Host "`n===================================================" -ForegroundColor Green
        Write-Host "[THANH CONG] Build hoan tat thanh cong!" -ForegroundColor Green
        Write-Host "===================================================" -ForegroundColor Green

        $run = Read-Host "Ban co muon khoi dong ca Backend va Frontend ngay bay gio? [Y/N] (Mac dinh la Y)"
        if ([string]::IsNullOrWhiteSpace($run)) { $run = "Y" }

        if ($run -eq "Y" -or $run -eq "y") {
            Write-Host "Dang khoi dong Backend (Rust) va Frontend (Next.js) trong cua so moi..." -ForegroundColor Cyan
            Start-BackendServer
            Start-FrontendServer
            Write-Host " - Backend : http://localhost:3001" -ForegroundColor Gray
            Write-Host " - Frontend: http://localhost:3000" -ForegroundColor Gray
        } else {
            Write-Host "De chay ung dung thu cong:" -ForegroundColor White
            Write-Host " - Backend : cd backend; .\target\release\haohan-backend.exe (hoac cargo run)" -ForegroundColor Gray
            Write-Host " - Frontend: cd frontend; npm run dev" -ForegroundColor Gray
        }
    }
    "2" {
        Write-Host "`n===================================================" -ForegroundColor Cyan
        Write-Host "Dang build he thong bang Docker Compose..." -ForegroundColor Yellow
        Write-Host "===================================================" -ForegroundColor Cyan
        Push-Location $RootDir
        & docker compose build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[LOI] Docker build that bai!" -ForegroundColor Red
        } else {
            Write-Host "`n[THANH CONG] Docker build thanh cong!" -ForegroundColor Green
            $run = Read-Host "Ban co muon khoi dong Docker Containers ngay bay gio? [Y/N] (Mac dinh la Y)"
            if ([string]::IsNullOrWhiteSpace($run)) { $run = "Y" }
            if ($run -eq "Y" -or $run -eq "y") {
                & docker compose up -d
                Write-Host "Da khoi dong cac Docker Containers!" -ForegroundColor Green
            }
        }
        Pop-Location
    }
    "3" {
        Write-Host "`n===================================================" -ForegroundColor Cyan
        Write-Host "Dang chay Unit Tests & Build Backend (Rust)..." -ForegroundColor Yellow
        Write-Host "===================================================" -ForegroundColor Cyan

        & powershell -ExecutionPolicy Bypass -File $BackendTestBuildScript
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[LOI] Test hoac Build Backend Rust that bai!" -ForegroundColor Red
        } else {
            Write-Host "`n[THANH CONG] Build Backend Rust hoan tat!" -ForegroundColor Green

            $run = Read-Host "Ban co muon khoi dong Backend ngay bay gio? [Y/N] (Mac dinh la Y)"
            if ([string]::IsNullOrWhiteSpace($run)) { $run = "Y" }
            if ($run -eq "Y" -or $run -eq "y") {
                Start-BackendServer
                Write-Host " - Backend: http://localhost:3001" -ForegroundColor Gray
            }
        }
    }
    "4" {
        Write-Host "`n===================================================" -ForegroundColor Cyan
        Write-Host "Dang build Frontend (Next.js)..." -ForegroundColor Yellow
        Write-Host "===================================================" -ForegroundColor Cyan
        Push-Location $FrontendDir
        & npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[LOI] npm install that bai!" -ForegroundColor Red
            Pop-Location
            break
        }
        Write-Host "Dang xoa cache build cu cua Frontend..." -ForegroundColor Gray
        Remove-Item -Recurse -Force .next, .turbo -ErrorAction SilentlyContinue
        & npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[LOI] npm run build that bai!" -ForegroundColor Red
        } else {
            Write-Host "`n[THANH CONG] Build Frontend hoan tat!" -ForegroundColor Green

            $run = Read-Host "Ban co muon khoi dong Frontend ngay bay gio? [Y/N] (Mac dinh la Y)"
            if ([string]::IsNullOrWhiteSpace($run)) { $run = "Y" }
            if ($run -eq "Y" -or $run -eq "y") {
                Start-FrontendServer
                Write-Host " - Frontend: http://localhost:3000" -ForegroundColor Gray
            }
        }
        Pop-Location
    }
    "5" {
        Write-Host "`n===================================================" -ForegroundColor Cyan
        Write-Host "Dang khoi dong Backend (Rust) va Frontend (Next.js) trong cua so moi..." -ForegroundColor Cyan
        Write-Host "===================================================" -ForegroundColor Cyan
        Start-BackendServer
        Start-FrontendServer
        Write-Host " - Backend : http://localhost:3001" -ForegroundColor Gray
        Write-Host " - Frontend: http://localhost:3000" -ForegroundColor Gray
    }
    default {
        Write-Host "Lua chon khong hop le." -ForegroundColor Red
    }
}

Write-Host "`nNhan phim bat ky de thoat..."
[void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
