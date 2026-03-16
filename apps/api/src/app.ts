import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';

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
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // Error handler global
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      error: error.name,
      message: statusCode === 500 ? 'Internal Server Error' : error.message,
      statusCode,
    });
  });

  // Health check
  app.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // Routes will be registered here as they are built
  // await app.register(authRoutes, { prefix: '/api/auth' });
  // await app.register(projectRoutes, { prefix: '/api/projects' });
  // await app.register(productRoutes, { prefix: '/api/products' });
  // await app.register(chatRoutes, { prefix: '/api/chat' });
  // await app.register(pdfRoutes, { prefix: '/api/pdf' });
  // await app.register(uploadRoutes, { prefix: '/api/upload' });

  return app;
}
