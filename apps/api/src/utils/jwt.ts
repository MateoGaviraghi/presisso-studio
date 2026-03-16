import * as jose from 'jose';
import { env } from '../config/env';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const issuer = 'presisso-studio';
const audience = 'presisso-client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'client' | 'vendor' | 'admin';
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
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
