/**
 * Handles HTTP request and response logic for the leaderboard backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { getLeaderboardQuerySchema } from './leaderboardSchema.js';
import { getLeaderboard } from './leaderboardServices.js';

export async function getLeaderboardHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = getLeaderboardQuerySchema.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: 'Query inválida' });
  return getLeaderboard(parsed.data.period, parsed.data.limit, req.user!.id);
}




