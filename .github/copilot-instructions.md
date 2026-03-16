# Presisso Studio — Instrucciones para Copilot

## Qué es este proyecto

Presisso Studio es un configurador web 3D + AR para Presisso Muebles (Argentina). Permite a clientes visualizar muebles premium en 3D sobre fotos de su espacio real y en realidad aumentada con la cámara del celular. Incluye un asistente IA (Claude API) y generación de propuestas PDF branded.

Hay una EXPO en 4 semanas. Todo lo que construimos debe ser funcional para esa fecha.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3.4 + Babylon.js 7 + Zustand
- **Backend**: Node.js 20 + Fastify 4 + Drizzle ORM + PostgreSQL 16
- **AR**: 8thWall (web AR sin app)
- **IA**: Claude API (Anthropic) — proxy desde backend, NUNCA exponer API key al frontend
- **PDF**: Puppeteer 22
- **Storage**: AWS S3 + CloudFront CDN (modelos GLB)
- **Auth**: JWT (jose) + Google OAuth2
- **Deploy**: Vercel (frontend) + Railway (backend + DB)

## Estructura del monorepo

```
apps/web/          → React + Babylon.js + Tailwind (port 3000)
apps/api/          → Fastify REST API (port 4000)
packages/shared/   → Types + validators compartidos
packages/pdf/      → Templates HTML + Puppeteer renderer
infra/             → Docker, scripts, CI/CD
docs/              → 16 archivos .md con documentación técnica paso a paso
```

## Comandos principales

```bash
pnpm dev           # Levanta frontend + backend en paralelo
pnpm dev:web       # Solo frontend (localhost:3000)
pnpm dev:api       # Solo backend (localhost:4000)
pnpm build         # Build de todo
pnpm db:up         # Levantar PostgreSQL con Docker
pnpm db:migrate    # Correr migraciones de Drizzle
pnpm db:seed       # Cargar datos iniciales (usuarios + 5 productos)
pnpm lint          # ESLint en todo el proyecto
```

## Convenciones de código

- TypeScript estricto. No `any` salvo excepciones documentadas.
- Componentes React: functional + hooks. No class components.
- Archivos: kebab-case. Componentes: PascalCase. Variables: camelCase.
- Babylon.js scenes en `apps/web/src/scenes/`, NO inline en componentes React.
- API client centralizado en `apps/web/src/services/api-client.ts`.
- Validación de bodies con Zod. Env vars validadas con Zod.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Path aliases: `@/` → `src/`, `@shared/` → `packages/shared/src/`.
- Estado global: Zustand. Estado de auth: React Context.
- Estilos: Tailwind CSS utilities + @layer components para custom.

## Base de datos (PostgreSQL 16 + Drizzle ORM)

5 tablas:

- `users` — roles: client/vendor/admin. Auth con JWT + Google OAuth.
- `products` — catálogo de muebles. Materiales en JSONB. modelUrl apunta a GLB en CDN.
- `projects` — configuraciones del cliente. editorState serializado en JSONB.
- `project_items` — muebles colocados en un proyecto con posición 3D (x,y,z), rotación, escala.
- `chat_messages` — historial del asistente IA por proyecto.

## API Endpoints

- Auth: POST /api/auth/register, /login. GET /auth/google, /google/callback, /me
- Products: GET /api/products (filtros: category, roomType, search), GET/POST/PUT/DELETE /:id
- Projects: CRUD completo + POST /:id/items, PUT/DELETE /:id/items/:itemId, PUT /:id/editor-state
- Chat: POST /api/chat (SSE streaming), GET /api/chat/:projectId/history
- Upload: POST /api/upload/image, /api/upload/model
- PDF: POST /api/pdf/generate/:projectId

## Paleta de marca Presisso

- Red: #D42B2B (acento rojo — color principal de marca)
- Red hover: #B82424 (hover/active del rojo)
- Red light: #FDF2F2 (fondo rojo sutil)
- Black: #1A1A1A (negro principal — header, sidebar, footer)
- Charcoal: #333333 (texto principal)
- Gray: #6B6B6B (texto secundario)
- Surfaces: #FFFFFF (primary), #FAFAF9 (secondary), #F5F5F3 (tertiary)
- Border: #E5E5E5
- Fuentes: Inter (body), Playfair Display (display/títulos)
- Estilo: elegancia premium, negro + rojo. NO usar diseño genérico o "AI slop".

## Documentación técnica

ANTES de implementar cualquier módulo, LEER el archivo correspondiente en `docs/`:

- `01-SETUP-ENTORNO.md` — Monorepo, configs, estructura, dependencias
- `02-BASE-DE-DATOS.md` — Schema Drizzle completo, migraciones, seeds
- `03-AUTENTICACION.md` — JWT, Google OAuth, middleware de roles
- `04-API-BACKEND.md` — Rutas REST, controllers, validación Zod
- `05-STORAGE-CDN.md` — AWS S3, CloudFront, pipeline SKP→GLB
- `06-FRONTEND-BASE.md` — React routing, auth context, layout, stores
- `07-EDITOR-3D.md` — Babylon.js scene, cámara, luces PBR, carga GLB
- `08-CATALOGO-PRODUCTOS.md` — Grid productos, filtros, mini-viewer 3D
- `09-DRAG-DROP-INTERACCION.md` — PointerDragBehavior, gizmos, toolbar
- `10-FOTO-ESPACIO.md` — Upload foto, background layer, medidas espacio
- `11-AR-8THWALL.md` — 8thWall SDK + Babylon.js, surface detection
- `12-ASISTENTE-IA-CLAUDE.md` — Claude API, system prompt dinámico, streaming
- `13-PDF-EXPORT.md` — Puppeteer, template branded, screenshot del editor
- `14-DEPLOY-PRODUCCION.md` — Railway, Vercel, Docker, CI/CD, SSL
- `15-QA-EXPO-PREPARACION.md` — Testing, checklist expo, plan contingencia

## Reglas críticas

1. Claude API key: SOLO en el backend. NUNCA en el frontend. Siempre proxy.
2. Performance 3D: Max 5 modelos simultáneos. Draco compression en GLBs.
3. Deadline: 4 semanas para expo. Funcionalidad > perfección.
4. Prioridad: Editor 3D (P0) > AR (P1) > IA (P2) > PDF (P2) > Materiales (P3).
5. Diseño UI: premium y elegante, acorde a marca de muebles de alta gama.
