$ErrorActionPreference = "Stop"
$toolRoot = (Resolve-Path $PSScriptRoot).Path
$venv = Join-Path $toolRoot ".venv-agent"
$python = Join-Path $venv "Scripts\python.exe"
if (-not (Test-Path -LiteralPath $python)) { python -m venv $venv }
& $python -m pip install -r (Join-Path $toolRoot "requirements-agent.txt")
if ($LASTEXITCODE) { throw "No se pudieron instalar las dependencias del agente." }
& $python -m pip install -r (Join-Path $toolRoot "requirements-organizer.txt")
if ($LASTEXITCODE) { throw "No se pudieron instalar las dependencias opcionales del organizador." }
& $python (Join-Path $toolRoot "agent.py")
