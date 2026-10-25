#!/usr/bin/env bash
# Sunucuda çalıştırılır: ./deploy.sh
# Gerekli .env (sunucuda): POSTGRES_PASSWORD, SITE_HOST (ör. muadil.example.com), YENILE_ANAHTARI, ADMIN_SIFRE
set -euo pipefail
cd "$(dirname "$0")"

docker compose -f compose.prod.yaml up -d postgres
docker compose -f compose.prod.yaml --profile arac run --rm --build migrate
docker compose -f compose.prod.yaml build web
docker compose -f compose.prod.yaml up -d web caddy
echo "Tamam. Önbelleği tazelemek için: curl -X POST -H \"Authorization: Bearer \$YENILE_ANAHTARI\" https://\$SITE_HOST/api/yenile"
