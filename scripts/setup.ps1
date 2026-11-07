# setup.ps1 - cai dat junction cho Claude Code va kich hoat Git hooks (.githooks)
#   powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
# ASCII-only: Windows PowerShell 5.1 doc file khong BOM theo ANSI.

$root = Split-Path -Parent $PSScriptRoot
New-Item -ItemType Directory -Force (Join-Path $root '.claude') | Out-Null
foreach ($name in 'skills','rules') {
  $src = Join-Path $root ".agents\$name"
  $dst = Join-Path $root ".claude\$name"
  New-Item -ItemType Directory -Force $src | Out-Null
  if (Test-Path $dst) {
    if ((Get-Item $dst -Force).LinkType -eq 'Junction') { Write-Host "OK $dst (da co)"; continue }
    Write-Host "FAIL $dst la thu muc that -> chuyen noi dung sang $src roi xoa $dst"; exit 1
  }
  New-Item -ItemType Junction -Path $dst -Target $src | Out-Null
  Write-Host "OK $dst -> $src"
}

git -C $root config core.hooksPath .githooks
if ($LASTEXITCODE -eq 0) {
  Write-Host "OK git core.hooksPath -> .githooks"
} else {
  Write-Host "FAIL khong dat duoc git core.hooksPath" -ForegroundColor Red
  exit 1
}
