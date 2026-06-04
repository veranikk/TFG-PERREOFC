/**
 * API route module for triggering or reading scraper behavior: public.
 * These endpoints expose scraper jobs to internal or public callers.
 */

import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { scrapeTeam } from '../../scrapers/team.js';
import { scrapeMatch } from '../../scrapers/match.js';
import { scrapeStandings } from '../../scrapers/standings.js';
import { scrapePlayer } from '../../scrapers/player.js';
import { scrapeTopScorers } from '../../scrapers/topScorers.js';
import { upsertTeam } from '../../persist/upsertTeam.js';
import { upsertMatch } from '../../persist/upsertMatch.js';
import { upsertStandings } from '../../persist/upsertStandings.js';
import { upsertPlayer } from '../../persist/upsertPlayer.js';
import { upsertTopScorers } from '../../persist/upsertTopScorers.js';

// ── Zod schemas ──────────────────────────────────────────────────────────────

const standingsBodySchema = z.object({
  competition_id: z.number().int().positive(),
  group_id: z.number().int().positive(),
  season_id: z.number().int().positive().default(21),
  game_type_id: z.number().int().positive().default(1),
  round_number: z.number().int().positive().optional(),
});

// ── Routes ───────────────────────────────────────────────────────────────────

export async function publicRoutes(app: FastifyInstance) {
  app.get('/', async () => ({
    message: 'Perreo FC Scraper API',
    version: '0.1.0',
    docs: {
      health: 'GET /health',
      scrape: {
        team: 'POST /scrape/team/:id?season_id=21',
        match: 'POST /scrape/match/:codacta?season_id=21',
        standings: 'POST /scrape/standings',
        player: 'POST /scrape/player/:id',
        topScorers: 'POST /scrape/top-scorers',
      },
    },
  }));

  app.get('/health', async () => ({ status: 'ok' }));

  app.post<{ Params: { id: string }; Querystring: { season_id?: string } }>(
    '/scrape/team/:id',
    async (req, reply) => {
      const teamId = parseInt(req.params.id, 10);
      if (Number.isNaN(teamId)) {
        return reply.code(400).send({ error: 'teamId inválido' });
      }
      const seasonId = parseInt(req.query.season_id ?? '21', 10);

      try {
        const data = await scrapeTeam(teamId);
        await upsertTeam(data, { seasonId });
        return {
          ok: true,
          team_id: data.team.id,
          players_count: data.players.length,
          staff_count: data.staff.length,
        };
      } catch (err) {
        req.log.error(err);
        return reply
          .code(500)
          .send({ error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
  );

  app.post<{ Params: { codacta: string }; Querystring: { season_id?: string } }>(
    '/scrape/match/:codacta',
    async (req, reply) => {
      const codacta = parseInt(req.params.codacta, 10);
      if (Number.isNaN(codacta)) {
        return reply.code(400).send({ error: 'codacta inválido' });
      }
      const seasonId = parseInt(req.query.season_id ?? '21', 10);

      try {
        const data = await scrapeMatch(codacta);
        await upsertMatch(data, { seasonId });
        return {
          ok: true,
          match_id: data.match.id,
          score: `${data.match.home_score}-${data.match.away_score}`,
          lineups: data.lineups.length,
          goals: data.goals.length,
          cards: data.cards.length,
        };
      } catch (err) {
        req.log.error(err);
        return reply
          .code(500)
          .send({ error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
  );

  app.post('/scrape/standings', async (req, reply) => {
    const parsed = standingsBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    try {
      const data = await scrapeStandings({
        competition_id: parsed.data.competition_id,
        group_id: parsed.data.group_id,
        season_id: parsed.data.season_id,
        game_type_id: parsed.data.game_type_id,
        round_number: parsed.data.round_number,
      });
      await upsertStandings(data);
      return {
        ok: true,
        competition_id: data.competition.id,
        group_id: data.group.id,
        round_number: data.round_number,
        teams: data.entries.length,
      };
    } catch (err) {
      req.log.error(err);
      return reply
        .code(500)
        .send({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  app.post<{ Params: { id: string } }>('/scrape/player/:id', async (req, reply) => {
    const playerId = parseInt(req.params.id, 10);
    if (Number.isNaN(playerId)) {
      return reply.code(400).send({ error: 'playerId inválido' });
    }

    try {
      const data = await scrapePlayer(playerId);
      await upsertPlayer(data);
      return {
        ok: true,
        player_id: data.player.id,
        full_name: data.player.full_name,
        matches_played: data.season_stats.matches_played,
        goals: data.season_stats.goals_total,
        competitions: data.competitions.length,
      };
    } catch (err) {
      req.log.error(err);
      return reply
        .code(500)
        .send({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  app.post<{
    Body: {
      season_id?: number;
      game_type_id?: number;
      competition_id: number;
      group_id: number;
      snapshot_date?: string;
    };
  }>('/scrape/top-scorers', async (req, reply) => {
    const {
      season_id = 21,
      game_type_id = 1,
      competition_id,
      group_id,
      snapshot_date,
    } = req.body;

    if (!competition_id || !group_id) {
      return reply.status(400).send({
        error: 'competition_id y group_id son obligatorios',
      });
    }

    try {
      const data = await scrapeTopScorers({
        season_id,
        game_type_id,
        competition_id,
        group_id,
        snapshot_date,
      });
      await upsertTopScorers(data, { seasonId: season_id });
      return {
        ok: true,
        group_id,
        snapshot_date: data.snapshot_date,
        scorers_count: data.scorers.length,
      };
    } catch (err) {
      req.log.error(err);
      return reply.status(500).send({
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });
}
