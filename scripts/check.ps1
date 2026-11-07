# check.ps1 - lenh kiem duy nhat. Agent phai chay va thay exit 0 truoc khi bao xong.
#   powershell -ExecutionPolicy Bypass -File scripts/check.ps1
# Moi loi in "FAIL <cho> -> <cach sua>". Them kiem cua du an o muc cuoi.
# ASCII-only: Windows PowerShell 5.1 doc file khong BOM theo ANSI.

param(
  [ValidateSet('', 'pre-commit', 'commit-msg')]
  [string]$Hook = '',
  [string]$MsgFile = ''
)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# Git hook: commit-msg (kiem tra Conventional Commits)
if ($Hook -eq 'commit-msg') {
  if (-not $MsgFile -or -not (Test-Path $MsgFile)) {
    Write-Host "FAIL commit-msg: khong tim thay file commit message" -ForegroundColor Red
    exit 1
  }
  $validLines = @(Get-Content $MsgFile -Encoding UTF8 | Where-Object { $_ -notmatch '^\s*#' -and $_.Trim() -ne '' })
  if ($validLines.Count -eq 0) {
    Write-Host "FAIL commit-msg: commit message rong" -ForegroundColor Red
    exit 1
  }
  $firstLine = $validLines[0].Trim()
  if ($firstLine -match '^(Merge|Revert)\b') { exit 0 }
  if ($firstLine -notmatch '^(feat|fix|docs|chore|refactor|test|style|perf|ci|build)(\([a-z0-9_-]+\))?: \S+') {
    Write-Host "FAIL commit message sai chuan Conventional Commits: '$firstLine'" -ForegroundColor Red
    Write-Host "  -> Dung: <type>(<scope>): <mo ta> (vd: feat(gateway): FR-GW-01 doc do am dat, docs: cap nhat UC-01)" -ForegroundColor Yellow
    exit 1
  }
  if ($firstLine -match '^feat\((firmware|gateway|backend|frontend)\):' -and $firstLine -notmatch '\b(FR|UC|NFR)-[A-Z0-9-]+\b') {
    Write-Host "WARN feat() tren module code nen ghi kem ID yeu cau (vd: feat(gateway): FR-GW-01 ...)" -ForegroundColor Yellow
  }
  exit 0
}

# Git hook: pre-commit (chan commit thang tren main/master, sau do chay toan bo check.ps1)
if ($Hook -eq 'pre-commit') {
  $curBranch = (git -C $root symbolic-ref --short HEAD 2>$null)
  if ($curBranch) { $curBranch = $curBranch.Trim() }
  if ($curBranch -in @('main', 'master') -and $env:ALLOW_MAIN_COMMIT -ne '1') {
    Write-Host "FAIL commit truc tiep tren nhanh '$curBranch' bi chan -> tao worktree: powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 new <type>/<ten-ngan>" -ForegroundColor Red
    exit 1
  }
}

# Thu muc goc khong can AGENTS.md rieng (van phai co trong bang Layout)
$noAgentsDirs = @('docs','scripts','report')
# Thu muc ngoai docs/ co nhac toi ID (bao cao, slide...): quet *.tex va *.md de bat ID chua dinh nghia
$extraIdDirs = @('report')
# Thu muc bo qua hoan toan
$skipDirs = @('node_modules','venv','.venv','dist','build','__pycache__')

$fail = @()
$skipRe = '\\(' + ((($skipDirs + '.git','.worktrees') | ForEach-Object { [regex]::Escape($_) }) -join '|') + ')\\'

# 1. AGENTS.md goc phai co
$rootAgents = Join-Path $root 'AGENTS.md'
if (-not (Test-Path $rootAgents)) { $fail += "AGENTS.md: thieu o goc repo -> tao tu mau" }

