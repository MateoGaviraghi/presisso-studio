import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { authGuard, requireRole } from '../middleware/auth.middleware.js';
import { uploadFile } from '../services/s3.service.js';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const ALLOWED_MODEL_TYPES = new Set(['model/gltf-binary', 'application/octet-stream']);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_MODEL_SIZE = 50 * 1024 * 1024; // 50 MB

export async function uploadRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  // POST /api/upload/image — Upload space photo (multipart, max 10MB)
  app.post('/image', async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No se envió archivo' });
    }

    if (!ALLOWED_IMAGE_TYPES.has(data.mimetype)) {
      return reply.status(400).send({
        error: 'Tipo de archivo no permitido. Usar JPEG, PNG, WebP o AVIF.',
      });
    }

    const buffer = await data.toBuffer();

    if (buffer.length > MAX_IMAGE_SIZE) {
      return reply.status(400).send({
        error: 'La imagen excede el límite de 10MB',
      });
    }

    const ext = data.filename.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ext.replace(/[^a-z0-9]/g, '');
    const key = `uploads/${request.user!.sub}/${randomUUID()}.${safeExt}`;

    const url = await uploadFile(key, buffer, data.mimetype);

    return { url, key, sizeBytes: buffer.length };
  });

  // POST /api/upload/model — Upload GLB model (admin only, max 50MB)
  app.post('/model', { preHandler: [requireRole('admin')] }, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No se envió archivo' });
    }

    if (!ALLOWED_MODEL_TYPES.has(data.mimetype)) {
      return reply.status(400).send({
        error: 'Tipo de archivo no permitido. Usar GLB (model/gltf-binary).',
      });
    }

    const buffer = await data.toBuffer();

    if (buffer.length > MAX_MODEL_SIZE) {
      return reply.status(400).send({
        error: 'El modelo excede el límite de 50MB',
      });
    }

    // Sanitize filename: only allow alphanumeric, hyphens, dots
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `models/${safeName}`;

    const url = await uploadFile(key, buffer, 'model/gltf-binary');

    return { url, key, sizeBytes: buffer.length };
  });
}
