/**
 * Handles HTTP request and response logic for the mvp votes backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { castVoteSchema, mvpMatchIdParamsSchema, mvpDeadlineBodySchema } from './mvpVotesSchema.js';
import { castVote, getVoteResult, setMvpVotingDeadline, getMvpCandidates } from './mvpVotesServices.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../errors.js';

function handleError(err: any, reply: FastifyReply) {
  if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
  if (err instanceof ConflictError) return reply.code(409).send({ error: err.message });
  if (err instanceof BadRequestError) return reply.code(400).send({ error: err.message });
  throw err;
}

export async function castVoteHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = castVoteSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Body inválido', details: parsed.error.flatten() });
  try {
    return reply.code(201).send(await castVote(req.user!.id, parsed.data.matchId, parsed.data.playerId));
  } catch (err) { return handleError(err, reply); }
}

export async function getVoteResultHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = mvpMatchIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID inválido' });
  try {
    return await getVoteResult(parsed.data.matchId, req.user!.id);
  } catch (err) { return handleError(err, reply); }
}

export async function getMvpCandidatesHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = mvpMatchIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: 'ID de partido inválido' });
  try {
    return await getMvpCandidates(parsed.data.matchId);
  } catch (err) { return handleError(err, reply); }
}

export async function setMvpVotingDeadlineHandler(req: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = mvpMatchIdParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) return reply.code(400).send({ error: 'ID de partido inválido' });

  const bodyParsed = mvpDeadlineBodySchema.safeParse(req.body);
  if (!bodyParsed.success) return reply.code(400).send({ error: bodyParsed.error.flatten().fieldErrors });

  try {
    return await setMvpVotingDeadline(paramsParsed.data.matchId, bodyParsed.data.date);
  } catch (err) { return handleError(err, reply); }
}
