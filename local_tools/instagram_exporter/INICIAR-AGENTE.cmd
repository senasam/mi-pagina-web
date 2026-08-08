@echo off
chcp 65001 >nul
title Instagram Exporter - Agente local
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo No se encontro Python en este equipo.
  echo Instala Python desde https://www.python.org/downloads/windows/
  echo Durante la instalacion activa la opcion "Add python.exe to PATH".
  echo Despues vuelve a abrir este archivo.
  echo.
  pause
  exit /b 1
)

echo.
echo Preparando Instagram Exporter...
echo La primera vez puede tardar varios minutos.
echo Deja esta ventana abierta mientras usas la herramienta.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-agent.ps1"
set "instagram_agent_exit=%ERRORLEVEL%"

if not "%instagram_agent_exit%"=="0" (
  echo.
  echo El agente no pudo iniciarse. Revisa el mensaje que aparece arriba.
  pause
)

exit /b %instagram_agent_exit%
