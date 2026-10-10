@echo off
REM PostgreSQL ve Keycloak container larini durdurur (veriler kalir)
cd /d "%~dp0"
docker compose stop
echo Container lar durduruldu. API ve React pencerelerini kapatabilirsin.
pause
