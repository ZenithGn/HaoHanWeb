@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo     HAO HAN WEB - AUTOMATIC BUILD & RUN SYSTEM
echo ===================================================
echo.
echo Vui long chon che do:
echo [1] Build toan bo he thong (Local) - Mac dinh
echo [2] Build toan bo he thong (Docker Compose)
echo [3] Chi Build Backend (Rails)
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
echo [1/2] Dang build Backend (Ruby on Rails)...
echo ===================================================
cd backend
call bundle install
if %ERRORLEVEL% neq 0 (
    echo [LOI] bundle install that bai!
    cd ..
    goto end
)
echo Cau hinh Database...
call bundle exec rails db:prepare
if %ERRORLEVEL% neq 0 (
    echo [CANH BAO] rails db:prepare that bai! (Bo qua neu chua cau hinh DB hoac DB chua chay)
)
cd ..

echo.
echo ===================================================
echo [2/2] Dang build Frontend (Next.js)...
echo ===================================================
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo [LOI] npm install that bai!
    cd ..
    goto end
)
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [LOI] npm run build that bai!
    cd ..
    goto end
)
cd ..

echo.
echo ===================================================
echo [THANH CONG] Build hoan tat thanh cong!
echo ===================================================
set /p run_opt="Ban co muon khoi dong ca Backend va Frontend ngay bay gio? [Y/N] (Mac dinh la Y): "
if "%run_opt%"=="" set run_opt=Y
if /I "%run_opt%"=="Y" (
    echo Dang khoi dong Backend va Frontend...
    start "HaoHanWeb Backend" cmd /k "echo --- KHOI DONG BACKEND --- && cd backend && bundle exec rails s -p 3001"
    start "HaoHanWeb Frontend" cmd /k "echo --- KHOI DONG FRONTEND --- && cd frontend && npm run start"
) else (
    echo De chay ung dung thu cong:
    echo - Backend: cd backend ^&^& bundle exec rails s -p 3001
    echo - Frontend: cd frontend ^&^& npm run start
)
goto end

:build_docker
echo.
echo ===================================================
echo Dang build he thong bang Docker Compose...
echo ===================================================
docker-compose build
if %ERRORLEVEL% neq 0 (
    echo [LOI] Docker build that bai!
    goto end
)
echo.
echo [THANH CONG] Docker build thanh cong!
set /p run_opt="Ban co muon khoi dong Docker Containers ngay bay gio? [Y/N] (Mac dinh la Y): "
if "%run_opt%"=="" set run_opt=Y
if /I "%run_opt%"=="Y" (
    docker-compose up -d
    echo Da khoi dong cac Docker Containers!
)
goto end

:build_backend
echo.
echo ===================================================
echo Dang build Backend (Ruby on Rails)...
echo ===================================================
cd backend
call bundle install
if %ERRORLEVEL% neq 0 (
    echo [LOI] bundle install that bai!
    cd ..
    goto end
)
call bundle exec rails db:prepare
cd ..
echo [THANH CONG] Build Backend hoan tat!
set /p run_opt="Ban co muon khoi dong Backend ngay bay gio? [Y/N] (Mac dinh la Y): "
if "%run_opt%"=="" set run_opt=Y
if /I "%run_opt%"=="Y" (
    start "HaoHanWeb Backend" cmd /k "echo --- KHOI DONG BACKEND --- && cd backend && bundle exec rails s -p 3001"
)
goto end

:build_frontend
echo.
echo ===================================================
echo Dang build Frontend (Next.js)...
echo ===================================================
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo [LOI] npm install that bai!
    cd ..
    goto end
)
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [LOI] npm run build that bai!
    cd ..
    goto end
)
cd ..
echo [THANH CONG] Build Frontend hoan tat!
set /p run_opt="Ban co muon khoi dong Frontend ngay bay gio? [Y/N] (Mac dinh la Y): "
if "%run_opt%"=="" set run_opt=Y
if /I "%run_opt%"=="Y" (
    start "HaoHanWeb Frontend" cmd /k "echo --- KHOI DONG FRONTEND --- && cd frontend && npm run start"
)
goto end

:run_system
echo.
echo ===================================================
echo Dang khoi dong Backend va Frontend...
echo ===================================================
start "HaoHanWeb Backend" cmd /k "echo --- KHOI DONG BACKEND --- && cd backend && bundle exec rails s -p 3001"
start "HaoHanWeb Frontend" cmd /k "echo --- KHOI DONG FRONTEND --- && cd frontend && npm run start"
goto end

:error_choice
echo Lua chon khong hop le.
goto end

:end
pause
