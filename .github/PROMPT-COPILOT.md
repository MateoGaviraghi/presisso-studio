# PRESISSO STUDIO — Guía para GitHub Copilot (con Claude Opus 4.6)

---

## ⚡ PASO 1: Preparar tu repositorio

### 1.1 Estructura de instrucciones en el repo

GitHub Copilot lee automáticamente las instrucciones de este archivo:

```
presisso-studio/
├── .github/
│   └── copilot-instructions.md   ← Copilot lee esto SIEMPRE (equivale a CLAUDE.md)
├── docs/                          ← Documentación técnica (16 archivos .md)
│   ├── 00-INDICE.md
│   ├── 01-SETUP-ENTORNO.md
│   ├── ...
│   └── 15-QA-EXPO-PREPARACION.md
└── ... (el resto del código)
```

**Acción:** Copiá el archivo `copilot-instructions.md` que te di dentro de `.github/copilot-instructions.md` en tu repo.

### 1.2 Configurar Copilot en VS Code

1. Abrí VS Code con el repo `presisso-studio`
2. Asegurate de tener la extensión **GitHub Copilot Chat** instalada y actualizada
3. En la configuración de Copilot Chat, seleccioná **Claude Opus 4.6** como modelo
4. Verificá que el **Agent mode** esté habilitado (permite crear archivos, correr terminal)

### 1.3 Habilitar instrucciones del repo

En VS Code:

- `Ctrl+Shift+P` → "Copilot: Configure Code Generation"
- O en settings: `"github.copilot.chat.codeGeneration.useInstructionFiles": true`

Esto hace que Copilot lea `.github/copilot-instructions.md` automáticamente en cada conversación.

---

## ⚡ PASO 2: Cómo darle contexto a Copilot

En GitHub Copilot, para referenciar archivos del proyecto en el chat usás `#file`:

```
#file docs/01-SETUP-ENTORNO.md
#file docs/02-BASE-DE-DATOS.md
```

Esto le inyecta el contenido del archivo al contexto. Es el equivalente a que Claude Code "lea" los docs automáticamente.

**TIP IMPORTANTE:** Copilot tiene un límite de contexto. NO le metas los 16 docs de una. Andá de a 2-3 por módulo, como indican los prompts de abajo.

---

## ⚡ PASO 3: Prompts secuenciales (copiar uno por uno)

### MÓDULO 1 — Setup del Monorepo

Abrir Copilot Chat en modo Agent y pegar:

```
Necesito que inicialices el monorepo completo para Presisso Studio.

Contexto: es un configurador web 3D + AR para muebles premium (Argentina).
Stack: React 18 + Vite + Tailwind + Babylon.js (frontend), Node.js + Fastify + Drizzle ORM + PostgreSQL (backend).
Monorepo con pnpm workspaces + Turborepo.

#file docs/01-SETUP-ENTORNO.md

Seguí las instrucciones del documento paso a paso. Creá:
1. Estructura de carpetas completa (apps/web, apps/api, packages/shared, packages/pdf, infra)
2. pnpm-workspace.yaml + turbo.json
3. apps/web: Vite + React 18 + TypeScript + Tailwind CSS 3.4 + Babylon.js 7
4. apps/api: Fastify 4 + TypeScript + Drizzle ORM
5. packages/shared: types compartidos
6. docker-compose.yml para PostgreSQL local
7. .env.example con TODAS las variables listadas en el doc
8. Configs: vite.config.ts, tailwind.config.ts, tsconfig.json
9. Root package.json con scripts: dev, build, db:up, db:migrate, db:seed

Usá la paleta de colores de Presisso:
- presisso-red: #D42B2B, presisso-black: #1A1A1A, presisso-charcoal: #333333, presisso-gray: #6B6B6B

Avisame cuando esté listo para continuar con la base de datos.
```

---

### MÓDULO 2 — Base de Datos + Auth

