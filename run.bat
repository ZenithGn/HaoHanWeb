@echo off
setlocal enabledelayedexpansion
set "ROOT_DIR=%~dp0"

echo ===================================================
echo     HAO HAN WEB - START SYSTEM (RUST + NEXT.JS)
echo ===================================================
echo.
echo Dang khoi dong Backend (Rust) va Frontend (Next.js) trong cua so moi...
echo Frontend se chay bang npm run dev de hien thi thay doi moi nhat.

if exist "%ROOT_DIR%backend\target\release\haohan-backend.exe" (
    echo [INFO] Phat hien ban release backend: backend\target\release\haohan-backend.exe
    start "HaoHanWeb Backend (Rust)" /D "%ROOT_DIR%backend" cmd /k "echo --- KHOI DONG BACKEND RUST (RELEASE) --- && target\release\haohan-backend.exe"
) else (
    echo [INFO] Chua co ban release, dang khoi dong backend bang cargo run...
    start "HaoHanWeb Backend (Rust)" /D "%ROOT_DIR%backend" cmd /k "echo --- KHOI DONG BACKEND RUST (CARGO RUN) --- && cargo run"
)

start "HaoHanWeb Frontend (Next.js)" /D "%ROOT_DIR%frontend" cmd /k "echo --- KHOI DONG FRONTEND --- && npm run dev"

echo.
echo Da kich hoat lenh khoi dong cho ca hai server!
echo - Backend : http://localhost:3001
echo - Frontend: http://localhost:3000
echo.
pause
