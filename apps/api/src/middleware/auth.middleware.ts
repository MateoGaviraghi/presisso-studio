import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JwtPayload } from '../utils/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token de autenticación requerido',
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token);
    request.user = payload;
  } catch {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token inválido o expirado',
    });
  }
}

export function requireRole(...roles: Array<'client' | 'vendor' | 'admin'>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authGuard(request, reply);
    if (reply.sent) return;

    if (!request.user || !roles.includes(request.user.role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'No tenés permisos para esta acción',
      });
    }
  };
}
