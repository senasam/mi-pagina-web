param(
  [string]$Version = "0.1.0",
  [string]$OutputDir = "",
  [string]$PackageUrl = "bundled:FelipeAudioEnginePack-windows-x64.zip",
  [string]$PythonExe = "",
  [switch]$SkipDependencies,
  [switch]$ReuseBuild
)
$ErrorActionPreference = "Stop"
$musicRoot = (Resolve-Path $PSScriptRoot).Path
$repositoryRoot = (Resolve-Path (Join-Path $musicRoot "..\..")).Path
$buildRoot = Join-Path $repositoryRoot ".audio-engine-build"
$packRoot = Join-Path $buildRoot "audio-engine-pack"
if (-not $OutputDir) { $OutputDir = Join-Path $musicRoot "packaging\engine-output" }
$OutputDir = [System.IO.Path]::GetFullPath($OutputDir)
if (-not $PythonExe) {
  $PythonExe = (& py -3.10 -c "import sys; print(sys.executable)").Trim()
}
if (-not (Test-Path -LiteralPath $PythonExe)) { throw "Python 3.10 no esta disponible." }
$pythonVersion = (& $PythonExe -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')").Trim()
if ($pythonVersion -ne "3.10") { throw "El Audio Engine Pack requiere Python 3.10; se encontro $pythonVersion." }
$pythonBase = (& $PythonExe -c "import sys; print(sys.base_prefix)").Trim()
$resolvedBuild = [System.IO.Path]::GetFullPath($buildRoot)
if (-not $resolvedBuild.StartsWith($repositoryRoot, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Ruta de build no permitida." }
$packSitePackages = Join-Path $packRoot "python\Lib\site-packages"
if (-not $ReuseBuild) {
  if (Test-Path -LiteralPath $resolvedBuild) { Remove-Item -LiteralPath $resolvedBuild -Recurse -Force }
  New-Item -ItemType Directory -Path $packRoot, (Join-Path $packRoot "python"), (Join-Path $packRoot "ffmpeg\bin") -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $pythonBase "python.exe") -Destination (Join-Path $packRoot "python")
  Get-ChildItem -LiteralPath $pythonBase -Filter "python*.dll" | Copy-Item -Destination (Join-Path $packRoot "python")
  Get-ChildItem -LiteralPath $pythonBase -Filter "vcruntime*.dll" | Copy-Item -Destination (Join-Path $packRoot "python")
  Copy-Item -LiteralPath (Join-Path $pythonBase "DLLs") -Destination (Join-Path $packRoot "python\DLLs") -Recurse
  Copy-Item -LiteralPath (Join-Path $pythonBase "Lib") -Destination (Join-Path $packRoot "python\Lib") -Recurse
  if (Test-Path -LiteralPath $packSitePackages) { Remove-Item -LiteralPath $packSitePackages -Recurse -Force }
  New-Item -ItemType Directory -Path $packSitePackages -Force | Out-Null
  if (-not $SkipDependencies) {
    & $PythonExe -m pip install --upgrade --target $packSitePackages -r (Join-Path $musicRoot "requirements-engine.txt")
    if ($LASTEXITCODE) { throw "No se pudieron instalar las dependencias del motor." }
  }
} elseif (-not (Test-Path -LiteralPath (Join-Path $packSitePackages "torch\__init__.py"))) {
  throw "No existe un staging reutilizable con Torch instalado."
}

$ffmpeg = (Get-Command ffmpeg.exe -ErrorAction Stop).Source
$ffprobe = (Get-Command ffprobe.exe -ErrorAction Stop).Source
Copy-Item -LiteralPath $ffmpeg -Destination (Join-Path $packRoot "ffmpeg\bin\ffmpeg.exe")
Copy-Item -LiteralPath $ffprobe -Destination (Join-Path $packRoot "ffmpeg\bin\ffprobe.exe")
$packLocalTools = Join-Path $packRoot "local_tools"
if (Test-Path -LiteralPath $packLocalTools) { Remove-Item -LiteralPath $packLocalTools -Recurse -Force }
New-Item -ItemType Directory -Path $packLocalTools -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $repositoryRoot "local_tools\__init__.py") -Destination (Join-Path $packLocalTools "__init__.py")
$packMusic = Join-Path $packRoot "local_tools\music_analyzer"
New-Item -ItemType Directory -Path $packMusic -Force | Out-Null
foreach ($sourceName in @("__init__.py", "contracts.py", "worker.py", "model_worker.py", "model_store.py")) {
  Copy-Item -LiteralPath (Join-Path $musicRoot $sourceName) -Destination (Join-Path $packMusic $sourceName)
}
Copy-Item -LiteralPath (Join-Path $musicRoot "engine") -Destination (Join-Path $packMusic "engine") -Recurse
Get-ChildItem -LiteralPath $packRoot -Directory -Filter "__pycache__" -Recurse | Remove-Item -Recurse -Force

$metadata = [ordered]@{ schemaVersion = 1; version = $Version; platform = "windows-x64"; python = "3.10"; createdAt = [DateTime]::UtcNow.ToString("o") }
$metadata | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $packRoot "engine-pack.json") -Encoding UTF8
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
$archive = Join-Path $OutputDir "FelipeAudioEnginePack-windows-x64.zip"
if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive -Force }
$sevenZip = Get-Command 7z.exe -ErrorAction SilentlyContinue
if ($sevenZip) {
  Push-Location $buildRoot
  try { & $sevenZip.Source a -tzip -mx=7 $archive "audio-engine-pack" }
  finally { Pop-Location }
  if ($LASTEXITCODE) { throw "7-Zip no pudo comprimir el Audio Engine Pack." }
} else {
  Compress-Archive -LiteralPath $packRoot -DestinationPath $archive -CompressionLevel Optimal
}
$hash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
$descriptor = [ordered]@{ schemaVersion = 1; version = $Version; platform = "windows-x64"; size = (Get-Item -LiteralPath $archive).Length; sha256 = $hash; url = $PackageUrl }
$descriptorPath = Join-Path $OutputDir "engine-pack-manifest.json"
$descriptor | ConvertTo-Json | Set-Content -LiteralPath $descriptorPath -Encoding UTF8
Write-Host "Audio Engine Pack: $archive"
Write-Host "Manifest: $descriptorPath"
