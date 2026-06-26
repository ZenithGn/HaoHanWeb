# Auto-run script for HaoHanWeb (PowerShell version)
# Runs safely without encoding issues

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "     HAO HAN WEB - START SYSTEM" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dang khoi dong Backend va Frontend trong cua so moi..." -ForegroundColor Cyan
Write-Host "Frontend se chay bang npm run dev de hien thi thay doi moi nhat." -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- KHOI DONG BACKEND ---' -ForegroundColor Yellow; cd backend; bundle exec rails s -p 3001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- KHOI DONG FRONTEND ---' -ForegroundColor Yellow; cd frontend; npm run dev"

Write-Host ""
Write-Host "Da kich hoat lenh khoi dong cho ca hai server!" -ForegroundColor Green
Write-Host " - Backend: http://localhost:3001" -ForegroundColor Gray
Write-Host " - Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "Nhan phim bat ky de thoat..."
[void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
