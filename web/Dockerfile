# syntax=docker/dockerfile:1

FROM node:24-slim AS bagimliliklar
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Şema migrasyonu: derlemeden önce ayrı çalıştırılır (derleme sayfaları üretirken tabloları sorgular)
FROM node:24-slim AS migrate
WORKDIR /app
COPY --from=bagimliliklar /app/node_modules ./node_modules
COPY package.json ./
COPY drizzle ./drizzle
COPY scripts/migrate.mjs ./scripts/migrate.mjs
CMD ["node", "scripts/migrate.mjs"]

FROM node:24-slim AS derleme
WORKDIR /app
COPY --from=bagimliliklar /app/node_modules ./node_modules
COPY . .
# Derleme sırasında sayfalar veritabanından üretilir, bu yüzden erişilebilir bir DATABASE_URL gerekir.
ARG DATABASE_URL
ARG SITE_URL
ARG SITE_INDEX
# SITE_URL ve SITE_INDEX sayfalara (canonical, sitemap, robots.txt) derleme anında işlenir.
ENV DATABASE_URL=$DATABASE_URL SITE_URL=$SITE_URL SITE_INDEX=$SITE_INDEX NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-slim AS calistir
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=derleme --chown=node:node /app/.next/standalone ./
COPY --from=derleme --chown=node:node /app/.next/static ./.next/static
COPY --from=derleme --chown=node:node /app/public ./public
# Next.js çalışırken önbellek dizinlerine yazar
RUN mkdir -p .next/cache && chown -R node:node .next
# Yönetimden yüklenen görseller; compose.prod.yaml'da volume olarak bağlanır (ilk bağlanışta bu sahipliği devralır)
RUN mkdir -p /uploads && chown node:node /uploads
USER node
EXPOSE 3000
CMD ["node", "server.js"]
