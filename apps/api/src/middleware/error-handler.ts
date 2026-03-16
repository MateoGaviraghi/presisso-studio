import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
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
      statusCode: 400,
    });
  }

  // Fastify rate limit
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: 'Demasiadas solicitudes. Intentá de nuevo en un momento.',
      statusCode: 429,
    });
  }

  const statusCode = error.statusCode ?? 500;
  reply.status(statusCode).send({
    error: error.name || 'Internal Server Error',
    message: statusCode === 500 ? 'Error interno del servidor' : error.message,
    statusCode,
  });
}
