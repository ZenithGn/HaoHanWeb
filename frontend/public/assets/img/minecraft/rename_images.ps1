$targetDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($targetDir)) { $targetDir = (Get-Location).Path }

Write-Host "Dang quet thu muc: $targetDir" -ForegroundColor Cyan
$confirm = Read-Host "Ban co chac chan muon doi ten hang loat file khong? (y/n)"
if ($confirm -notmatch "^[yY]$") { exit }

$imageExtensions = @('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tga', '.tiff')
$count = 0

$files = Get-ChildItem -Path $targetDir -Recurse -File | Where-Object {
    $_.Name -like "*Invicon_*" -and ($imageExtensions -contains $_.Extension.ToLower())
}

foreach ($file in $files) {
    $newName = $file.Name -replace "Invicon_", ""
    $newFullName = Join-Path -Path $file.DirectoryName -ChildPath $newName

    if (Test-Path -Path $newFullName) {
        Write-Host "[BO QUA] Loi: File '$newName' da ton tai." -ForegroundColor DarkYellow
    } else {
        Rename-Item -Path $file.FullName -NewName $newName -ErrorAction SilentlyContinue
        if ($?) {
            Write-Host "[THANH CONG] $($file.Name) -> $newName" -ForegroundColor Green
            $count++
        } else {
            Write-Host "[LOI] Khong the doi ten $($file.Name)" -ForegroundColor Red
        }
    }
}

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "Hoan tat! Da doi ten tong cong $count file." -ForegroundColor Green