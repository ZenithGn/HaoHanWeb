# Auto-run script for HaoHanWeb (PowerShell version)
# Starts Rust (Axum + SQLite WAL) backend and Next.js frontend

$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$BackendReleaseExe = Join-Path $BackendDir "target\release\haohan-backend.exe"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "     HAO HAN WEB - START SYSTEM (RUST + NEXT.JS)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dang khoi dong Backend (Rust) va Frontend (Next.js) trong cua so moi..." -ForegroundColor Cyan
Write-Host "Frontend se chay bang npm run dev de hien thi thay doi moi nhat." -ForegroundColor Gray

if (Test-Path $BackendReleaseExe) {
    Write-Host "[INFO] Phat hien ban release backend: backend\target\release\haohan-backend.exe" -ForegroundColor Green
    Start-Process powershell -WorkingDirectory $BackendDir -ArgumentList @(
        "-NoExit",
        "-Command",
        "Write-Host '--- KHOI DONG BACKEND RUST (RELEASE) ---' -ForegroundColor Yellow; & '.\target\release\haohan-backend.exe'"
    )
} else {
    Write-Host "[INFO] Chua co ban release, dang khoi dong backend bang cargo run..." -ForegroundColor DarkYellow
    Start-Process powershell -WorkingDirectory $BackendDir -ArgumentList @(
        "-NoExit",
        "-Command",
        "Write-Host '--- KHOI DONG BACKEND RUST (CARGO RUN) ---' -ForegroundColor Yellow; cargo run"
    )
}

Start-Process powershell -WorkingDirectory $FrontendDir -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host '--- KHOI DONG FRONTEND (NEXT.JS) ---' -ForegroundColor Yellow; npm run dev"
)

Write-Host ""
Write-Host "Da kich hoat lenh khoi dong cho ca hai server!" -ForegroundColor Green
Write-Host " - Backend : http://localhost:3001" -ForegroundColor Gray
Write-Host " - Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "Nhan phim bat ky de thoat..."
[void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
