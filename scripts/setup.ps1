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
