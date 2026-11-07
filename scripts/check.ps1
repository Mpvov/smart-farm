$fail = @()
$root = (Get-Location).Path

# Mọi đường dẫn trong `backtick` của AGENTS.md phải tồn tại
Get-ChildItem -Path $root -Recurse -Filter AGENTS.md -File |
  Where-Object { $_.FullName -notmatch '\\(node_modules|\.git|venv)\\' } |
  ForEach-Object {
    $file = $_
    $text = Get-Content $file.FullName -Raw -Encoding UTF8
    foreach ($m in [regex]::Matches($text, '`([\w.-]+/[\w./-]*|[\w-]+\.(md|ps1|json))`')) {
      $p = $m.Groups[1].Value
      if (-not (Test-Path (Join-Path $root $p)) -and -not (Test-Path (Join-Path $file.DirectoryName $p))) {
        $fail += "$($file.FullName): '$p' khong ton tai -> tao file hoac xoa dong tro toi no"
      }
    }
    if ($text -match '<tên>') { $fail += "$($file.FullName): con '<tên>' -> dien ten that" }
  }

if (Test-Path (Join-Path $root 'GEMINI.md')) { $fail += "GEMINI.md: xoa, chi dung AGENTS.md" }
git ls-files '*.xlsx' | ForEach-Object { $fail += "${_}: chuyen sang Markdown trong docs/" }
git ls-files '.env'   | ForEach-Object { $fail += ".env dang duoc commit -> git rm --cached .env" }

# Chạy kiểm tra contract samples
python (Join-Path $root 'contracts/test_contracts.py') | Out-Null
if ($LASTEXITCODE -ne 0) {
  $fail += "contracts/test_contracts.py: test contract FAIL"
}

if ($fail.Count -gt 0) {
  $fail | ForEach-Object { Write-Host "FAIL $_" -ForegroundColor Red }
  exit 1
}
Write-Host "OK agent files"
