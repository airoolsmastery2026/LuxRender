@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [LuxRender] Node.js 18+ was not found.
  echo Install Node.js once, then run this launcher again.
  pause
  exit /b 1
)
echo [LuxRender] Starting Local AI Bridge on http://127.0.0.1:8787
echo [LuxRender] ComfyUI must be available on http://127.0.0.1:8188 with at least one checkpoint.
node server.mjs
if errorlevel 1 (
  echo.
  echo [LuxRender] Local Bridge stopped with an error.
  pause
)
endlocal
