param([string]$Version = "0.1.0", [switch]$SkipDependencies)
$ErrorActionPreference = "Stop"
$toolRoot = (Resolve-Path $PSScriptRoot).Path
$repositoryRoot = (Resolve-Path (Join-Path $toolRoot "..\..")).Path
$engineOutput = Join-Path $toolRoot "packaging\engine-bundle"
& (Join-Path $repositoryRoot "local_tools\music_analyzer\build-engine-pack.ps1") -Version $Version -OutputDir $engineOutput -PackageUrl "bundled:FelipeAudioEnginePack-windows-x64.zip" -SkipDependencies:$SkipDependencies
if ($LASTEXITCODE) { throw "No se pudo construir el Audio Engine Pack." }
& (Join-Path $toolRoot "build-installer.ps1") -EngineDescriptor (Join-Path $engineOutput "engine-pack-manifest.json") -EngineArchive (Join-Path $engineOutput "FelipeAudioEnginePack-windows-x64.zip")
if ($LASTEXITCODE) { throw "No se pudo construir el instalador unificado." }