```
Implementá la base de datos y el sistema de autenticación.

#file docs/02-BASE-DE-DATOS.md
#file docs/03-AUTENTICACION.md

Implementá:
1. Schema completo de Drizzle ORM en apps/api/src/db/schema.ts:
   - users (uuid, email, passwordHash, name, role enum client/vendor/admin, googleId)
   - products (sku, name, category enum, roomType enum, dimensiones cm, modelUrl GLB, materials JSONB, precios)
   - projects (userId, vendorId, roomType, medidas, backgroundImageUrl, editorState JSONB, status enum)
   - project_items (projectId, productId, posición XYZ, rotationY, scale, selectedMaterialId)
   - chat_messages (projectId, userId, role user/assistant, content, modelUsed, tokensUsed)
   Con todas las relaciones y índices.
2. Conexión PostgreSQL en apps/api/src/db/index.ts
3. migrate.ts y seed.ts (3 usuarios + 5 productos con materiales JSONB)
4. JWT utils con jose (sign + verify) en apps/api/src/utils/jwt.ts
5. Password hashing con bcrypt en apps/api/src/utils/hash.ts
6. Auth middleware (authGuard + requireRole) en apps/api/src/middleware/
7. Auth routes completas: register, login, Google OAuth flow, GET /me
8. Env validation con Zod en apps/api/src/config/env.ts
9. Error handler global en Fastify

Corré las migraciones y verificá que el seed funciona.
```

---

### MÓDULO 3 — API REST + Storage

```
Implementá la API REST completa y el servicio de storage S3.

#file docs/04-API-BACKEND.md
#file docs/05-STORAGE-CDN.md

Implementá:
1. Product routes: GET / (con filtros category, roomType, search), GET /:id, POST, PUT, DELETE
2. Project routes: CRUD + POST /:id/items, PUT/DELETE /:id/items/:itemId, PUT /:id/editor-state
3. S3 service: uploadFile, getPresignedUploadUrl, deleteFile (usando @aws-sdk/client-s3)
4. Upload routes: POST /upload/image (multipart, max 10MB), POST /upload/model (admin only)
5. PDF route placeholder: POST /pdf/generate/:projectId
6. Validación de request bodies con Zod en todas las rutas
7. Auth guard en las rutas que lo requieren

Todos los endpoints bajo /api/ prefix.
```

---

### MÓDULO 4 — Frontend Base + Layout

```
Armá el frontend base con routing, auth y layout premium.

#file docs/06-FRONTEND-BASE.md

Implementá:
1. App.tsx con react-router-dom: rutas protegidas (ProtectedRoute con redirect a /login)
2. AuthContext: login, register, loginWithGoogle, logout, auto-load token de localStorage
3. API client (apps/web/src/services/api-client.ts) con Bearer token automático
4. MainLayout: sidebar negro (#1A1A1A) con logo PNG de Presisso, navegación con links rojos activos, user info, logout
5. LoginPage: formulario email/password + botón "Continuar con Google" + branding Presisso
6. DashboardPage: grid de proyectos del usuario con cards (nombre, roomType, fecha, status)
7. Zustand editor-store.ts: projectId, items, selectedItemId, backgroundImageUrl, roomDimensions
8. AuthCallbackPage: parsea ?token= del redirect de Google OAuth

DISEÑO: Elegancia premium. Sidebar negro con acentos rojos. Cards con bordes sutiles y sombras mínimas.
Usá Inter para body, Playfair Display para títulos grandes. NO diseño genérico de AI.
```

---

### MÓDULO 5 — Editor 3D + Catálogo

```
Implementá el editor 3D con Babylon.js y el catálogo de productos.

#file docs/07-EDITOR-3D.md
#file docs/08-CATALOGO-PRODUCTOS.md
#file docs/09-DRAG-DROP-INTERACCION.md

Implementá:
1. SceneCanvas.tsx: componente React que monta Babylon.js Engine (preserveDrawingBuffer para PDF)
2. editor-scene.ts: Scene + ArcRotateCamera + HemisphericLight + DirectionalLight + ShadowGenerator + GridMaterial
3. Carga de modelos GLB con SceneLoader.ImportMeshAsync + sombras
4. InteractionManager: PointerDragBehavior (drag en plano XZ), selección con HighlightLayer dorado, rotación, escala, snapping
5. EditorToolbar: botones de rotar ±45°, escalar ±, eliminar, toggle grid, guardar
6. ProductGrid: grid de productos con filtros (roomType, category, search)
7. ProductCard: thumbnail, info, materiales como círculos de color, botón "Agregar al editor"
8. Mini-viewer 3D en hover del ProductCard (auto-rotate del modelo GLB)
9. Keyboard shortcuts: Delete, R, E, +, -, Escape
10. takeScreenshot() para exportar a PDF después

EditorPage.tsx: layout con SceneCanvas (70% ancho) + sidebar derecho (catálogo + chat + propiedades).
Performance: max 5 modelos simultáneos en escena.
```

