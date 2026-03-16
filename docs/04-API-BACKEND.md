# 04 — API Backend (Fastify REST)

> **Sprint**: 1 (Día 4-6)
> **Dependencias**: `02-BASE-DE-DATOS.md`, `03-AUTENTICACION.md`
> **Resultado**: API REST completa con CRUD de productos, proyectos y upload
> **Skills a leer antes de implementar**: `neon-drizzle`, `neon-postgres`, `supabase-postgres-best-practices`, `webapp-testing`

---

## 1. Endpoints Completos

| Método   | Ruta                              | Auth         | Descripción                    |
| -------- | --------------------------------- | ------------ | ------------------------------ |
| `GET`    | `/api/health`                     | No           | Health check                   |
| `POST`   | `/api/auth/register`              | No           | Registro                       |
| `POST`   | `/api/auth/login`                 | No           | Login                          |
| `GET`    | `/api/auth/google`                | No           | OAuth redirect                 |
| `GET`    | `/api/auth/google/callback`       | No           | OAuth callback                 |
| `GET`    | `/api/auth/me`                    | Sí           | Usuario actual                 |
| `GET`    | `/api/products`                   | No           | Listar productos (con filtros) |
| `GET`    | `/api/products/:id`               | No           | Detalle de producto            |
| `POST`   | `/api/products`                   | Admin/Vendor | Crear producto                 |
| `PUT`    | `/api/products/:id`               | Admin/Vendor | Editar producto                |
| `DELETE` | `/api/products/:id`               | Admin        | Eliminar producto              |
| `GET`    | `/api/projects`                   | Sí           | Mis proyectos                  |
| `POST`   | `/api/projects`                   | Sí           | Crear proyecto                 |
| `GET`    | `/api/projects/:id`               | Sí           | Detalle proyecto (con items)   |
| `PUT`    | `/api/projects/:id`               | Sí           | Actualizar proyecto            |
| `DELETE` | `/api/projects/:id`               | Sí           | Eliminar proyecto              |
| `POST`   | `/api/projects/:id/items`         | Sí           | Agregar mueble al proyecto     |
| `PUT`    | `/api/projects/:id/items/:itemId` | Sí           | Actualizar posición/rotación   |
| `DELETE` | `/api/projects/:id/items/:itemId` | Sí           | Quitar mueble del proyecto     |
| `PUT`    | `/api/projects/:id/editor-state`  | Sí           | Guardar estado del editor      |
| `POST`   | `/api/chat`                       | Sí           | Enviar mensaje al asistente IA |
| `GET`    | `/api/chat/:projectId/history`    | Sí           | Historial de chat del proyecto |
| `POST`   | `/api/upload/image`               | Sí           | Subir foto del espacio         |
| `POST`   | `/api/upload/model`               | Admin        | Subir modelo GLB               |
| `POST`   | `/api/pdf/generate/:projectId`    | Sí           | Generar PDF de propuesta       |

---

## 2. Products Routes

```typescript
// apps/api/src/routes/product.routes.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, ilike, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { authGuard, requireRole } from '../middleware/auth.middleware.js';

const querySchema = z.object({
  category: z.string().optional(),
  roomType: z.string().optional(),
  line: z.string().optional(),
  search: z.string().optional(),
});

export async function productRoutes(app: FastifyInstance) {
  // GET /api/products — Listar con filtros
  app.get('/', async (request) => {
    const query = querySchema.parse(request.query);
    const conditions = [eq(products.isActive, true)];

    if (query.category) conditions.push(eq(products.category, query.category as any));
    if (query.roomType) conditions.push(eq(products.roomType, query.roomType as any));
    if (query.search) conditions.push(ilike(products.name, `%${query.search}%`));

    const result = await db.query.products.findMany({
      where: and(...conditions),
      orderBy: [asc(products.sortOrder)],
    });

    return { products: result };
  });

  // GET /api/products/:id — Detalle
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });
    if (!product) return reply.status(404).send({ error: 'Producto no encontrado' });
    return { product };
  });

  // POST /api/products — Crear (solo vendor/admin)
  app.post('/', { preHandler: [requireRole('vendor', 'admin')] }, async (request, reply) => {
    const body = request.body as any;
    const [product] = await db.insert(products).values(body).returning();
    return reply.status(201).send({ product });
  });
}
```

