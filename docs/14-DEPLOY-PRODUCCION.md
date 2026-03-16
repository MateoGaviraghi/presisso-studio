# 14 — Deploy a Producción (Railway + Vercel + CI/CD)

> **Sprint**: 3 (Día 22-24)
> **Dependencias**: Todo lo anterior
> **Resultado**: Sistema deployado con dominio custom, SSL, CI/CD automático
> **Skills a leer antes de implementar**: `webapp-testing`

---

## 1. Estrategia de Deploy

| Componente        | Plataforma              | Justificación                                                |
| ----------------- | ----------------------- | ------------------------------------------------------------ |
| Frontend (React)  | **Vercel**              | CDN global, deploy automático, preview por PR                |
| Backend (Fastify) | **Railway**             | Soporte Node.js + PostgreSQL integrado, Puppeteer compatible |
| PostgreSQL        | **Railway** (add-on)    | Managed DB, backups automáticos                              |
| Assets 3D         | **AWS S3 + CloudFront** | CDN para carga rápida de modelos GLB                         |

---

## 2. Deploy del Backend en Railway

### 2.1 Dockerfile

```dockerfile
# infra/docker/Dockerfile.api
FROM node:20-slim

# Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Instalar dependencias
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/pdf/package.json packages/pdf/
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

# Copiar código
COPY apps/api apps/api
COPY packages packages

# Build
RUN pnpm --filter @presisso/api build

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
```

### 2.2 railway.toml

```toml
[build]
dockerfilePath = "infra/docker/Dockerfile.api"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### 2.3 Variables de entorno en Railway

```bash
# En Railway Dashboard → Variables:
NODE_ENV=production
PORT=4000
DATABASE_URL=${{Postgres.DATABASE_URL}}   # Auto-inyectado por Railway
JWT_SECRET=<generar-con: openssl rand -hex 64>
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=<tu-google-client-id>
GOOGLE_CLIENT_SECRET=<tu-google-client-secret>
GOOGLE_REDIRECT_URI=https://api.presisso.studio/api/auth/google/callback
AWS_ACCESS_KEY_ID=<tu-aws-key>
AWS_SECRET_ACCESS_KEY=<tu-aws-secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=presisso-studio-assets
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
ANTHROPIC_API_KEY=sk-ant-api03-...
FRONTEND_URL=https://presisso.studio
```

---

## 3. Deploy del Frontend en Vercel

### 3.1 vercel.json

```json
{
  "buildCommand": "cd ../.. && pnpm build --filter @presisso/web",
  "outputDirectory": "dist",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "vite",
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

### 3.2 Variables de entorno en Vercel

```bash
VITE_API_URL=https://api.presisso.studio/api
VITE_EIGHTHWALL_API_KEY=<tu-8thwall-key>
VITE_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

---

## 4. Dominio Custom + SSL

### Setup recomendado:

- `presisso.studio` → Vercel (frontend)
- `api.presisso.studio` → Railway (backend)
- `cdn.presisso.studio` → CloudFront (assets 3D)

### DNS Records:

```
presisso.studio         A      76.76.21.21 (Vercel)
api.presisso.studio     CNAME  <tu-app>.up.railway.app
cdn.presisso.studio     CNAME  d1234567890.cloudfront.net
```

SSL se configura automáticamente en Vercel y Railway.

---

## 5. GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: presisso-api

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  run-migrations:
    runs-on: ubuntu-latest
    needs: deploy-api
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install
      - run: pnpm db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm build
```

---

## 6. Monitoring Básico

### Health check endpoint (ya implementado):

```
GET https://api.presisso.studio/api/health
→ { "status": "ok", "timestamp": "2026-03-16T..." }
```

### Railway logs:

```bash
railway logs --follow
```

### Uptime check gratuito:

Configurar UptimeRobot (free tier) para `https://api.presisso.studio/api/health` cada 5 minutos.

---

## Siguiente paso → `15-QA-EXPO-PREPARACION.md`
