$ErrorActionPreference = 'Continue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptDir
Set-Location $BackendDir

$BannerWidth = 91
$TestStopwatch = [System.Diagnostics.Stopwatch]::StartNew()

function Write-CenteredBanner {
    param(
        [string]$Title,
        [string]$Color = 'White'
    )
    $inner = " $Title "
    if ($inner.Length -ge $BannerWidth) {
        Write-Host $inner -ForegroundColor $Color
        return
    }
    $totalPad = $BannerWidth - $inner.Length
    $leftPad = [int][Math]::Floor($totalPad / 2)
    $rightPad = $totalPad - $leftPad
    $line = ('=' * $leftPad) + $inner + ('=' * $rightPad)
    Write-Host $line -ForegroundColor $Color
}

$RustcVer = (& rustc --version 2>$null | Out-String).Trim()
$CargoVer = (& cargo --version 2>$null | Out-String).Trim()
$OsDesc = [System.Runtime.InteropServices.RuntimeInformation]::OSDescription.Trim()

Write-CenteredBanner -Title "test session starts" -Color 'White'
Write-Host "platform $OsDesc -- $RustcVer, $CargoVer -- $BackendDir"

# Run cargo test with merged stdout+stderr so "Running <suite>" precedes its tests chronologically
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'cmd.exe'
$psi.Arguments = '/c cargo test --color=never 2>&1'
$psi.WorkingDirectory = $BackendDir
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi
[void]$proc.Start()

$stdoutTask = $proc.StandardOutput.ReadToEndAsync()
$stderrTask = $proc.StandardError.ReadToEndAsync()
$proc.WaitForExit()
$TestExitCode = $proc.ExitCode
$TestStopwatch.Stop()

$RawStdout = $stdoutTask.Result
$RawStderr = $stderrTask.Result
$AllLines = @()
if ($RawStdout) { $AllLines += ($RawStdout -split "`r?`n") }
if ($RawStderr) { $AllLines += ($RawStderr -split "`r?`n") }

$CurrentSuite = 'unknown'
$Results = New-Object System.Collections.Generic.List[object]

foreach ($line in $AllLines) {
    if ($line -cmatch '^\s*Running\s+(?:unittests\s+)?([^\s(]+\.rs)\s+\(') {
        $suitePath = $matches[1] -replace '\\', '/'
        $CurrentSuite = $suitePath
        continue
    }
    if ($line -cmatch '^\s*Doc-tests\s+([^\s]+)') {
        $CurrentSuite = "doc-tests/$($matches[1])"
        continue
    }
    if ($line -cmatch '^test\s+(.+?)\s+\.\.\.\s+(ok|FAILED|ignored)\s*$') {
        $Results.Add([PSCustomObject]@{
            Suite  = $CurrentSuite
            Name   = $matches[1].Trim()
            Status = $matches[2]
        })
    }
}

$Total = $Results.Count
Write-Host "collected $Total items"
Write-Host ""

$Passed = 0
$Failed = 0
$Ignored = 0
$Idx = 0

foreach ($item in $Results) {
    $Idx++
    $Pct = if ($Total -gt 0) { [int][Math]::Floor(($Idx * 100) / $Total) } else { 100 }
    $PctText = ('[{0,3}%]' -f $Pct)

    $StatusWord = switch ($item.Status) {
        'ok'      { $Passed++; 'PASSED' }
        'FAILED'  { $Failed++; 'FAILED' }
        'ignored' { $Ignored++; 'SKIPPED' }
    }
    $StatusColor = switch ($item.Status) {
        'ok'      { 'Green' }
        'FAILED'  { 'Red' }
        'ignored' { 'Yellow' }
    }

    $Prefix = "$($item.Suite)::$($item.Name) "
    $UsedLen = $Prefix.Length + $StatusWord.Length
    $Gap = [Math]::Max(1, $BannerWidth - $UsedLen - $PctText.Length)

    Write-Host -NoNewline $Prefix
    Write-Host -NoNewline $StatusWord -ForegroundColor $StatusColor
    Write-Host -NoNewline (' ' * $Gap)
    Write-Host $PctText -ForegroundColor Cyan
}

Write-Host ""

if ($TestExitCode -ne 0 -or $Failed -gt 0 -or $Total -eq 0) {
    if ($RawStdout) {
        $inFailures = $false
        foreach ($line in ($RawStdout -split "`r?`n")) {
            if ($line -match '^failures:\s*$') { $inFailures = $true }
            if ($inFailures) { Write-Host $line -ForegroundColor Red }
        }
    }
    if ($TestExitCode -ne 0 -and $Failed -eq 0) {
        Write-Host $RawStderr -ForegroundColor Red
    }

    $ElapsedStr = ('{0:F2}s' -f $TestStopwatch.Elapsed.TotalSeconds)
    if ($Total -eq 0) {
        Write-CenteredBanner -Title "0 tests collected (exit $TestExitCode) in $ElapsedStr" -Color 'Red'
    } else {
        Write-CenteredBanner -Title "$Failed failed, $Passed passed in $ElapsedStr" -Color 'Red'
    }
    exit 1
}

$ElapsedStr = ('{0:F2}s' -f $TestStopwatch.Elapsed.TotalSeconds)
$SummaryTitle = if ($Ignored -gt 0) {
    "$Passed passed, $Ignored skipped in $ElapsedStr"
} else {
    "$Passed passed in $ElapsedStr"
}
Write-CenteredBanner -Title $SummaryTitle -Color 'Green'
Write-Host ""

# Step 2: Format check
Write-Host "[2/4] Running cargo fmt --check..." -ForegroundColor Cyan
& cargo fmt --check
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: cargo fmt --check failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

# Step 3: Clippy strict check
Write-Host "[3/4] Running cargo clippy --all-targets -- -D warnings..." -ForegroundColor Cyan
& cargo clippy --all-targets -- -D warnings
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: cargo clippy failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

# Step 4: Release build
Write-Host "[4/4] Running cargo build --release..." -ForegroundColor Cyan
$BuildStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
& cargo build --release
$BuildExit = $LASTEXITCODE
$BuildStopwatch.Stop()
if ($BuildExit -ne 0) {
    Write-Host "ERROR: cargo build --release failed." -ForegroundColor Red
    exit $BuildExit
}

$ExeName = if ($IsWindows -or $env:OS -eq 'Windows_NT') { 'haohan-backend.exe' } else { 'haohan-backend' }
$BinPath = Join-Path $BackendDir "target\release\$ExeName"
if (-not (Test-Path $BinPath)) {
    Write-Host "ERROR: Release binary not found at $BinPath" -ForegroundColor Red
    exit 1
}

$BinInfo = Get-Item $BinPath
$SizeBytes = $BinInfo.Length
$SizeMb = '{0:F2}' -f ($SizeBytes / 1MB)
$BuildSecs = '{0:F2}s' -f $BuildStopwatch.Elapsed.TotalSeconds

Write-Host ""
Write-CenteredBanner -Title "CI/CD BUILD SUMMARY" -Color 'Green'
Write-Host "Tests passed   : $Passed / $Total ($ElapsedStr)"
Write-Host "Fmt & Clippy   : OK (-D warnings)"
Write-Host "Release build  : OK ($BuildSecs)"
Write-Host "Release binary : $($BinInfo.FullName)"
Write-Host "Binary size    : $SizeBytes bytes ($SizeMb MB)"
Write-CenteredBanner -Title "ALL CHECKS PASSED" -Color 'Green'
exit 0
