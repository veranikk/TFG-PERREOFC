/**
 * Handles HTTP request and response logic for the top scorers backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { getTopScorersQuerySchema } from './topScorersSchema.js';
import { getTopScorers } from './topScorersServices.js';
import { getTeamGroupId } from '../teams/teamsServices.js';
import { NotFoundError } from '../../errors.js';

export async function getTopScorersHandler(req: FastifyRequest, reply: FastifyReply) {
    const parsed = getTopScorersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return reply.code(400).send({ error: 'Query inválida', details: parsed.error.flatten() });
    }
    try {
        let groupId = parsed.data.groupId;
        if (!groupId) {
            const ownTeamId = Number(process.env.OWN_TEAM_ID);
            if (ownTeamId) {
                groupId = await getTeamGroupId(ownTeamId);
            }
        }

        if (!groupId) {
            throw new NotFoundError('Debe especificar un groupId o configurar OWN_TEAM_ID');
        }

        return await getTopScorers(groupId, parsed.data.limit);
    } catch (err: any) {
        if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
        throw err;
    }
}