---

### MÓDULO 6 — Foto + AR + IA + PDF (WOW factor)

```
Implementá las features de impacto para la expo.

#file docs/10-FOTO-ESPACIO.md
#file docs/11-AR-8THWALL.md
#file docs/12-ASISTENTE-IA-CLAUDE.md
#file docs/13-PDF-EXPORT.md

Implementá:
1. PhotoUpload: upload de JPG/PNG a S3, preview, aplicar como Layer background en Babylon.js
2. RoomDimensions: inputs de ancho × alto × profundidad (cm), actualizar escala del grid
3. ArPage: integración 8thWall SDK + Babylon.js (cargar dinámicamente). Surface detection, model placement con toque, rotar/escalar, captura de foto
4. Claude service (backend): buildSystemPrompt dinámico con catálogo completo + items del proyecto + medidas. Personalidad "Studio" en español argentino
5. Chat route: POST /api/chat con SSE streaming. Guardar mensajes en chat_messages
6. ChatPanel: UI de chat con streaming token por token, avatar bot rojo, bienvenida contextual
7. PDF service: Puppeteer renderiza HTML branded → PDF. Portada Presisso (#1A1A1A + rojo), screenshot del editor, tabla de productos
8. PdfDownloadButton: toma screenshot del canvas, envía a /api/pdf/generate, descarga el PDF

CRÍTICO: API key de Claude SOLO en backend (.env). Chat usa SSE (text/event-stream).
```

---

### MÓDULO 7 — Deploy + QA + Expo

```
Configurá deploy a producción y prepará la expo.

#file docs/14-DEPLOY-PRODUCCION.md
#file docs/15-QA-EXPO-PREPARACION.md

Implementá:
1. Dockerfile.api con Node 20 + Chromium para Puppeteer
2. vercel.json para el frontend (SPA rewrites)
3. GitHub Actions: CI (lint + type-check en PR), deploy (push a main → Railway + Vercel)
4. seed-demo.ts: usuario demo@presisso.com + proyecto pre-armado con muebles posicionados
5. 3-5 fotos de ambientes de ejemplo subidas a S3
6. Health check endpoint: GET /api/health
7. Variables de entorno configuradas en Railway y Vercel
8. Verificar flujo completo: login → catálogo → editor → foto → mueble 3D → AR → chat IA → PDF
```

---

## 💡 Tips para usar Copilot eficientemente en este proyecto

1. **Agent mode vs Edit mode**: Usá **Agent mode** (el ícono de robot en el chat) para crear archivos y correr comandos. Es el que más se parece a Claude Code.

2. **Referenciar archivos**: Siempre usá `#file docs/XX-NOMBRE.md` al principio del prompt. Copilot necesita que le digas explícitamente qué archivos leer.

3. **Workspace context**: Copilot ve los archivos abiertos en el editor. Si estás trabajando en el backend, tené abierto `apps/api/src/app.ts` para que tenga contexto.

4. **No sobrecargar contexto**: Max 3-4 `#file` por prompt. Si le metés demasiado, pierde foco.

5. **Terminal**: En Agent mode, Copilot puede correr comandos en la terminal. Dejalo que haga `pnpm install`, `pnpm db:migrate`, etc.

6. **Iteración rápida**: Si algo no sale bien, en vez de re-explicar todo, decile "mirá el archivo X que acabás de crear, el error está en la línea Y, corregilo".

7. **`@workspace`**: Usá `@workspace` en el chat para que Copilot busque contexto en todo tu proyecto. Ejemplo: `@workspace cómo está definido el schema de products?`
