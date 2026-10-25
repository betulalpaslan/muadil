@echo off
REM Muadil web gelistirme ortamini tek tikla baslatir
cd /d "%~dp0web"

echo [1/2] PostgreSQL baslatiliyor...
docker compose up -d
if errorlevel 1 (
  echo Docker calismiyor. Docker Desktop acik mi?
  pause
  exit /b 1
)

echo [2/2] Next.js baslatiliyor...
start "Muadil Web" cmd /k npm run dev

timeout /t 8 /nobreak >nul
start http://localhost:3000
