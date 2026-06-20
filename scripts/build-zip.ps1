$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'
$package = Join-Path $dist 'package'
$zip = Join-Path $dist 'RenameTab.zip'

if (Test-Path $package) {
  Remove-Item $package -Recurse -Force
}

New-Item -ItemType Directory -Path $package -Force | Out-Null

$items = @(
  'manifest.json',
  'src',
  'popup',
  'options',
  'assets',
  'README.md',
  'LICENSE'
)

foreach ($item in $items) {
  $source = Join-Path $root $item
  if (Test-Path $source) {
    Copy-Item $source $package -Recurse -Force
  }
}

if (Test-Path $zip) {
  Remove-Item $zip -Force
}

Compress-Archive -Path (Join-Path $package '*') -DestinationPath $zip -Force
Write-Output "Created $zip"