# 2. Moi AGENTS.md: duong dan trong `backtick` phai ton tai; khong con {{placeholder}}
Get-ChildItem -Path $root -Recurse -Filter AGENTS.md -File -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName.Substring($root.Length) -notmatch $skipRe } |
  ForEach-Object {
    $file = $_
    $rel = $file.FullName.Substring($root.Length + 1)
    $text = Get-Content $file.FullName -Raw -Encoding UTF8
    foreach ($m in [regex]::Matches($text, '`([\w.-]+/[\w./-]*|[\w-]+\.(md|ps1|sh|json|py|ts|js|yaml|yml|toml))`')) {
      $p = $m.Groups[1].Value
      # ten nhanh git (origin/main, feat/...) khong phai duong dan
      if ($p -match '^(origin|upstream|refs|feat|fix|chore|perf|ci|refactor|test)/') { continue }
      if (-not (Test-Path (Join-Path $root $p)) -and -not (Test-Path (Join-Path $file.DirectoryName $p))) {
        $fail += "${rel}: '$p' khong ton tai -> tao file hoac xoa dong tro toi no"
      }
    }
    if ($text -match '\{\{[^}]*\}\}') { $fail += "${rel}: con {{placeholder}} -> dien gia tri that" }
    $claude = Join-Path $file.DirectoryName 'CLAUDE.md'
    if (-not (Test-Path $claude)) {
      $fail += "${rel}: thieu CLAUDE.md canh no -> tao CLAUDE.md chi chua @AGENTS.md"
    } elseif ((Get-Content $claude -Raw -Encoding UTF8) -notmatch '@AGENTS\.md') {
      $fail += "$($claude.Substring($root.Length + 1)): khong import AGENTS.md -> them dong @AGENTS.md"
    }
  }

# 3. Moi thu muc goc phai co trong Layout; thu muc code phai co AGENTS.md
if (Test-Path $rootAgents) {
  $agentsText = Get-Content $rootAgents -Raw -Encoding UTF8
  Get-ChildItem $root -Directory | Where-Object { $_.Name -notmatch '^\.' -and $_.Name -notin $skipDirs } | ForEach-Object {
    $n = $_.Name
    if ($agentsText -notmatch [regex]::Escape("``$n/``")) { $fail += "${n}/: chua co trong bang Layout -> them 1 dong vao AGENTS.md" }
    if (($n -notin $noAgentsDirs) -and -not (Test-Path (Join-Path $_.FullName 'AGENTS.md'))) {
      $fail += "${n}/AGENTS.md: thieu -> tao tu mau module-AGENTS.md (kem CLAUDE.md)"
    }
  }
}

# 4. Rule cua Antigravity phai co frontmatter trigger, neu khong se bi bo am tham
Get-ChildItem (Join-Path $root '.agents\rules') -Filter *.md -File -ErrorAction SilentlyContinue | ForEach-Object {
  $lines = @(Get-Content $_.FullName -TotalCount 10 -Encoding UTF8)
  $hasTrigger = @($lines | Where-Object { $_ -match '^trigger:\s*(always_on|model_decision|glob|manual)\s*$' }).Count -gt 0
  if (-not (($lines.Count -gt 0) -and ($lines[0].Trim() -eq '---') -and $hasTrigger)) {
    $fail += ".agents/rules/$($_.Name): thieu frontmatter trigger -> them 3 dong dau: --- / trigger: always_on / ---"
  }
}

# 5. Mot nguon luat, khong secret, khong file nhi phan quan ly
if (Test-Path (Join-Path $root 'GEMINI.md')) { $fail += "GEMINI.md: xoa, chi dung AGENTS.md" }
$tracked = @(git ls-files 2>$null)
if ($LASTEXITCODE -eq 0) {
  $tracked | Where-Object { $_ -match '(^|/)\.env(\.[^/]+)?$' -and $_ -notmatch '\.env\.example$' } |
    ForEach-Object { $fail += "${_}: secret dang duoc commit -> git rm --cached $_" }
  $tracked | Where-Object { $_ -match '\.xlsx?$' } |
    ForEach-Object { $fail += "${_}: file Excel trong repo -> chuyen sang Markdown trong docs/" }
}

