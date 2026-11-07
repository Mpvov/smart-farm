# Script kiểm tra hợp lệ toàn diện của Repository (Agent & Team)
# Bắt buộc trả về exit 0 trước khi hoàn thành task hoặc commit

$ErrorActionPreference = "Stop"
$failures = @()

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   RUNNING SMART FARM REPO VALIDATION    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. KIỂM TRA SECRET & FILE .ENV
Write-Host "`n[1/3] Checking Secret & .env safety..." -ForegroundColor Yellow
$trackedEnv = git ls-files .env 2>$null
if ($trackedEnv) {
    $failures += "[ERROR] .env file is tracked in git! Must untrack immediately: git rm --cached .env"
} else {
    Write-Host "  -> OK: .env is not tracked in git." -ForegroundColor Green
}

if (-not (Test-Path ".env.example")) {
    $failures += "[ERROR] Missing .env.example template!"
} else {
    Write-Host "  -> OK: .env.example exists." -ForegroundColor Green
}

# 2. KIỂM TRA CONTRACT SAMPLES
Write-Host "`n[2/3] Running Contract Tests..." -ForegroundColor Yellow
try {
    $pyOutput = python contracts/test_contracts.py 2>&1
    if ($LASTEXITCODE -ne 0) {
        $failures += "[ERROR] Contract test failed:`n$pyOutput"
    } else {
        Write-Host "  -> OK: All UART and MQTT contracts verified." -ForegroundColor Green
    }
} catch {
    $failures += "[ERROR] Could not execute contracts/test_contracts.py: $_"
}

# 3. KIỂM TRA CẤU TRÚC FILE BẮT BUỘC
Write-Host "`n[3/3] Checking Required Files & Architecture Structure..." -ForegroundColor Yellow
$requiredFiles = @(
    "AGENTS.md",
    "CLAUDE.md",
    "README.md",
    ".gitignore",
    ".env.example",
    "contracts/uart.md",
    "contracts/mqtt.md",
    "contracts/test_contracts.py",
    "docs/ARCHITECTURE.md",
    "docs/USE_CASES.md",
    "docs/KNOWLEDGE.md",
    "docs/PROGRESS.md",
    "docs/decisions/0001-database.md",
    "frontend/AGENTS.md",
    "backend/AGENTS.md",
    "gateway/AGENTS.md"
)

foreach ($f in $requiredFiles) {
    if (-not (Test-Path $f)) {
        $failures += "[ERROR] Missing required file: $f"
    }
}

if ($failures.Count -eq 0) {
    Write-Host "  -> OK: All required files and directories present." -ForegroundColor Green
    Write-Host "`n=========================================" -ForegroundColor Green
    Write-Host " [PASS] ALL CHECKS PASSED SUCCESSFULLY! " -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n=========================================" -ForegroundColor Red
    Write-Host " [FAIL] REPOSITORY CHECK FAILED!        " -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    foreach ($err in $failures) {
        Write-Host $err -ForegroundColor Red
    }
    exit 1
}
