$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'store-assets'
$iconPath = Join-Path $root 'assets\icon128.png'

New-Item -ItemType Directory -Path $outDir -Force | Out-Null

function New-Canvas($width, $height, $path, [scriptblock]$draw) {
  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  try {
    & $draw $graphics $width $height
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function New-Brush($hex) {
  return New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function New-Pen($hex, $width = 1) {
  return New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($hex), $width)
}

function Fill-RoundedRect($graphics, $brush, $x, $y, $width, $height, $radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2
  $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
  $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
  $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  $graphics.FillPath($brush, $path)
  $path.Dispose()
}

function Draw-Text($graphics, $text, $fontName, $size, $style, $color, $x, $y, $width, $height) {
  $fontStyle = [System.Drawing.FontStyle]::$style
  $font = New-Object System.Drawing.Font($fontName, $size, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Brush $color
  $format = New-Object System.Drawing.StringFormat
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $graphics.DrawString($text, $font, $brush, (New-Object System.Drawing.RectangleF($x, $y, $width, $height)), $format)
  $format.Dispose()
  $brush.Dispose()
  $font.Dispose()
}

function Draw-PopupMock($graphics, $x, $y, $scale) {
  $white = New-Brush '#ffffff'
  $muted = New-Brush '#f8fafc'
  $line = New-Pen '#d7dee8' ([Math]::Max(1, [int](1 * $scale)))
  Fill-RoundedRect $graphics $white $x $y ([int](340 * $scale)) ([int](300 * $scale)) ([int](10 * $scale))
  $graphics.DrawRectangle($line, $x, $y, ([int](340 * $scale)), ([int](300 * $scale)))

  $icon = [System.Drawing.Image]::FromFile($iconPath)
  $graphics.DrawImage($icon, $x + [int](18 * $scale), $y + [int](18 * $scale), [int](40 * $scale), [int](40 * $scale))
  $icon.Dispose()
  Draw-Text $graphics 'RenameTab' 'Segoe UI' ([int](18 * $scale)) 'Bold' '#172033' ($x + [int](70 * $scale)) ($y + [int](18 * $scale)) ([int](220 * $scale)) ([int](28 * $scale))
  Draw-Text $graphics 'Current tab' 'Segoe UI' ([int](12 * $scale)) 'Regular' '#64748b' ($x + [int](70 * $scale)) ($y + [int](44 * $scale)) ([int](220 * $scale)) ([int](22 * $scale))

  Fill-RoundedRect $graphics $muted ($x + [int](18 * $scale)) ($y + [int](76 * $scale)) ([int](304 * $scale)) ([int](34 * $scale)) ([int](6 * $scale))
  Draw-Text $graphics 'Shortcut: Alt+R' 'Segoe UI' ([int](12 * $scale)) 'Bold' '#0f766e' ($x + [int](30 * $scale)) ($y + [int](84 * $scale)) ([int](180 * $scale)) ([int](20 * $scale))

  Draw-Text $graphics 'New title' 'Segoe UI' ([int](12 * $scale)) 'Bold' '#334155' ($x + [int](18 * $scale)) ($y + [int](126 * $scale)) ([int](260 * $scale)) ([int](20 * $scale))
  Fill-RoundedRect $graphics (New-Brush '#ffffff') ($x + [int](18 * $scale)) ($y + [int](150 * $scale)) ([int](304 * $scale)) ([int](38 * $scale)) ([int](6 * $scale))
  $graphics.DrawRectangle($line, ($x + [int](18 * $scale)), ($y + [int](150 * $scale)), ([int](304 * $scale)), ([int](38 * $scale)))
  Draw-Text $graphics 'Project Dashboard' 'Segoe UI' ([int](14 * $scale)) 'Regular' '#172033' ($x + [int](30 * $scale)) ($y + [int](160 * $scale)) ([int](250 * $scale)) ([int](22 * $scale))

  Draw-Text $graphics 'Persistence' 'Segoe UI' ([int](12 * $scale)) 'Bold' '#334155' ($x + [int](18 * $scale)) ($y + [int](202 * $scale)) ([int](260 * $scale)) ([int](20 * $scale))
  Fill-RoundedRect $graphics (New-Brush '#ffffff') ($x + [int](18 * $scale)) ($y + [int](226 * $scale)) ([int](304 * $scale)) ([int](38 * $scale)) ([int](6 * $scale))
  $graphics.DrawRectangle($line, ($x + [int](18 * $scale)), ($y + [int](226 * $scale)), ([int](304 * $scale)), ([int](38 * $scale)))
  Draw-Text $graphics 'Restore when URL changes' 'Segoe UI' ([int](13 * $scale)) 'Regular' '#172033' ($x + [int](30 * $scale)) ($y + [int](236 * $scale)) ([int](250 * $scale)) ([int](22 * $scale))

  Fill-RoundedRect $graphics (New-Brush '#0f766e') ($x + [int](18 * $scale)) ($y + [int](276 * $scale)) ([int](304 * $scale)) ([int](40 * $scale)) ([int](7 * $scale))
  Draw-Text $graphics 'Submit' 'Segoe UI' ([int](14 * $scale)) 'Bold' '#ffffff' ($x + [int](142 * $scale)) ($y + [int](286 * $scale)) ([int](100 * $scale)) ([int](24 * $scale))

  $white.Dispose()
  $muted.Dispose()
  $line.Dispose()
}

$promoPath = Join-Path $outDir 'promo-440x280.png'
New-Canvas 440 280 $promoPath {
  param($g, $w, $h)
  $bg = New-Brush '#0f172a'
  $g.FillRectangle($bg, 0, 0, $w, $h)
  $bg.Dispose()
  Fill-RoundedRect $g (New-Brush '#123f52') 24 34 104 104 22
  $icon = [System.Drawing.Image]::FromFile($iconPath)
  $g.DrawImage($icon, 32, 42, 88, 88)
  $icon.Dispose()
  Draw-Text $g 'RenameTab' 'Segoe UI' 36 'Bold' '#ffffff' 150 44 260 50
  Draw-Text $g 'Rename tab titles instantly.' 'Segoe UI' 18 'Regular' '#cbd5e1' 152 98 260 30
  Draw-Text $g 'Shortcut-friendly. Local. Lightweight.' 'Segoe UI' 15 'Regular' '#5eead4' 152 132 260 28
  Fill-RoundedRect $g (New-Brush '#ffffff') 42 170 356 70 12
  Draw-Text $g 'Before: Quarterly metrics - Internal portal' 'Segoe UI' 13 'Regular' '#64748b' 64 183 310 22
  Draw-Text $g 'After: Launch Dashboard' 'Segoe UI' 19 'Bold' '#0f172a' 64 207 310 28
}

$screenshotPath = Join-Path $outDir 'screenshot-1280x800.png'
New-Canvas 1280 800 $screenshotPath {
  param($g, $w, $h)
  $bg = New-Brush '#eef3f8'
  $g.FillRectangle($bg, 0, 0, $w, $h)
  $bg.Dispose()
  Fill-RoundedRect $g (New-Brush '#ffffff') 56 54 1168 690 18
  Fill-RoundedRect $g (New-Brush '#e2e8f0') 88 90 520 44 22
  Draw-Text $g 'https://example.com/dashboard' 'Segoe UI' 18 'Regular' '#475569' 118 102 440 26
  Draw-Text $g 'Before: Quarterly metrics - Internal portal - Example Corp' 'Segoe UI' 24 'Regular' '#64748b' 96 178 700 44
  Draw-Text $g 'After: Launch Dashboard' 'Segoe UI' 46 'Bold' '#0f172a' 96 230 740 70
  Draw-Text $g 'Give busy browser tabs short names you can recognize instantly.' 'Segoe UI' 24 'Regular' '#475569' 96 306 720 40
  Draw-PopupMock $g 790 160 1.15
}

Write-Output "Created $promoPath"
Write-Output "Created $screenshotPath"