# 6. Junction cho Claude Code va Git hooks (.githooks)
foreach ($name in 'skills','rules') {
  $p = Join-Path $root ".claude\$name"
  if (-not (Test-Path $p) -or (Get-Item $p -Force).LinkType -ne 'Junction') {
    Write-Host "WARN .claude\$name chua link -> chay scripts/setup.ps1 neu dung Claude Code" -ForegroundColor Yellow
  }
}
foreach ($hk in 'pre-commit','commit-msg') {
  if (-not (Test-Path (Join-Path $root ".githooks\$hk"))) {
    $fail += ".githooks/${hk}: thieu git hook -> khoi phuc file .githooks/${hk}"
  }
}
$hooksPath = (git -C $root config --get core.hooksPath 2>$null)
if (-not $hooksPath -or $hooksPath.Trim() -ne '.githooks') {
  $fail += "git core.hooksPath chua dat '.githooks' -> chay: powershell -ExecutionPolicy Bypass -File scripts/setup.ps1"
}

# 7. Ban do tai lieu: moi file trong docs/ phai co trong docs/README.md
$docsDir = Join-Path $root 'docs'
if (Test-Path $docsDir) {
  $docsMap = Join-Path $docsDir 'README.md'
  if (-not (Test-Path $docsMap)) {
    $fail += "docs/README.md: thieu ban do tai lieu -> tao tu mau docs-README.md"
  } else {
    $mapText = Get-Content $docsMap -Raw -Encoding UTF8
    if ($mapText -match '\{\{[^}]*\}\}') { $fail += "docs/README.md: con {{placeholder}} -> dien gia tri that" }
    $listed = @([regex]::Matches($mapText, '`(docs/[^`\s]*)`') | ForEach-Object { $_.Groups[1].Value })
    Get-ChildItem $docsDir -Recurse -File | Where-Object { $_.Name -ne '.gitkeep' } | ForEach-Object {
      $rel = $_.FullName.Substring($root.Length + 1).Replace('\','/')
      if ($rel -eq 'docs/README.md') { return }
      $ok = $false
      foreach ($l in $listed) { if (($rel -eq $l) -or ($l.EndsWith('/') -and $rel.StartsWith($l))) { $ok = $true } }
      if (-not $ok) { $fail += "${rel}: khong co trong docs/README.md -> chuyen noi dung vao file dung theo bang, hoac hoi truoc khi them dong moi" }
    }
  }
  Get-ChildItem (Join-Path $docsDir 'decisions') -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne '.gitkeep' -and $_.Name -notmatch '^\d{4}-[a-z0-9-]+\.md$' } |
    ForEach-Object { $fail += "docs/decisions/$($_.Name): sai ten -> dat NNNN-ten-ngan.md (so lon nhat + 1, chu thuong, gach ngang)" }
}

# 8. ID: dinh nghia mot lan, o dung file goc; moi ID nhac toi phai da dinh nghia
#    Loai ID doc tu bang trong docs/README.md: hang co `docs/<file>.md` va tien to `ABC` trong backtick.
#    Them loai ID moi = them mot hang vao bang. Khong sua script.
$idHome = @{}
$docsMapFile = Join-Path $root 'docs\README.md'
if (Test-Path $docsMapFile) {
  $rowRe = '(?m)^\|[^|\r\n]*\|[^|\r\n]*`(docs/[^`\s]+\.md)`[^|\r\n]*\|\s*`([A-Z]{2,5})`'
  foreach ($m in [regex]::Matches((Get-Content $docsMapFile -Raw -Encoding UTF8), $rowRe)) {
    $idHome[$m.Groups[2].Value] = $m.Groups[1].Value
  }
}
# Tu khong phai ID (chuan ky thuat...) - them vao day neu bi canh bao nham
$notIds = @('UTF','ISO','RFC','HTTP','TLS','SHA','AES','RGB','USB','UART','MQTT','DHT','ESP','RS')
$unknownRe = '(?<![A-Za-z0-9-])([A-Z]{2,5})-[0-9]{2,4}\b'
$warnIds = @()
$idRe = '\b((?:' + ((@($idHome.Keys) + 'ZZZZZZ') -join '|') + ')-[A-Z0-9]+(?:-[0-9]+)?)\b'
$defRe = '(?m)^\s*(?:\*\*|\|\s*)' + $idRe
$boldDefRe = '(?m)^\s*\*\*' + $idRe
$noComments = { param($s) [regex]::Replace($s, '(?s)<!--.*?-->', '') }
$defs = @{}
foreach ($k in @($idHome.Keys)) {
  $h = Join-Path $root $idHome[$k]
  if (-not (Test-Path $h)) { continue }
  foreach ($m in [regex]::Matches((& $noComments (Get-Content $h -Raw -Encoding UTF8)), $defRe)) {
    $id = $m.Groups[1].Value
    if (-not $id.StartsWith("$k-")) { continue }
    if ($defs.ContainsKey($id)) { $fail += "$($idHome[$k]): $id dinh nghia 2 lan -> giu 1, cai kia doi sang ID moi (so lon nhat + 1)" }
    else { $defs[$id] = $true }
  }
}
$idFiles = @(Get-ChildItem $docsDir -Recurse -Filter *.md -File -ErrorAction SilentlyContinue) +
           @(Get-ChildItem -Path $root -Recurse -Filter AGENTS.md -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName.Substring($root.Length) -notmatch $skipRe })
