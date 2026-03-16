# 03 — Autenticación (JWT + Google OAuth2)

> **Sprint**: 1 (Día 2-4)
> **Dependencias**: `01-SETUP-ENTORNO.md`, `02-BASE-DE-DATOS.md`
> **Resultado**: Login/registro funcional con JWT y Google OAuth
> **Skills a leer antes de implementar**: `neon-drizzle`, `neon-postgres`, `supabase-postgres-best-practices`

---

## 1. Arquitectura de Auth

```
Cliente                Backend (Fastify)              PostgreSQL
  │                         │                            │
  ├─ POST /auth/register ──→│─ hash password ───────────→│ INSERT user
  ├─ POST /auth/login ─────→│─ verify password ─────────→│ SELECT user
  │                         │─ sign JWT ────→ token       │
  │←── { token, user } ────│                             │
  │                         │                            │
  ├─ GET /auth/google ─────→│─ redirect to Google ──→ Google OAuth
  │←── redirect callback ──│←── code ──── Google        │
  │                         │─ exchange code → tokens    │
  │                         │─ get user info ──→ Google  │
  │                         │─ upsert user ─────────────→│
  │←── { token, user } ────│                             │
  │                         │                            │
  ├─ GET /api/* ───────────→│─ verify JWT (middleware)    │
  │   Authorization:        │─ attach user to request     │
  │   Bearer <token>        │─ proceed to route handler   │
```

---

## 2. Utilidades JWT

```typescript
// apps/api/src/utils/jwt.ts
import * as jose from 'jose';
import { env } from '../config/env.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const issuer = 'presisso-studio';
const audience = 'presisso-client';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: 'client' | 'vendor' | 'admin';
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jose.jwtVerify(token, secret, {
    issuer,
    audience,
  });
  return payload as unknown as JwtPayload;
}
```

---

## 3. Password Hashing

```typescript
// apps/api/src/utils/hash.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

## 4. Auth Middleware

```typescript
// apps/api/src/middleware/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JwtPayload } from '../utils/jwt.js';

// Extend Fastify request type
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
  } catch (err) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token inválido o expirado',
    });
  }
}

// Middleware para roles específicos
export function requireRole(...roles: Array<'client' | 'vendor' | 'admin'>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authGuard(request, reply);
    if (reply.sent) return; // authGuard already replied with 401

    if (!request.user || !roles.includes(request.user.role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'No tenés permisos para esta acción',
      });
    }
  };
}
```

---

## 5. Auth Routes

```typescript
// apps/api/src/routes/auth.routes.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { signToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { env } from '../config/env.js';

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

    // Verificar si el email ya existe
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

    // Actualizar último login
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
  app.get('/google', async (request, reply) => {
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

    // Intercambiar code por tokens
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
    const tokens = await tokenRes.json();

    // Obtener info del usuario
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userInfoRes.json();

    // Upsert usuario
    let user = await db.query.users.findFirst({
      where: eq(users.googleId, googleUser.id),
    });

    if (!user) {
      // Verificar si existe por email
      user = await db.query.users.findFirst({
        where: eq(users.email, googleUser.email),
      });

      if (user) {
        // Vincular Google ID al usuario existente
        await db
          .update(users)
          .set({
            googleId: googleUser.id,
            avatarUrl: googleUser.picture,
          })
          .where(eq(users.id, user.id));
      } else {
        // Crear nuevo usuario
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

    // Redirect al frontend con el token
    return reply.redirect(`${env.FRONTEND_URL}/auth/callback?token=${jwt}`);
  });

  // ========== GET CURRENT USER ==========
  app.get('/me', { preHandler: [authGuard] }, async (request) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user!.sub),
      columns: { id: true, email: true, name: true, role: true, avatarUrl: true, phone: true },
    });
    return { user };
  });
}
```

---

## 6. Google Cloud Console — Setup OAuth2

### Paso a paso:

1. Ir a `console.cloud.google.com`
2. Crear proyecto "Presisso Studio"
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: **Web application**
5. Authorized redirect URIs:
   - Development: `http://localhost:4000/api/auth/google/callback`
   - Production: `https://api.presisso.studio/api/auth/google/callback`
6. Copiar Client ID y Client Secret al `.env`
7. OAuth consent screen: External, agregar email de test

---

## 7. Frontend — API Client con Auth

```typescript
// apps/web/src/services/api-client.ts
const API_URL = import.meta.env.VITE_API_URL;

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('presisso_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('presisso_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('presisso_token');
  }

  async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error de red' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(path: string) {
    return this.fetch<T>(path);
  }

  post<T>(path: string, body: unknown) {
    return this.fetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(path: string, body: unknown) {
    return this.fetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.fetch<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
```

---

## Siguiente paso → `04-API-BACKEND.md`
