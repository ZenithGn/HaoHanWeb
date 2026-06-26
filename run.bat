@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo     HAO HAN WEB - START SYSTEM
echo ===================================================
echo.
echo Dang khoi dong Backend va Frontend trong cua so moi...
start "HaoHanWeb Backend" cmd /k "echo --- KHOI DONG BACKEND --- && cd backend && bundle exec rails s -p 3001"
start "HaoHanWeb Frontend" cmd /k "echo --- KHOI DONG FRONTEND --- && cd frontend && npm run dev"

echo.
echo Da kich hoat lenh khoi dong cho ca hai server!
echo - Backend: http://localhost:3001
echo - Frontend: http://localhost:3000
echo.
pause
