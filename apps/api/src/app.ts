import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { authRoutes } from './routes/auth.routes';

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
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  // await app.register(projectRoutes, { prefix: '/api/projects' });
  // await app.register(productRoutes, { prefix: '/api/products' });
  // await app.register(chatRoutes, { prefix: '/api/chat' });
  // await app.register(pdfRoutes, { prefix: '/api/pdf' });
  // await app.register(uploadRoutes, { prefix: '/api/upload' });

  return app;
}
