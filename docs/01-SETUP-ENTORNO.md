# 01 — Setup del Entorno y Monorepo

> **Sprint**: 1 (Día 1-2)
> **Dependencias**: Ninguna — este es el punto de partida
> **Resultado**: Monorepo funcional con frontend y backend corriendo en local

---

## 1. Requisitos del Sistema

### Software necesario

```bash
# Node.js 20 LTS (obligatorio)
node -v  # debe ser >= 20.x

# pnpm (gestor de paquetes para monorepo)
npm install -g pnpm@9
pnpm -v  # debe ser >= 9.x

# PostgreSQL 16
psql --version  # debe ser >= 16.x

# Git
git --version  # debe ser >= 2.40

# Docker (opcional, para PostgreSQL local)
docker --version
docker-compose --version
```

### Cuentas necesarias

| Servicio     | Para qué            | URL de registro          |
| ------------ | ------------------- | ------------------------ |
| GitHub       | Repositorio + CI/CD | github.com               |
| Railway      | Deploy backend + DB | railway.app              |
| Vercel       | Deploy frontend     | vercel.com               |
| AWS          | S3 + CloudFront     | aws.amazon.com           |
| 8thWall      | AR SDK              | 8thwall.com              |
| Anthropic    | Claude API          | console.anthropic.com    |
| Google Cloud | OAuth2 login        | console.cloud.google.com |

---

## 2. Inicialización del Monorepo

### 2.1 Crear repositorio

```bash
mkdir presisso-studio
cd presisso-studio
git init
pnpm init
```

### 2.2 Configurar pnpm workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 2.3 Estructura de carpetas completa

```bash
mkdir -p apps/web/src/{components,scenes,hooks,services,pages,assets,styles,types,utils,contexts}
mkdir -p apps/api/src/{routes,services,middleware,db,utils,types,config}
mkdir -p packages/shared/src
mkdir -p packages/pdf/src/{templates,utils}
mkdir -p infra/{docker,scripts,nginx}
```

**Estructura final:**

```
presisso-studio/
├── pnpm-workspace.yaml
├── package.json                    ← Root: scripts globales
├── .gitignore
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── turbo.json                      ← Turborepo (build orchestration)
│
├── apps/
│   ├── web/                        ← Frontend React + Babylon.js
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.cjs
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx            ← Entry point
│   │       ├── App.tsx             ← Router principal
│   │       ├── vite-env.d.ts
│   │       ├── components/         ← UI components
│   │       │   ├── ui/             ← Botones, inputs, modals genéricos
│   │       │   ├── layout/         ← Header, Sidebar, Footer
│   │       │   ├── catalog/        ← ProductGrid, ProductCard, Filters
│   │       │   ├── editor/         ← Toolbar, PropertyPanel, SceneCanvas
│   │       │   ├── chat/           ← ChatPanel, ChatMessage, ChatInput
│   │       │   └── pdf/            ← PdfPreview, PdfDownloadButton
│   │       ├── scenes/             ← Babylon.js scenes
│   │       │   ├── editor-scene.ts ← Scene principal del editor 3D
│   │       │   ├── ar-scene.ts     ← Scene para modo AR
│   │       │   ├── preview-scene.ts← Mini-viewer del catálogo
│   │       │   └── scene-utils.ts  ← Helpers compartidos
│   │       ├── hooks/              ← Custom React hooks
│   │       │   ├── use-auth.ts
│   │       │   ├── use-project.ts
│   │       │   ├── use-catalog.ts
│   │       │   ├── use-editor.ts
│   │       │   └── use-chat.ts
│   │       ├── services/           ← API client layer
│   │       │   ├── api-client.ts   ← Fetch wrapper con auth
│   │       │   ├── auth-service.ts
│   │       │   ├── project-service.ts
│   │       │   ├── catalog-service.ts
│   │       │   └── chat-service.ts
│   │       ├── pages/              ← Page-level components
│   │       │   ├── LoginPage.tsx
│   │       │   ├── DashboardPage.tsx
│   │       │   ├── EditorPage.tsx
│   │       │   ├── CatalogPage.tsx
│   │       │   ├── ArPage.tsx
│   │       │   └── VendorPage.tsx
│   │       ├── contexts/           ← React Context providers
│   │       │   ├── AuthContext.tsx
│   │       │   └── EditorContext.tsx
│   │       ├── types/              ← TypeScript interfaces
│   │       │   └── index.ts
│   │       ├── utils/              ← Helpers puros
│   │       │   └── index.ts
│   │       ├── styles/
│   │       │   └── globals.css     ← Tailwind imports + custom
│   │       └── assets/
│   │           ├── logo.svg
│   │           └── fonts/
│   │
│   └── api/                        ← Backend Node.js + Fastify
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts            ← Server entry point
│           ├── app.ts              ← Fastify app factory
│           ├── config/
│           │   ├── env.ts          ← Validación de env vars con zod
│           │   ├── cors.ts
│           │   └── swagger.ts
│           ├── routes/
│           │   ├── auth.routes.ts
│           │   ├── project.routes.ts
│           │   ├── product.routes.ts
│           │   ├── chat.routes.ts
│           │   ├── pdf.routes.ts
│           │   └── upload.routes.ts
│           ├── services/
│           │   ├── auth.service.ts
│           │   ├── project.service.ts
│           │   ├── product.service.ts
│           │   ├── claude.service.ts
│           │   ├── pdf.service.ts
│           │   └── s3.service.ts
│           ├── middleware/
│           │   ├── auth.middleware.ts
│           │   ├── rate-limit.ts
│           │   └── error-handler.ts
│           ├── db/
│           │   ├── index.ts        ← Drizzle connection
│           │   ├── schema.ts       ← Tablas completas
│           │   ├── migrate.ts      ← Runner de migraciones
│           │   └── seed.ts         ← Datos iniciales
│           ├── types/
│           │   └── index.ts
│           └── utils/
│               ├── jwt.ts
│               └── hash.ts
│
├── packages/
│   ├── shared/                     ← Tipos y constantes compartidas
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types.ts            ← Product, Project, User interfaces
│   │       ├── constants.ts        ← Ambientes, categorías, roles
│   │       └── validators.ts       ← Zod schemas compartidos
│   │
│   └── pdf/                        ← Generador de PDFs
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── generator.ts        ← Puppeteer render
│           ├── templates/
│           │   ├── proposal.html   ← Template de propuesta comercial
│           │   └── styles.css      ← Estilos del PDF
│           └── utils/
│               └── screenshot.ts
│
└── infra/
    ├── docker/
    │   ├── docker-compose.yml      ← PostgreSQL + Redis local
    │   └── Dockerfile.api          ← Build del backend
    ├── scripts/
    │   ├── setup.sh                ← Script de setup inicial
    │   ├── seed-demo.sh            ← Cargar datos de demo
    │   └── convert-models.sh       ← Pipeline SKP → GLB
    └── .github/
        └── workflows/
            ├── ci.yml              ← Lint + test en PR
            └── deploy.yml          ← Deploy a prod en merge a main
```

