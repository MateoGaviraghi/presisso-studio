import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { projects } from '../db/schema.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { uuidParamSchema } from '@presisso/shared';

export async function pdfRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  // POST /api/pdf/generate/:projectId — Generate project proposal PDF
  app.post('/generate/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    // Validate UUID format
    const parsed = uuidParamSchema.safeParse({ id: projectId });
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID de proyecto inválido' });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      with: {
        items: { with: { product: true } },
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Proyecto no encontrado' });
    }

    // Verify ownership
    const userId = request.user!.sub;
    const role = request.user!.role;
    if (role === 'client' && project.userId !== userId) {
      return reply.status(403).send({ error: 'No tenés acceso a este proyecto' });
    }

    // TODO: Implement full PDF generation with Puppeteer (Module 13)
    // Will render HTML template with project data, capture screenshot of 3D editor,
    // and generate branded PDF uploaded to S3.

    return reply.status(501).send({
      message: 'Generación de PDF en desarrollo. Disponible próximamente.',
      projectId,
      projectName: project.name,
      itemCount: project.items.length,
    });
  });
}
