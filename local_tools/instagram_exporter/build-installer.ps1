param(
  [switch]$SkipInstaller,
  [string]$EngineDescriptor = "",
  [string]$EngineArchive = ""
)
$ErrorActionPreference = "Stop"
$toolRoot = (Resolve-Path $PSScriptRoot).Path
$venv = Join-Path $toolRoot ".venv-build-agent"
$python = Join-Path $venv "Scripts\python.exe"
$pip = Join-Path $venv "Scripts\pip.exe"
if (-not (Test-Path -LiteralPath $python)) { py -3.10 -m venv $venv }
if ($LASTEXITCODE) { throw "No se pudo crear el entorno de build." }
& $python -m pip install --upgrade pip
if ($LASTEXITCODE) { throw "No se pudo actualizar pip." }
& $pip install -r (Join-Path $toolRoot "requirements-dev.txt")
if ($LASTEXITCODE) { throw "No se pudieron instalar las dependencias de build." }
$env:PLAYWRIGHT_BROWSERS_PATH = "0"
& $python -m playwright install chromium --no-shell
if ($LASTEXITCODE) { throw "No se pudo instalar Chromium para el paquete." }
Push-Location (Join-Path $toolRoot "packaging")
try { & $python -m PyInstaller --noconfirm --clean --distpath (Join-Path $toolRoot "dist") --workpath (Join-Path $toolRoot "build") agent.spec }
finally { Pop-Location }
if ($LASTEXITCODE) { throw "PyInstaller no pudo generar el agente." }
$agentExe = Join-Path $toolRoot "dist\FelipeLocalToolsAgent\FelipeLocalToolsAgent.exe"
if (-not (Test-Path -LiteralPath $agentExe)) { throw "PyInstaller no genero $agentExe" }
& $agentExe --initialize
if ($LASTEXITCODE) { throw "El agente empaquetado no pudo inicializarse." }
if (-not $SkipInstaller) {
  $bundleDir = Join-Path $toolRoot "packaging\engine-bundle"
  New-Item -ItemType Directory -Path $bundleDir -Force | Out-Null
  if ($EngineDescriptor) {
    $descriptorTarget = Join-Path $bundleDir "engine-pack-manifest.json"
    if ([System.IO.Path]::GetFullPath($EngineDescriptor) -ne [System.IO.Path]::GetFullPath($descriptorTarget)) { Copy-Item -LiteralPath $EngineDescriptor -Destination $descriptorTarget -Force }
  }
  if ($EngineArchive) {
    $archiveTarget = Join-Path $bundleDir "FelipeAudioEnginePack-windows-x64.zip"
    if ([System.IO.Path]::GetFullPath($EngineArchive) -ne [System.IO.Path]::GetFullPath($archiveTarget)) { Copy-Item -LiteralPath $EngineArchive -Destination $archiveTarget -Force }
  }
  $iscc = Get-Command ISCC.exe -ErrorAction SilentlyContinue
  if (-not $iscc) {
    $scoopIscc = Join-Path $env:USERPROFILE "scoop\apps\innosetup-np\current\ISCC.exe"
    if (Test-Path -LiteralPath $scoopIscc) { $iscc = Get-Item -LiteralPath $scoopIscc }
  }
  if (-not $iscc) { throw "Instala Inno Setup 6 o usa -SkipInstaller para validar solo PyInstaller." }
  $isccPath = if ($iscc.Source) { $iscc.Source } else { $iscc.FullName }
  & $isccPath (Join-Path $toolRoot "packaging\installer.iss")
  if ($LASTEXITCODE) { throw "Inno Setup no pudo crear el instalador." }
}
Write-Host "Build validado: $agentExe"