foreach ($d in $extraIdDirs) {
  $p = Join-Path $root $d
  if (-not (Test-Path $p)) { $fail += "${d}/: co trong extraIdDirs nhung khong ton tai -> sua danh sach o dau check.ps1"; continue }
  $idFiles += @(Get-ChildItem $p -Recurse -File -Include *.tex,*.md -ErrorAction SilentlyContinue | Where-Object { $_.FullName.Substring($root.Length) -notmatch $skipRe })
}
foreach ($f in $idFiles) {
  $rel = $f.FullName.Substring($root.Length + 1).Replace('\','/')
  $txt = & $noComments (Get-Content $f.FullName -Raw -Encoding UTF8)
  foreach ($m in [regex]::Matches($txt, $boldDefRe)) {
    $id = $m.Groups[1].Value; $idFile = $idHome[$id.Split('-')[0]]
    if ($rel -ne $idFile) { $fail += "${rel}: dinh nghia $id ngoai file goc -> chuyen sang $idFile, o day chi ghi ID" }
  }
  foreach ($m in [regex]::Matches($txt, $unknownRe)) {
    $p = $m.Groups[1].Value
    if (-not $idHome.ContainsKey($p) -and $p -notin $notIds) { $warnIds += "${rel}: ID la $($m.Value) -> loai '$p' chua co trong bang docs/README.md; de xuat 1 hang (file goc + tien to) va HOI nguoi dung truoc khi them" }
  }
  foreach ($m in [regex]::Matches($txt, $idRe)) {
    $id = $m.Groups[1].Value
    if ($id -match 'XX|NN') { continue }
    $idFile = $idHome[$id.Split('-')[0]]
    if ((Test-Path (Join-Path $root $idFile)) -and -not $defs.ContainsKey($id)) {
      $fail += "${rel}: $id chua dinh nghia trong $idFile -> them dinh nghia hoac sua ID"
    }
  }
}

$warnIds | Select-Object -Unique | ForEach-Object { Write-Host "WARN $_" -ForegroundColor Yellow }

# === Kiem cua du an: them vao day ===
python (Join-Path $root 'contracts/test_contracts.py')
if ($LASTEXITCODE -ne 0) {
  $fail += "contracts/test_contracts.py: test contract FAIL -> sua contract/samples/code cho khop"
}

python -c "import pytest" 2>$null
if ($LASTEXITCODE -ne 0) {
  $fail += "backend tests: chua cai dat pytest -> pip install -r backend/requirements.txt"
} else {
  python -m pytest backend -q
  if ($LASTEXITCODE -ne 0) {
    $fail += "backend tests: pytest FAIL -> sua backend code cho pass hoac kiem tra test"
  }
}

# 2. Contract test API
python (Join-Path $root 'contracts/test_api_contracts.py')
if ($LASTEXITCODE -ne 0) {
  $fail += "contracts/test_api_contracts.py: api contract test FAIL -> sua backend hoac samples cho khop"
}

# 3. So voi base (origin/main neu co, khong thi main)
$baseRef = if ((git rev-parse --verify origin/main 2>$null) -and (git merge-base --is-ancestor main origin/main 2>$null)) { "origin/main" } else { "main" }
$currentBranch = (git branch --show-current).Trim()
$isAtBase = ($currentBranch -eq "main") -or ($currentBranch -eq "origin/main")

if (-not $isAtBase) {
  # 3a. So luong test khong duoc giam
  $baseGrepOut = git grep -c -E "^ *def test_" $baseRef -- "**/test_*.py" "test_*.py" 2>$null
  if ($baseGrepOut) {
    foreach ($line in $baseGrepOut) {
      $parts = $line -split ":"
      $relPath = $parts[1]
      $baseFileCount = [int]$parts[-1]
      $fullPath = Join-Path $root $relPath
      $workingFileCount = 0
      if (Test-Path $fullPath) {
        $workingFileCount = (Select-String -Path $fullPath -Pattern "^ *def test_" | Measure-Object).Count
      }
      if ($workingFileCount -lt $baseFileCount) {
        $fail += "${relPath}: so luong test giam ($workingFileCount < $baseFileCount) -> khong xoa test; FR doi thi sua test va ghi ID FR trong commit"
      }
    }
  }

  # 3b. Dong them moi trong diff *.py chua skip / skipif / xfail / .only
  $diffLines = git diff -U0 $baseRef -- "*.py"
  $currentDiffFile = ""
  $currentLineNum = 0
  foreach ($dLine in $diffLines) {
    if ($dLine -match '^\+\+\+ b/(.+)$') {
      $currentDiffFile = $Matches[1]
    } elseif ($dLine -match '^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@') {
      $currentLineNum = [int]$Matches[1]
    } elseif ($dLine -match '^\+(?!\+\+)(.*)$') {
      $addedText = $Matches[1]
      if ($addedText -match '@(?:pytest\.mark\.)?(?:skip|skipif|xfail)|\.only') {
        $hasStrict = ($addedText -match 'strict\s*=\s*True')
        $hasReason = ($addedText -match 'reason\s*=\s*["\x27](BUG FR-|CHUA LAM FR-)')
        if (-not ($hasStrict -and $hasReason)) {
          $fail += "${currentDiffFile}:${currentLineNum}: dong them moi chua skip/xfail khong hop le -> chi hop le khi co strict=True va reason bat dau bang BUG FR- hoac CHUA LAM FR-"
        }
      }
      $currentLineNum++
    }
  }
}

# 4. Ranh gioi import
# frontend khong import backend, gateway, firmware
$feFiles = Get-ChildItem -Path (Join-Path $root "frontend/src") -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" -ErrorAction SilentlyContinue
foreach ($f in $feFiles) {
  $matches = Select-String -Path $f.FullName -Pattern 'from\s+["\x27].*(backend|gateway|firmware)|require\(["\x27].*(backend|gateway|firmware)'
  foreach ($m in $matches) {
    $rel = Resolve-Path -Relative $f.FullName
    $fail += "${rel}:$($m.LineNumber): frontend khong duoc import truc tiep backend/gateway/firmware"
  }
}

# backend khong import gateway, firmware
$beFiles = Get-ChildItem -Path (Join-Path $root "backend") -Recurse -Filter "*.py" -ErrorAction SilentlyContinue
foreach ($f in $beFiles) {
  $matches = Select-String -Path $f.FullName -Pattern "^\s*(import\s+(gateway|firmware)|from\s+(gateway|firmware))"
  foreach ($m in $matches) {
    $rel = Resolve-Path -Relative $f.FullName
    $fail += "${rel}:$($m.LineNumber): backend khong duoc import gateway hoac firmware"
  }
}

# gateway khong import backend
$gwFiles = Get-ChildItem -Path (Join-Path $root "gateway") -Recurse -Filter "*.py" -ErrorAction SilentlyContinue
foreach ($f in $gwFiles) {
  $matches = Select-String -Path $f.FullName -Pattern "^\s*(import\s+backend|from\s+backend)"
  foreach ($m in $matches) {
    $rel = Resolve-Path -Relative $f.FullName
    $fail += "${rel}:$($m.LineNumber): gateway khong duoc import backend"
  }
}

if ($fail.Count -gt 0) {
  $fail | Select-Object -Unique | ForEach-Object { Write-Host "FAIL $_" -ForegroundColor Red }
  exit 1
}
Write-Host "OK agent files"
exit 0
