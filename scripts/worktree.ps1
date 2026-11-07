# worktree.ps1 - quan ly Git worktree (.worktrees/<slug>) cho Agent
# Cach dung:
#   powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 new <type>/<ten-ngan>
#   powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 list
#   powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 merge <branch-hoac-slug>
#   powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 done <branch-hoac-slug>
# ASCII-only: Windows PowerShell 5.1 doc file khong BOM theo ANSI.

param(
  [Parameter(Position = 0)]
  [ValidateSet('new', 'list', 'merge', 'done')]
  [string]$Action = 'list',

  [Parameter(Position = 1)]
  [string]$Target = ''
)

$porcelain = @(git -C $PSScriptRoot worktree list --porcelain 2>$null)
if ($LASTEXITCODE -ne 0 -or $porcelain.Count -eq 0) {
  Write-Host "FAIL khong tim thay git repository" -ForegroundColor Red
  exit 1
}
$mainRoot = ($porcelain[0] -replace '^worktree\s+', '').Trim() -replace '/', '\'
$wtBase = Join-Path $mainRoot '.worktrees'

function Remove-ClaudeJunctions([string]$wtDir) {
  foreach ($name in 'skills', 'rules') {
    $j = Join-Path $wtDir ".claude\$name"
    if (Test-Path $j) {
      $item = Get-Item $j -Force
      if ($item.LinkType -eq 'Junction') {
        [System.IO.Directory]::Delete($item.FullName)
      }
    }
  }
}

function Resolve-Target([string]$inputName) {
  if (-not $inputName) {
    Write-Host "FAIL thieu ten branch hoac slug -> vd: feat/gateway-uart" -ForegroundColor Red
    exit 1
  }
  $slug = $inputName -replace '/', '-'
  $wtPath = Join-Path $wtBase $slug
  $branch = $inputName
  if ((Test-Path $wtPath) -and ($inputName -notmatch '/')) {
    $b = (git -C $wtPath symbolic-ref --short HEAD 2>$null)
    if ($b) { $branch = $b.Trim() }
  }
  return @{
    Branch = $branch
    Slug   = $slug
    Path   = $wtPath
  }
}

switch ($Action) {
  'list' {
    git -C $mainRoot worktree list
    exit 0
  }

  'new' {
    if ($Target -notmatch '^(feat|fix|docs|chore|refactor|test|style|perf|ci|build)/[a-z0-9-]+$') {
      Write-Host "FAIL ten branch '$Target' sai chuan -> dung: <type>/<ten-ngan> (chu thuong, so, gach ngang; vd: feat/gateway-uart)" -ForegroundColor Red
      exit 1
    }
    $slug = $Target -replace '/', '-'
    $wtPath = Join-Path $wtBase $slug
    New-Item -ItemType Directory -Force $wtBase | Out-Null

    if (Test-Path $wtPath) {
      Write-Host "OK worktree da ton tai: $wtPath (branch: $Target)"
      exit 0
    }

    git -C $mainRoot show-ref --verify --quiet "refs/heads/$Target"
    if ($LASTEXITCODE -eq 0) {
      git -C $mainRoot worktree add $wtPath $Target
    } else {
      git -C $mainRoot worktree add -b $Target $wtPath main
    }
    if ($LASTEXITCODE -ne 0) {
      Write-Host "FAIL khong tao duoc worktree cho '$Target'" -ForegroundColor Red
      exit 1
    }

    $wtSetup = Join-Path $wtPath 'scripts\setup.ps1'
    if (Test-Path $wtSetup) {
      powershell.exe -NoProfile -ExecutionPolicy Bypass -File $wtSetup
    }
    Write-Host "OK worktree san sang: $wtPath (branch: $Target)" -ForegroundColor Green
    exit 0
  }

  'done' {
    $info = Resolve-Target $Target
    $wtPath = $info.Path
    $branch = $info.Branch

    if (Test-Path $wtPath) {
      $dirty = @(git -C $wtPath status --porcelain 2>$null)
      if ($dirty.Count -gt 0) {
        Write-Host "FAIL worktree '$wtPath' con thay doi chua commit -> commit hoac git checkout -- . truoc khi xoa" -ForegroundColor Red
        exit 1
      }
      Remove-ClaudeJunctions $wtPath
      git -C $mainRoot worktree remove $wtPath
      if ($LASTEXITCODE -ne 0) {
        Write-Host "FAIL khong xoa duoc worktree '$wtPath'" -ForegroundColor Red
        exit 1
      }
      git -C $mainRoot worktree prune
    }

    if ($branch -and $branch -notin @('main', 'master')) {
      git -C $mainRoot show-ref --verify --quiet "refs/heads/$branch"
      if ($LASTEXITCODE -eq 0) {
        git -C $mainRoot merge-base --is-ancestor $branch main 2>$null
        if ($LASTEXITCODE -eq 0) {
          git -C $mainRoot branch -d $branch
        } else {
          Write-Host "WARN branch '$branch' chua merge vao main -> giu lai branch (chay 'worktree.ps1 merge $branch' de gop)" -ForegroundColor Yellow
        }
      }
    }
    Write-Host "OK da don worktree: $($info.Slug)" -ForegroundColor Green
    exit 0
  }

  'merge' {
    $info = Resolve-Target $Target
    $wtPath = $info.Path
    $branch = $info.Branch

    $mainBranch = (git -C $mainRoot symbolic-ref --short HEAD 2>$null).Trim()
    if ($mainBranch -ne 'main') {
      Write-Host "FAIL thu muc goc dang o nhanh '$mainBranch', phai o 'main' de merge" -ForegroundColor Red
      exit 1
    }
    $mainDirty = @(git -C $mainRoot status --porcelain 2>$null)
    if ($mainDirty.Count -gt 0) {
      Write-Host "FAIL thu muc goc (main) con file chua commit -> lam sach truoc khi merge" -ForegroundColor Red
      exit 1
    }

    if (Test-Path $wtPath) {
      $wtDirty = @(git -C $wtPath status --porcelain 2>$null)
      if ($wtDirty.Count -gt 0) {
        Write-Host "FAIL worktree '$wtPath' con file chua commit -> commit het truoc khi merge" -ForegroundColor Red
        exit 1
      }
      Write-Host "Chay check.ps1 trong worktree '$wtPath'..."
      powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $wtPath 'scripts\check.ps1')
      if ($LASTEXITCODE -ne 0) {
        Write-Host "FAIL check.ps1 trong worktree bao loi -> sua truoc khi merge" -ForegroundColor Red
        exit 1
      }
    }

    git -C $mainRoot merge $branch --no-edit
    if ($LASTEXITCODE -ne 0) {
      Write-Host "FAIL merge '$branch' vao main bi xung dot -> giai quyet xung dot" -ForegroundColor Red
      exit 1
    }

    if (Test-Path $wtPath) {
      Remove-ClaudeJunctions $wtPath
      git -C $mainRoot worktree remove $wtPath
      git -C $mainRoot worktree prune
    }
    git -C $mainRoot branch -d $branch
    Write-Host "OK da merge '$branch' vao main va don sach worktree" -ForegroundColor Green
    exit 0
  }
}
