Write-Host ">>> DANG DAY DU LIEU TU LOCAL LEN OVERLEAF..." -ForegroundColor Cyan
python "$PSScriptRoot\sync_overleaf.py" push
if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> HOAN TAT PUSH THANH CONG! Hay mo Overleaf de Recompile." -ForegroundColor Green
} else {
    Write-Host ">>> PUSH THAT BAI! Vui long kiem tra loi tren." -ForegroundColor Red
}
