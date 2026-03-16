# PRESISSO STUDIO — Documentación Técnica Completa

## Índice de Documentos

Cada archivo contiene el paso a paso técnico completo para implementar ese módulo del sistema. Los documentos están ordenados por dependencia: cada fase asume que las anteriores están completadas.

---

### Fase 0 — Fundaciones
| # | Archivo | Contenido | Sprint |
|---|---------|-----------|--------|
| 01 | `01-SETUP-ENTORNO.md` | Monorepo, Node, React, Vite, Tailwind, Babylon.js, estructura de carpetas, scripts, linting | S1 |
| 02 | `02-BASE-DE-DATOS.md` | PostgreSQL, Drizzle ORM, schema completo, migraciones, seeds, relaciones | S1 |
| 03 | `03-AUTENTICACION.md` | JWT, Google OAuth2, middleware Fastify, refresh tokens, roles | S1 |

### Fase 1 — Backend + API
| # | Archivo | Contenido | Sprint |
|---|---------|-----------|--------|
| 04 | `04-API-BACKEND.md` | Fastify, rutas REST, controllers, services, validación, error handling, CORS | S1 |
| 05 | `05-STORAGE-CDN.md` | AWS S3, CloudFront, pipeline SKP→GLB, upload de imágenes, presigned URLs | S1 |

### Fase 2 — Frontend + Editor 3D
| # | Archivo | Contenido | Sprint |
|---|---------|-----------|--------|
| 06 | `06-FRONTEND-BASE.md` | React 18, Vite config, Tailwind, routing, layout, hooks, API client, estado global | S1 |
| 07 | `07-EDITOR-3D.md` | Babylon.js scene, cámara, iluminación PBR, carga GLB, grid, scene serialization | S1-S2 |
| 08 | `08-CATALOGO-PRODUCTOS.md` | Grid de productos, filtros, mini-viewer 3D, sidebar de selección, API integration | S1-S2 |

### Fase 3 — Interacción Avanzada
| # | Archivo | Contenido | Sprint |
|---|---------|-----------|--------|
| 09 | `09-DRAG-DROP-INTERACCION.md` | PointerDragBehavior, gizmos, rotación, escala, snapping, undo/redo | S2 |
| 10 | `10-FOTO-ESPACIO.md` | Upload de foto, background layer, medidas del espacio, ajuste de perspectiva | S2 |
| 11 | `11-AR-8THWALL.md` | 8thWall SDK, integración Babylon.js, surface detection, model placement, captura | S2 |

### Fase 4 — IA + Generación
| # | Archivo | Contenido | Sprint |
|---|---------|-----------|--------|
| 12 | `12-ASISTENTE-IA-CLAUDE.md` | Claude API, system prompts, streaming, contexto dinámico, UI del chat | S2 |
| 13 | `13-PDF-EXPORT.md` | Puppeteer, template HTML branded, screenshot 3D, generación y descarga | S3 |

### Fase 5 — Deploy + Expo
| # | Archivo | Contenido | Sprint |
|---|---------|-----------|--------|
| 14 | `14-DEPLOY-PRODUCCION.md` | Railway, Vercel, Docker, CI/CD, variables de entorno, dominio, SSL, monitoring | S3 |
| 15 | `15-QA-EXPO-PREPARACION.md` | Testing manual, cross-browser, checklist expo, plan de contingencia, datos demo | S3 |

---

## Stack Tecnológico Completo

```
Frontend:    React 18 + Vite 5 + Tailwind CSS 3.4
Motor 3D:    Babylon.js 7.x
AR:          8thWall (Web AR SDK)
Backend:     Node.js 20 LTS + Fastify 4
ORM:         Drizzle ORM
DB:          PostgreSQL 16
Auth:        JWT (jose) + Google OAuth2
Storage:     AWS S3 + CloudFront CDN
IA:          Claude API (Anthropic) — claude-sonnet-4-20250514
PDF:         Puppeteer 22
Hosting:     Railway (backend) + Vercel (frontend)
CI/CD:       GitHub Actions
Monorepo:    pnpm workspaces
```

## Convenciones del Proyecto

- **Lenguaje de código**: TypeScript estricto en todo el proyecto
- **Estilo de código**: ESLint + Prettier (config compartida)
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Branches**: `main` (prod), `develop` (staging), `feat/*` (features)
- **Nombres de archivos**: kebab-case (`product-catalog.tsx`)
- **Nombres de componentes**: PascalCase (`ProductCatalog`)
- **Variables de entorno**: SCREAMING_SNAKE_CASE (`DATABASE_URL`)
