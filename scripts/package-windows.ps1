param(
  [string]$Configuration = "release"
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$releaseRoot = Join-Path $projectRoot "release\windows"
$portableRoot = Join-Path $releaseRoot "RemarkBook"
$stagingRoot = Join-Path $releaseRoot (".package-staging-" + [guid]::NewGuid().ToString("N"))
$stagedPortableRoot = Join-Path $stagingRoot "RemarkBook"
$exePath = Join-Path $projectRoot "src-tauri\target\$Configuration\remarkbook.exe"
$zipPath = Join-Path $releaseRoot "RemarkBook-Windows-Portable.zip"

Push-Location $projectRoot
try {
  npx tauri build --no-bundle
} finally {
  Pop-Location
}

if (-not (Test-Path $exePath)) {
  throw "Built executable was not found at $exePath"
}

New-Item -ItemType Directory -Path $stagedPortableRoot | Out-Null

Copy-Item -LiteralPath $exePath -Destination (Join-Path $stagedPortableRoot "RemarkBook.exe")
Copy-Item -LiteralPath (Join-Path $projectRoot "src-tauri\icons\icon.ico") -Destination (Join-Path $stagedPortableRoot "RemarkBook.ico")

@"
RemarkBook Windows Portable

Run:
  Double-click RemarkBook.exe

Install shortcuts:
  Right-click install.ps1 and choose "Run with PowerShell"

Uninstall shortcuts and app copy:
  Run uninstall.ps1 from the installed folder, or delete this portable folder manually.

Data:
  RemarkBook stores task data locally on this computer through the desktop WebView storage.
"@ | Set-Content -LiteralPath (Join-Path $stagedPortableRoot "README.txt") -Encoding UTF8

@'
$ErrorActionPreference = "Stop"

$sourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installDir = Join-Path $env:LOCALAPPDATA "Programs\RemarkBook"
$startMenuDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\RemarkBook"
$desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "RemarkBook.lnk"

New-Item -ItemType Directory -Path $installDir -Force | Out-Null
New-Item -ItemType Directory -Path $startMenuDir -Force | Out-Null

Copy-Item -LiteralPath (Join-Path $sourceDir "RemarkBook.exe") -Destination (Join-Path $installDir "RemarkBook.exe") -Force
Copy-Item -LiteralPath (Join-Path $sourceDir "RemarkBook.ico") -Destination (Join-Path $installDir "RemarkBook.ico") -Force
Copy-Item -LiteralPath (Join-Path $sourceDir "uninstall.ps1") -Destination (Join-Path $installDir "uninstall.ps1") -Force

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut((Join-Path $startMenuDir "RemarkBook.lnk"))
$shortcut.TargetPath = Join-Path $installDir "RemarkBook.exe"
$shortcut.IconLocation = Join-Path $installDir "RemarkBook.ico"
$shortcut.WorkingDirectory = $installDir
$shortcut.Save()

$desktop = $shell.CreateShortcut($desktopShortcut)
$desktop.TargetPath = Join-Path $installDir "RemarkBook.exe"
$desktop.IconLocation = Join-Path $installDir "RemarkBook.ico"
$desktop.WorkingDirectory = $installDir
$desktop.Save()

Write-Host "RemarkBook installed to $installDir"
Write-Host "Shortcuts created in Start Menu and Desktop."
'@ | Set-Content -LiteralPath (Join-Path $stagedPortableRoot "install.ps1") -Encoding UTF8

@'
$ErrorActionPreference = "Stop"

$installDir = Join-Path $env:LOCALAPPDATA "Programs\RemarkBook"
$startMenuDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\RemarkBook"
$desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "RemarkBook.lnk"

if (Test-Path $desktopShortcut) {
  Remove-Item -LiteralPath $desktopShortcut -Force
}
if (Test-Path $startMenuDir) {
  Remove-Item -LiteralPath $startMenuDir -Recurse -Force
}
if (Test-Path $installDir) {
  Remove-Item -LiteralPath $installDir -Recurse -Force
}

Write-Host "RemarkBook shortcuts and installed app files removed."
'@ | Set-Content -LiteralPath (Join-Path $stagedPortableRoot "uninstall.ps1") -Encoding UTF8

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -LiteralPath $stagedPortableRoot -DestinationPath $zipPath -Force

try {
  if (Test-Path $portableRoot) {
    Remove-Item -LiteralPath $portableRoot -Recurse -Force
  }
  Copy-Item -LiteralPath $stagedPortableRoot -Destination $releaseRoot -Recurse -Force
} catch {
  Write-Warning "Portable folder was not refreshed because an existing file is in use. The zip package was still created."
}

Remove-Item -LiteralPath $stagingRoot -Recurse -Force

Write-Host "Windows portable package created:"
Write-Host $zipPath
