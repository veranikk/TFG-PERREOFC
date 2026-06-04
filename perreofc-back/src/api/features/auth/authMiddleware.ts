/**
 * Authentication middleware for protecting backend routes.
 * It verifies the current user/session before restricted handlers continue.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';
import { env } from '../../../shared/env.js';
import { getAdminClient } from '../../../shared/supabase.js';

export type UserRole = 'aficionado' | 'jugador' | 'admin' | 'superadmin';

export interface AuthUser {
  id: string;
  email: string | null;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  playerId: number | null;
  points: number;
  banned: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

// JWKS remoto cacheado (jose maneja el cache automáticamente).
// Se inicializa una vez y se reutiliza en cada request para verificar JWTs.
const JWKS = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

const ISSUER = `${env.SUPABASE_URL}/auth/v1`;

/** Middleware de autenticación: verifica JWT Supabase y carga datos del usuario. */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'No token provided', code: 'NO_TOKEN' });
  }

  const token = authHeader.slice(7);

  // Verificar firma y claims del JWT
  let payload: JWTPayload & { email?: string };
  try {
    const result = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: 'authenticated',
    });
    payload = result.payload as JWTPayload & { email?: string };
  } catch (err: any) {
    req.log.warn({ err }, 'JWT verification failed');
    const code = err?.code === 'ERR_JWT_EXPIRED' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return reply.code(401).send({ error: 'Invalid or expired token', code });
  }

  if (!payload.sub) {
    return reply.code(401).send({ error: 'Token missing sub', code: 'INVALID_TOKEN' });
  }

  // Cargar perfil de public.users para enriquecer req.user
  const supabase = getAdminClient();
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, username, first_name, last_name, avatar_url, role, player_id, points, banned, deleted_at')
    .eq('id', payload.sub)
    .single();

  if (error || !profile) {
    return reply.code(401).send({ error: 'Profile not found', code: 'NO_PROFILE' });
  }
  // Verificar que la cuenta no esté eliminada (soft delete)
  if (profile.deleted_at) {
    return reply.code(401).send({ error: 'Account deleted', code: 'ACCOUNT_DELETED' });
  }
  // Verificar que la cuenta no esté suspendida
  if (profile.banned) {
    return reply.code(403).send({ error: 'Account banned', code: 'ACCOUNT_BANNED' });
  }

  req.user = {
    id: profile.id,
    email: payload.email ?? null,
    username: profile.username,
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
    role: profile.role as UserRole,
    playerId: profile.player_id,
    points: profile.points,
    banned: profile.banned,
  };
}

/** Factory de middleware que restringe el acceso a roles específicos. */
export function requireRole(...roles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.code(401).send({ error: 'Not authenticated', code: 'NOT_AUTH' });
    }
    if (!roles.includes(req.user.role)) {
      return reply.code(403).send({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: roles,
        actual: req.user.role,
      });
    }
  };
}




