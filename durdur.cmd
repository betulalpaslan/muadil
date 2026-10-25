@echo off
REM PostgreSQL container ini durdurur (veriler kalir)
cd /d "%~dp0web"
docker compose stop
echo Container durduruldu. Next.js penceresini kapatabilirsin.
pause
