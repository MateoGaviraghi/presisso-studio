import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { users } from '../db/schema';
import { signToken } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/hash';
import { authGuard } from '../middleware/auth.middleware';
import { env } from '../config/env';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // ========== REGISTER ==========
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existing = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });
    if (existing) {
      return reply.status(409).send({ error: 'El email ya está registrado' });
    }

    const passwordHash = await hashPassword(body.password);
    const [user] = await db
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        name: body.name,
        phone: body.phone,
        role: 'client',
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    const token = await signToken({ sub: user.id, email: user.email, role: user.role });
    return reply.status(201).send({ token, user });
  });

  // ========== LOGIN ==========
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const token = await signToken({ sub: user.id, email: user.email, role: user.role });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  });

  // ========== GOOGLE OAUTH - REDIRECT ==========
  app.get('/google', async (_request, reply) => {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  // ========== GOOGLE OAUTH - CALLBACK ==========
  app.get('/google/callback', async (request, reply) => {
    const { code } = request.query as { code: string };

    if (!code) {
      return reply.status(400).send({ error: 'Authorization code requerido' });
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: env.GOOGLE_REDIRECT_URI,
      }),
    });
    const tokens = (await tokenRes.json()) as { access_token: string };

    if (!tokens.access_token) {
      return reply.status(400).send({ error: 'Error al autenticar con Google' });
    }

    // Get user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = (await userInfoRes.json()) as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    // Upsert user
    let user = await db.query.users.findFirst({
      where: eq(users.googleId, googleUser.id),
    });

    if (!user) {
      user = await db.query.users.findFirst({
        where: eq(users.email, googleUser.email),
      });

      if (user) {
        await db
          .update(users)
          .set({ googleId: googleUser.id, avatarUrl: googleUser.picture })
          .where(eq(users.id, user.id));
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.id,
            avatarUrl: googleUser.picture,
            role: 'client',
          })
          .returning();
        user = newUser;
      }
    }

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const jwt = await signToken({ sub: user.id, email: user.email, role: user.role });

    return reply.redirect(`${env.FRONTEND_URL}/auth/callback?token=${jwt}`);
  });

  // ========== GET CURRENT USER ==========
  app.get('/me', { preHandler: [authGuard] }, async (request) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user!.sub),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        phone: true,
      },
    });
    return { user };
  });
}
