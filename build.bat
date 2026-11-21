@echo off
setlocal enabledelayedexpansion
set "ROOT_DIR=%~dp0"

echo ===================================================
echo     HAO HAN WEB - AUTOMATIC BUILD ^& RUN SYSTEM
echo ===================================================
echo.
echo Vui long chon che do:
echo [1] Build toan bo he thong (Local: Rust + Next.js) - Mac dinh
echo [2] Build toan bo he thong (Docker Compose)
echo [3] Chi Build ^& Test Backend (Rust)
echo [4] Chi Build Frontend (Next.js)
echo [5] Chi khoi dong he thong (Khong build lai)
echo.
set /p opt="Chon [1-5] (Mac dinh la 1): "
if "%opt%"=="" set opt=1

if "%opt%"=="1" goto build_local
if "%opt%"=="2" goto build_docker
if "%opt%"=="3" goto build_backend
if "%opt%"=="4" goto build_frontend
if "%opt%"=="5" goto run_system
goto error_choice

:build_local
echo.
echo ===================================================
echo [1/2] Dang chay Unit Tests ^& Build Backend (Rust)...
echo ===================================================
powershell -ExecutionPolicy Bypass -File "%ROOT_DIR%backend\scripts\test_and_build.ps1"
if %ERRORLEVEL% neq 0 (
    echo [LOI] Test hoac Build Backend Rust that bai!
    goto end
)

echo.
echo ===================================================
echo [2/2] Dang build Frontend (Next.js)...
echo ===================================================
pushd "%ROOT_DIR%frontend"
call npm install
if %ERRORLEVEL% neq 0 (
    echo [LOI] npm install that bai!
    popd
    goto end
)
echo Dang xoa cache build cu cua Frontend...
if exist .next rmdir /s /q .next
if exist .turbo rmdir /s /q .turbo
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [LOI] npm run build that bai!
    popd
    goto end
)
popd

echo.
echo ===================================================
echo [THANH CONG] Build hoan tat thanh cong!
echo ===================================================
set /p run_opt="Ban co muon khoi dong ca Backend va Frontend ngay bay gio? [Y/N] (Mac dinh la Y): "
if "%run_opt%"=="" set run_opt=Y
if /I "%run_opt%"=="Y" (
    call :launch_both
) else (
    echo De chay ung dung thu cong:
    echo - Backend : cd backend ^&^& target\release\haohan-backend.exe ^(hoac cargo run^)
    echo - Frontend: cd frontend ^&^& npm run dev
)
goto end

:build_docker
echo.
echo ===================================================
echo Dang build he thong bang Docker Compose...
echo ===================================================
pushd "%ROOT_DIR%"
docker compose build
if %ERRORLEVEL% neq 0 (
    echo [LOI] Docker build that bai!
    popd
    goto end
)
echo.
echo [THANH CONG] Docker build thanh cong!
set /p run_opt="Ban co muon khoi dong Docker Containers ngay bay gio? [Y/N] (Mac dinh la Y): "
if "%run_opt%"=="" set run_opt=Y
if /I "%run_opt%"=="Y" (
    docker compose up -d
    echo Da khoi dong cac Docker Containers!
)
popd
goto end

:build_backend
echo.
echo ===================================================
echo Dang chay Unit Tests ^& Build Backend (Rust)...
echo ===================================================
powershell -ExecutionPolicy Bypass -File "%ROOT_DIR%backend\scripts\test_and_build.ps1"
if %ERRORLEVEL% neq 0 (
    echo [LOI] Test hoac Build Backend Rust that bai!
    goto end
)
echo [THANH CONG] Build Backend Rust hoan tat!
set /p run_opt="Ban co muon khoi dong Backend ngay bay gio? [Y/N] (Mac dinh la Y): "
if "%run_opt%"=="" set run_opt=Y
if /I "%run_opt%"=="Y" (
    call :launch_backend
)
goto end

:build_frontend
echo.
echo ===================================================
echo Dang build Frontend (Next.js)...
echo ===================================================
pushd "%ROOT_DIR%frontend"
call npm install
if %ERRORLEVEL% neq 0 (
    echo [LOI] npm install that bai!
    popd
    goto end
)
echo Dang xoa cache build cu cua Frontend...
if exist .next rmdir /s /q .next
if exist .turbo rmdir /s /q .turbo
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [LOI] npm run build that bai!
    popd
    goto end
)
popd
echo [THANH CONG] Build Frontend hoan tat!
set /p run_opt="Ban co muon khoi dong Frontend ngay bay gio? [Y/N] (Mac dinh la Y): "
if "%run_opt%"=="" set run_opt=Y
if /I "%run_opt%"=="Y" (
    call :launch_frontend
)
goto end

:run_system
echo.
echo ===================================================
echo Dang khoi dong Backend (Rust) va Frontend (Next.js)...
echo ===================================================
call :launch_both
goto end

:launch_backend
if exist "%ROOT_DIR%backend\target\release\haohan-backend.exe" (
    start "HaoHanWeb Backend (Rust)" /D "%ROOT_DIR%backend" cmd /k "echo --- KHOI DONG BACKEND RUST (RELEASE) --- && target\release\haohan-backend.exe"
) else (
    start "HaoHanWeb Backend (Rust)" /D "%ROOT_DIR%backend" cmd /k "echo --- KHOI DONG BACKEND RUST (CARGO RUN) --- && cargo run"
)
exit /b 0

:launch_frontend
start "HaoHanWeb Frontend (Next.js)" /D "%ROOT_DIR%frontend" cmd /k "echo --- KHOI DONG FRONTEND --- && npm run dev"
exit /b 0

:launch_both
call :launch_backend
call :launch_frontend
echo - Backend : http://localhost:3001
echo - Frontend: http://localhost:3000
exit /b 0

:error_choice
echo Lua chon khong hop le.
goto end

:end
pause
