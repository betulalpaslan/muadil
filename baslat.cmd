@echo off
REM Muadil gelistirme ortamini tek tikla baslatir
cd /d "%~dp0"

echo [1/3] PostgreSQL ve Keycloak baslatiliyor...
docker compose up -d
if errorlevel 1 (
  echo Docker calismiyor. Docker Desktop acik mi?
  pause
  exit /b 1
)

echo [2/3] API baslatiliyor...
start "Muadil API" cmd /k dotnet watch run --project backend/Muadil.Api

echo [3/3] React baslatiliyor...
start "Muadil Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 8 /nobreak >nul
start http://localhost:5173
