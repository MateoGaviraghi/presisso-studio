import { FastifyInstance } from 'fastify';
import { eq, and, ilike, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { requireRole } from '../middleware/auth.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  uuidParamSchema,
} from '@presisso/shared';

export async function productRoutes(app: FastifyInstance) {
  // GET /api/products — List with filters (public)
  app.get('/', async (request) => {
    const query = productQuerySchema.parse(request.query);
    const conditions = [eq(products.isActive, true)];

    if (query.category) {
      conditions.push(eq(products.category, query.category));
    }
    if (query.roomType) {
      conditions.push(eq(products.roomType, query.roomType));
    }
    if (query.search) {
      conditions.push(ilike(products.name, `%${query.search}%`));
    }

    const result = await db.query.products.findMany({
      where: and(...conditions),
      orderBy: [asc(products.sortOrder)],
    });

    return { products: result };
  });

  // GET /api/products/:id — Detail (public)
  app.get('/:id', async (request, reply) => {
    const { id } = uuidParamSchema.parse(request.params);

    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      return reply.status(404).send({ error: 'Producto no encontrado' });
    }

    return { product };
  });

  // POST /api/products — Create (vendor/admin)
  app.post('/', { preHandler: [requireRole('vendor', 'admin')] }, async (request, reply) => {
    const body = createProductSchema.parse(request.body);

    const [product] = await db.insert(products).values(body).returning();

    return reply.status(201).send({ product });
  });

  // PUT /api/products/:id — Update (vendor/admin)
  app.put('/:id', { preHandler: [requireRole('vendor', 'admin')] }, async (request, reply) => {
    const { id } = uuidParamSchema.parse(request.params);
    const body = updateProductSchema.parse(request.body);

    const [updated] = await db
      .update(products)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: 'Producto no encontrado' });
    }

    return { product: updated };
  });

  // DELETE /api/products/:id — Soft delete (admin only)
  app.delete('/:id', { preHandler: [requireRole('admin')] }, async (request, reply) => {
    const { id } = uuidParamSchema.parse(request.params);

    const [deleted] = await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!deleted) {
      return reply.status(404).send({ error: 'Producto no encontrado' });
    }

    return { success: true };
  });
}