---

## 3. Configuración del Frontend (apps/web)

### 3.1 Inicializar con Vite + React + TypeScript

```bash
cd apps/web
pnpm init
```

```json
// apps/web/package.json
{
  "name": "@presisso/web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.0",
    "@babylonjs/core": "^7.10.0",
    "@babylonjs/loaders": "^7.10.0",
    "@babylonjs/materials": "^7.10.0",
    "@babylonjs/gui": "^7.10.0",
    "zustand": "^4.5.0",
    "lucide-react": "^0.383.0",
    "@presisso/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^3.7.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.0",
    "vite": "^5.3.0"
  }
}
```

### 3.2 Vite Config

```typescript
// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core', '@babylonjs/loaders', '@babylonjs/materials'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
```

### 3.3 Tailwind CSS

```typescript
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        presisso: {
          red: '#D42B2B',
          'red-hover': '#B82424',
          'red-light': '#FDF2F2',
          black: '#1A1A1A',
          charcoal: '#333333',
          gray: '#6B6B6B',
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#FAFAF9',
          tertiary: '#F5F5F3',
        },
        border: {
          DEFAULT: '#E5E5E5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

```css
/* apps/web/src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');

@layer base {
  body {
    @apply bg-surface-secondary text-presisso-charcoal antialiased;
    font-family: 'Inter', system-ui, sans-serif;
  }
}

@layer components {
  .btn-primary {
    @apply bg-presisso-red text-white px-6 py-3 rounded-xl font-medium
           hover:bg-presisso-red-hover transition-all duration-200
           active:scale-[0.98];
  }
  .btn-secondary {
    @apply bg-presisso-black text-white px-6 py-3 rounded-xl font-medium
           hover:bg-presisso-black/90 transition-all duration-200;
  }
  .btn-outline {
    @apply border border-border text-presisso-charcoal px-6 py-3 rounded-xl font-medium
           hover:bg-surface-tertiary transition-all duration-200;
  }
  .card {
    @apply bg-white rounded-2xl border border-border shadow-sm;
  }
}
```

### 3.4 TypeScript Config

```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 4. Configuración del Backend (apps/api)

### 4.1 Package.json

```json
// apps/api/package.json
{
  "name": "@presisso/api",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:seed": "tsx src/db/seed.ts",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "fastify": "^4.28.0",
    "@fastify/cors": "^9.0.1",
    "@fastify/multipart": "^8.3.0",
    "@fastify/rate-limit": "^9.1.0",
    "@fastify/swagger": "^8.14.0",
    "@fastify/swagger-ui": "^3.0.0",
    "drizzle-orm": "^0.31.0",
    "postgres": "^3.4.4",
    "@anthropic-ai/sdk": "^0.24.0",
    "@aws-sdk/client-s3": "^3.600.0",
    "@aws-sdk/s3-request-presigner": "^3.600.0",
    "jose": "^5.6.0",
    "bcrypt": "^5.1.1",
    "zod": "^3.23.0",
    "puppeteer": "^22.12.0",
    "pino": "^9.2.0",
    "pino-pretty": "^11.2.0",
    "@presisso/shared": "workspace:*"
  },
  "devDependencies": {
    "drizzle-kit": "^0.22.0",
    "tsx": "^4.15.0",
    "typescript": "^5.5.0",
    "@types/bcrypt": "^5.0.2",
    "@types/node": "^20.14.0"
  }
}
```

### 4.2 Server Entry Point

```typescript
// apps/api/src/index.ts
import { buildApp } from './app.js';
import { env } from './config/env.js';

const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
```

```typescript
// apps/api/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { authRoutes } from './routes/auth.routes.js';
import { projectRoutes } from './routes/project.routes.js';
import { productRoutes } from './routes/product.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { pdfRoutes } from './routes/pdf.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';
import { errorHandler } from './middleware/error-handler.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // Plugins
  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // Error handler global
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(projectRoutes, { prefix: '/api/projects' });
  await app.register(productRoutes, { prefix: '/api/products' });
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(pdfRoutes, { prefix: '/api/pdf' });
  await app.register(uploadRoutes, { prefix: '/api/upload' });

  return app;
}
```

### 4.3 Validación de Variables de Entorno

```typescript
// apps/api/src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().url(),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string(),
  AWS_CLOUDFRONT_URL: z.string().url(),

  // Claude API
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // 8thWall
  EIGHTHWALL_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

---

## 5. Variables de Entorno

### 5.1 Archivo .env.example (root)

```bash
# .env.example — COPIAR A .env Y COMPLETAR

# === General ===
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# === PostgreSQL ===
DATABASE_URL=postgresql://presisso:presisso_dev@localhost:5432/presisso_studio

# === JWT ===
JWT_SECRET=cambiar-esto-por-un-string-de-al-menos-32-caracteres-seguro
JWT_EXPIRES_IN=7d

# === Google OAuth2 ===
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback

# === AWS S3 + CloudFront ===
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=presisso-studio-assets
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net

# === Anthropic (Claude API) ===
ANTHROPIC_API_KEY=sk-ant-api03-...

# === 8thWall ===
EIGHTHWALL_API_KEY=tu-8thwall-key

# === Vite (frontend — prefijo VITE_) ===
VITE_API_URL=http://localhost:4000/api
VITE_EIGHTHWALL_API_KEY=tu-8thwall-key
VITE_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

---

## 6. Docker para desarrollo local

```yaml
# infra/docker/docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: presisso-db
    environment:
      POSTGRES_USER: presisso
      POSTGRES_PASSWORD: presisso_dev
      POSTGRES_DB: presisso_studio
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U presisso']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

---

## 7. Scripts del Root Package

```json
// package.json (root)
{
  "name": "presisso-studio",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "pnpm --filter @presisso/web dev",
    "dev:api": "pnpm --filter @presisso/api dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "db:up": "docker-compose -f infra/docker/docker-compose.yml up -d",
    "db:down": "docker-compose -f infra/docker/docker-compose.yml down",
    "db:migrate": "pnpm --filter @presisso/api db:migrate",
    "db:seed": "pnpm --filter @presisso/api db:seed",
    "setup": "pnpm install && pnpm db:up && sleep 3 && pnpm db:migrate && pnpm db:seed"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "lint": {}
  }
}
```

---

## 8. Git Config

```gitignore
# .gitignore
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
.turbo/
coverage/
.vercel/
```

---

## 9. Comando de Setup Completo

Ejecutar en orden la primera vez:

```bash
# 1. Clonar el repo
git clone git@github.com:presisso/presisso-studio.git
cd presisso-studio

# 2. Instalar dependencias
pnpm install

# 3. Copiar variables de entorno
cp .env.example .env
# EDITAR .env con los valores reales

# 4. Levantar PostgreSQL
pnpm db:up

# 5. Esperar que la DB esté lista (3 segundos)
sleep 3

# 6. Correr migraciones
pnpm db:migrate

# 7. Cargar datos iniciales
pnpm db:seed

# 8. Levantar todo en paralelo
pnpm dev
# → Frontend en http://localhost:3000
# → Backend en http://localhost:4000
# → Swagger UI en http://localhost:4000/documentation
```

---

## Siguiente paso → `02-BASE-DE-DATOS.md`