---

## 3. Projects Routes

```typescript
// apps/api/src/routes/project.routes.ts
import { FastifyInstance } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { projects, projectItems } from '../db/schema.js';
import { authGuard } from '../middleware/auth.middleware.js';

export async function projectRoutes(app: FastifyInstance) {
  // Todas las rutas requieren auth
  app.addHook('preHandler', authGuard);

  // GET /api/projects — Mis proyectos
  app.get('/', async (request) => {
    const userId = request.user!.sub;
    const isVendor = request.user!.role === 'vendor';

    const result = await db.query.projects.findMany({
      where: isVendor ? undefined : eq(projects.userId, userId),
      with: { items: { with: { product: true } }, user: true },
      orderBy: [desc(projects.updatedAt)],
    });

    return { projects: result };
  });

  // POST /api/projects — Crear proyecto
  app.post('/', async (request, reply) => {
    const body = request.body as any;
    const [project] = await db
      .insert(projects)
      .values({
        userId: request.user!.sub,
        name: body.name || 'Mi Proyecto',
        roomType: body.roomType || 'kitchen',
        roomWidthCm: body.roomWidthCm,
        roomHeightCm: body.roomHeightCm,
        roomDepthCm: body.roomDepthCm,
      })
      .returning();
    return reply.status(201).send({ project });
  });

  // GET /api/projects/:id — Detalle con items
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        items: { with: { product: true }, orderBy: [projectItems.sortOrder] },
        user: true,
      },
    });
    if (!project) return reply.status(404).send({ error: 'Proyecto no encontrado' });
    return { project };
  });

  // PUT /api/projects/:id — Actualizar
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const [updated] = await db
      .update(projects)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    if (!updated) return reply.status(404).send({ error: 'Proyecto no encontrado' });
    return { project: updated };
  });

  // PUT /api/projects/:id/editor-state — Guardar estado del editor
  app.put('/:id/editor-state', async (request) => {
    const { id } = request.params as { id: string };
    const { editorState } = request.body as any;
    await db
      .update(projects)
      .set({ editorState, updatedAt: new Date() })
      .where(eq(projects.id, id));
    return { success: true };
  });

  // POST /api/projects/:id/items — Agregar mueble
  app.post('/:id/items', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const [item] = await db
      .insert(projectItems)
      .values({
        projectId: id,
        productId: body.productId,
        positionX: body.positionX || '0',
        positionY: body.positionY || '0',
        positionZ: body.positionZ || '0',
        rotationY: body.rotationY || '0',
        scale: body.scale || '1',
        selectedMaterialId: body.selectedMaterialId,
      })
      .returning();

    // Actualizar timestamp del proyecto
    await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, id));

    return reply.status(201).send({ item });
  });

  // PUT /api/projects/:id/items/:itemId — Actualizar posición
  app.put('/:id/items/:itemId', async (request) => {
    const { itemId } = request.params as { itemId: string };
    const body = request.body as any;
    const [updated] = await db
      .update(projectItems)
      .set(body)
      .where(eq(projectItems.id, itemId))
      .returning();
    return { item: updated };
  });

  // DELETE /api/projects/:id/items/:itemId — Quitar mueble
  app.delete('/:id/items/:itemId', async (request) => {
    const { itemId } = request.params as { itemId: string };
    await db.delete(projectItems).where(eq(projectItems.id, itemId));
    return { success: true };
  });
}
```

---

## 4. Error Handler Global

```typescript
// apps/api/src/middleware/error-handler.ts
import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Datos inválidos',
      details: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Fastify built-in errors
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
  }

  // Unknown errors
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Ocurrió un error inesperado',
  });
}
```

---

## Siguiente paso → `05-STORAGE-CDN.md`
