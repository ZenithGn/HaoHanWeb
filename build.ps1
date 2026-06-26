# Auto-build & Run script for HaoHanWeb (PowerShell version)
# Runs safely without encoding issues

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "     HAO HAN WEB - AUTOMATIC BUILD & RUN SYSTEM" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vui loi chon che do:" -ForegroundColor White
Write-Host "[1] Build toan bo he thong (Local) - Mac dinh" -ForegroundColor Green
Write-Host "[2] Build toan bo he thong (Docker Compose)" -ForegroundColor Yellow
Write-Host "[3] Chi Build Backend (Rails)" -ForegroundColor Blue
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
        Write-Host "[1/2] Dang build Backend (Ruby on Rails)..." -ForegroundColor Yellow
        Write-Host "===================================================" -ForegroundColor Cyan
        
        Push-Location backend
        & bundle install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[LOI] bundle install that bai!" -ForegroundColor Red
            Pop-Location
            break
        }
        Write-Host "Cau hinh Database..." -ForegroundColor Gray
        & bundle exec rails db:prepare
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[CANH BAO] rails db:prepare that bai! (Bo qua neu chua cau hinh DB hoac DB chua chay)" -ForegroundColor DarkYellow
        }
        Pop-Location

        Write-Host "`n===================================================" -ForegroundColor Cyan
        Write-Host "[2/2] Dang build Frontend (Next.js)..." -ForegroundColor Yellow
        Write-Host "===================================================" -ForegroundColor Cyan
        
        Push-Location frontend
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
            Write-Host "Dang khoi dong Backend va Frontend trong cua so moi..." -ForegroundColor Cyan
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- KHOI DONG BACKEND ---' -ForegroundColor Yellow; cd backend; bundle exec rails s -p 3001"
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- KHOI DONG FRONTEND ---' -ForegroundColor Yellow; cd frontend; npm run dev"
        } else {
            Write-Host "De chay ung dung thu cong:" -ForegroundColor White
            Write-Host " - Backend: cd backend; bundle exec rails s -p 3001" -ForegroundColor Gray
            Write-Host " - Frontend: cd frontend; npm run dev" -ForegroundColor Gray
        }
    }
    "2" {
        Write-Host "`n===================================================" -ForegroundColor Cyan
        Write-Host "Dang build he thong bang Docker Compose..." -ForegroundColor Yellow
        Write-Host "===================================================" -ForegroundColor Cyan
        & docker-compose build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[LOI] Docker build that bai!" -ForegroundColor Red
        } else {
            Write-Host "`n[THANH CONG] Docker build thanh cong!" -ForegroundColor Green
            $run = Read-Host "Ban co muon khoi dong Docker Containers ngay bay gio? [Y/N] (Mac dinh la Y)"
            if ([string]::IsNullOrWhiteSpace($run)) { $run = "Y" }
            if ($run -eq "Y" -or $run -eq "y") {
                & docker-compose up -d
                Write-Host "Da khoi dong cac Docker Containers!" -ForegroundColor Green
            }
        }
    }
    "3" {
        Write-Host "`n===================================================" -ForegroundColor Cyan
        Write-Host "Dang build Backend (Ruby on Rails)..." -ForegroundColor Yellow
        Write-Host "===================================================" -ForegroundColor Cyan
        Push-Location backend
        & bundle install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[LOI] bundle install that bai!" -ForegroundColor Red
        } else {
            & bundle exec rails db:prepare
            Write-Host "`n[THANH CONG] Build Backend hoan tat!" -ForegroundColor Green
            
            $run = Read-Host "Ban co muon khoi dong Backend ngay bay gio? [Y/N] (Mac dinh la Y)"
            if ([string]::IsNullOrWhiteSpace($run)) { $run = "Y" }
            if ($run -eq "Y" -or $run -eq "y") {
                Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- KHOI DONG BACKEND ---' -ForegroundColor Yellow; cd backend; bundle exec rails s -p 3001"
            }
        }
        Pop-Location
    }
    "4" {
        Write-Host "`n===================================================" -ForegroundColor Cyan
        Write-Host "Dang build Frontend (Next.js)..." -ForegroundColor Yellow
        Write-Host "===================================================" -ForegroundColor Cyan
        Push-Location frontend
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
                Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- KHOI DONG FRONTEND ---' -ForegroundColor Yellow; cd frontend; npm run dev"
            }
        }
        Pop-Location
    }
    "5" {
        Write-Host "`n===================================================" -ForegroundColor Cyan
        Write-Host "Dang khoi dong Backend va Frontend trong cua so moi..." -ForegroundColor Cyan
        Write-Host "===================================================" -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- KHOI DONG BACKEND ---' -ForegroundColor Yellow; cd backend; bundle exec rails s -p 3001"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- KHOI DONG FRONTEND ---' -ForegroundColor Yellow; cd frontend; npm run dev"
    }
    default {
        Write-Host "Lua chon khong hop le." -ForegroundColor Red
    }
}

Write-Host "`nNhan phim bat ky de thoat..."
[void]$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
