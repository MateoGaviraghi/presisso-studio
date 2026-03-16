import { FastifyInstance } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { projects, projectItems } from '../db/schema.js';
import { authGuard } from '../middleware/auth.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  editorStateSchema,
  addProjectItemSchema,
  updateProjectItemSchema,
  uuidParamSchema,
  projectItemParamsSchema,
} from '@presisso/shared';

export async function projectRoutes(app: FastifyInstance) {
  // All project routes require auth
  app.addHook('preHandler', authGuard);

  // GET /api/projects — My projects (vendors see all)
  app.get('/', async (request) => {
    const userId = request.user!.sub;
    const role = request.user!.role;

    const result = await db.query.projects.findMany({
      where: role === 'vendor' || role === 'admin' ? undefined : eq(projects.userId, userId),
      with: {
        items: { with: { product: true } },
        user: {
          columns: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
      },
      orderBy: [desc(projects.updatedAt)],
    });

    return { projects: result };
  });

  // POST /api/projects — Create project
  app.post('/', async (request, reply) => {
    const body = createProjectSchema.parse(request.body);

    const [project] = await db
      .insert(projects)
      .values({
        userId: request.user!.sub,
        ...body,
      })
      .returning();

    return reply.status(201).send({ project });
  });

  // GET /api/projects/:id — Detail with items
  app.get('/:id', async (request, reply) => {
    const { id } = uuidParamSchema.parse(request.params);
    const userId = request.user!.sub;
    const role = request.user!.role;

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        items: {
          with: { product: true },
          orderBy: [projectItems.sortOrder],
        },
        user: {
          columns: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
      },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Proyecto no encontrado' });
    }

    // Only owner, assigned vendor, or admin can view
    if (role === 'client' && project.userId !== userId) {
      return reply.status(403).send({ error: 'No tenés acceso a este proyecto' });
    }

    return { project };
  });

  // PUT /api/projects/:id — Update project
  app.put('/:id', async (request, reply) => {
    const { id } = uuidParamSchema.parse(request.params);
    const userId = request.user!.sub;
    const role = request.user!.role;
    const body = updateProjectSchema.parse(request.body);

    // Verify ownership
    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      columns: { userId: true },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Proyecto no encontrado' });
    }
    if (role === 'client' && existing.userId !== userId) {
      return reply.status(403).send({ error: 'No tenés acceso a este proyecto' });
    }

    const [updated] = await db
      .update(projects)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    return { project: updated };
  });

  // DELETE /api/projects/:id — Delete project
  app.delete('/:id', async (request, reply) => {
    const { id } = uuidParamSchema.parse(request.params);
    const userId = request.user!.sub;
    const role = request.user!.role;

    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      columns: { userId: true },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Proyecto no encontrado' });
    }
    if (role === 'client' && existing.userId !== userId) {
      return reply.status(403).send({ error: 'No tenés acceso a este proyecto' });
    }

    await db.delete(projects).where(eq(projects.id, id));

    return { success: true };
  });

  // PUT /api/projects/:id/editor-state — Save editor state
  app.put('/:id/editor-state', async (request, reply) => {
    const { id } = uuidParamSchema.parse(request.params);
    const editorState = editorStateSchema.parse(request.body);

    const [updated] = await db
      .update(projects)
      .set({ editorState, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning({ id: projects.id });

    if (!updated) {
      return reply.status(404).send({ error: 'Proyecto no encontrado' });
    }

    return { success: true };
  });

  // POST /api/projects/:id/items — Add furniture item
  app.post('/:id/items', async (request, reply) => {
    const { id } = uuidParamSchema.parse(request.params);
    const body = addProjectItemSchema.parse(request.body);

    // Verify project exists
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      columns: { id: true },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Proyecto no encontrado' });
    }

    const [item] = await db
      .insert(projectItems)
      .values({ projectId: id, ...body })
      .returning();

    // Update project timestamp
    await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, id));

    return reply.status(201).send({ item });
  });

  // PUT /api/projects/:id/items/:itemId — Update item position/rotation
  app.put('/:id/items/:itemId', async (request, reply) => {
    const { itemId } = projectItemParamsSchema.parse(request.params);
    const body = updateProjectItemSchema.parse(request.body);

    const [updated] = await db
      .update(projectItems)
      .set(body)
      .where(eq(projectItems.id, itemId))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: 'Item no encontrado' });
    }

    return { item: updated };
  });

  // DELETE /api/projects/:id/items/:itemId — Remove item
  app.delete('/:id/items/:itemId', async (request, reply) => {
    const { id, itemId } = projectItemParamsSchema.parse(request.params);

    const [deleted] = await db
      .delete(projectItems)
      .where(eq(projectItems.id, itemId))
      .returning({ id: projectItems.id });

    if (!deleted) {
      return reply.status(404).send({ error: 'Item no encontrado' });
    }

    // Update project timestamp
    await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, id));

    return { success: true };
  });
}
