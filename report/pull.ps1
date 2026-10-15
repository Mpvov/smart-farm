Write-Host ">>> DANG DONG BO DU LIEU TU OVERLEAF VE LOCAL..." -ForegroundColor Cyan
python "$PSScriptRoot\sync_overleaf.py" pull
if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> HOAN TAT PULL THANH CONG!" -ForegroundColor Green
} else {
    Write-Host ">>> PULL THAT BAI! Vui long kiem tra loi tren." -ForegroundColor Red
}
