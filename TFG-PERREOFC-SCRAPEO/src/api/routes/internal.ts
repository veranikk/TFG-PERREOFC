/**
 * API route module for triggering or reading scraper behavior: internal.
 * These endpoints expose scraper jobs to internal or public callers.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { env } from '../../shared/env.js';
import { runFullScrape, type ScrapeMode } from '../../services/scrapeAll.js';
import { getAdminClient } from '../../shared/supabase.js';
import {
  createJob,
  getActiveJob,
  getJob,
  getJobWithFormattedProgress,
  markDone,
  markFailed,
  markRunning,
  updateProgress,
} from '../../services/jobStore.js';

// ── Token guard ──────────────────────────────────────────────────────────────
//
// Protege todos los endpoints /internal/* con un token estático enviado en la
// cabecera x-internal-token (configurado via env.INTERNAL_TOKEN).
//
// Usa hashes SHA-256 antes de timingSafeEqual para garantizar buffers de igual
// longitud independientemente del tamaño del token.
// El valor del token NUNCA se loguea — solo se registra si es string o no.

function safeCompareTokens(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

async function requireInternalToken(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const provided = req.headers['x-internal-token'];

  if (typeof provided !== 'string' || !safeCompareTokens(provided, env.INTERNAL_TOKEN)) {
    // Solo logueamos el tipo, nunca el valor — evita filtrar el token en logs
    req.log.warn(
      { providedHeader: typeof provided },
      'Intento de acceso a /internal/* sin token válido'
    );
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────

export async function internalRoutes(app: FastifyInstance) {
  // ── POST /internal/scrape/run ─────────────────────────────────────────────

  app.post<{
    Body: {
      season_id: number;
      game_type_id: number;
      mode?: ScrapeMode;
      only_active?: boolean;
      competition_id?: number;
      group_id?: number;
    };
  }>(
    '/internal/scrape/run',
    {
      preHandler: requireInternalToken,
      schema: {
        body: {
          type: 'object',
          required: ['season_id', 'game_type_id'],
          properties: {
            season_id: { type: 'integer' },
            game_type_id: { type: 'integer' },
            mode: {
              type: 'string',
              enum: ['competitions-only', 'calendars', 'full'],
            },
            only_active: { type: 'boolean' },
            competition_id: { type: 'integer' },
            group_id: { type: 'integer' },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const { season_id, game_type_id, mode, only_active, competition_id, group_id } = req.body;

        const active = getActiveJob();
        if (active) {
          req.log.warn(
            { activeJobId: active.jobId, status: active.status },
            'Ya hay un job activo'
          );
          return reply.code(409).send({
            ok: false,
            error: 'A scrape job is already in progress',
            jobId: active.jobId,
            status: active.status,
            startedAt: active.startedAt,
          });
        }

        const job = createJob();
        req.log.info(
          { jobId: job.jobId, seasonId: season_id, gameTypeId: game_type_id, mode: mode || 'full' },
          'Job encolado'
        );

        reply.code(202).send(job);

        setImmediate(async () => {
          try {
            markRunning(job.jobId);
            const result = await runFullScrape(req.log, {
              seasonId: season_id,
              gameTypeId: game_type_id,
              mode: mode || 'full',
              onlyActive: only_active ?? true,
              competitionId: competition_id,
              groupId: group_id,
              onProgress: (update) => {
                req.log.debug({ jobId: job.jobId, update }, 'Progress update');
                updateProgress(job.jobId, update);
              },
            });

            markDone(job.jobId, result);
            req.log.info(
              { jobId: job.jobId, durationMs: result.durationMs, summary: result.summary },
              '✅ Job terminado OK'
            );
          } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            markFailed(job.jobId, error);
            req.log.error({ jobId: job.jobId, err }, '❌ Job falló');
          }
        });
      } catch (error) {
        return reply.code(500).send({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // ── GET /internal/scrape/status/:jobId ────────────────────────────────────

  app.get<{ Params: { jobId: string } }>(
    '/internal/scrape/status/:jobId',
    { preHandler: requireInternalToken },
    async (req, reply) => {
      const job = getJob(req.params.jobId);
      if (!job) {
        return reply.code(404).send({ error: 'Job not found', jobId: req.params.jobId });
      }
      return reply.code(200).send(job);
    }
  );

  // ── GET /internal/scrape/status/:jobId/progress ───────────────────────────

  app.get<{ Params: { jobId: string } }>(
    '/internal/scrape/status/:jobId/progress',
    { preHandler: requireInternalToken },
    async (req, reply) => {
      const jobWithProgress = getJobWithFormattedProgress(req.params.jobId);
      if (!jobWithProgress) {
        return reply.code(404).send({ error: 'Job not found', jobId: req.params.jobId });
      }
      return reply.code(200).send(jobWithProgress);
    }
  );

  // ── DELETE /internal/db/cleanup ───────────────────────────────────────────
  // Borra duplicados de classification_entries y top_scorers (mantiene el más reciente)

  app.delete(
    '/internal/db/cleanup',
    { preHandler: requireInternalToken },
    async (_req, reply) => {
      const supabase = getAdminClient();

      const { data: entries, error: entriesErr } = await supabase
        .from('classification_entries')
        .select('id, group_id, round_number, position, updated_at')
        .order('updated_at', { ascending: false });

      if (entriesErr) {
        return reply.code(500).send({ error: `classification_entries fetch: ${entriesErr.message}` });
      }

      const seenEntries = new Set<string>();
      const toDeleteEntries: string[] = [];
      for (const e of entries ?? []) {
        const key = `${e.group_id}:${e.round_number}:${e.position}`;
        if (seenEntries.has(key)) {
          toDeleteEntries.push(e.id);
        } else {
          seenEntries.add(key);
        }
      }

      if (toDeleteEntries.length > 0) {
        const { error } = await supabase
          .from('classification_entries')
          .delete()
          .in('id', toDeleteEntries);
        if (error) {
          return reply.code(500).send({ error: `classification_entries delete: ${error.message}` });
        }
      }

      const { data: scorers, error: scorersErr } = await supabase
        .from('top_scorers')
        .select('id, group_id, snapshot_date, position, scraped_at')
        .order('scraped_at', { ascending: false });

      if (scorersErr) {
        return reply.code(500).send({ error: `top_scorers fetch: ${scorersErr.message}` });
      }

      const seenScorers = new Set<string>();
      const toDeleteScorers: string[] = [];
      for (const s of scorers ?? []) {
        const key = `${s.group_id}:${s.snapshot_date}:${s.position}`;
        if (seenScorers.has(key)) {
          toDeleteScorers.push(s.id);
        } else {
          seenScorers.add(key);
        }
      }

      if (toDeleteScorers.length > 0) {
        const { error } = await supabase
          .from('top_scorers')
          .delete()
          .in('id', toDeleteScorers);
        if (error) {
          return reply.code(500).send({ error: `top_scorers delete: ${error.message}` });
        }
      }

      return reply.code(200).send({
        ok: true,
        deleted: {
          classification_entries: toDeleteEntries.length,
          top_scorers: toDeleteScorers.length,
        },
      });
    }
  );

  // ── DELETE /internal/db/reset-scraped-data ────────────────────────────────
  // Borra TODOS los datos scrapeados en orden correcto (respeta FKs).
  // Requiere cabecera: x-confirm-reset: yes-delete-all-scraped-data
  // NO toca: users, events, news_articles, notifications, user_bets,
  //          mvp_votes, system_logs, seasons, game_types, points_config

  app.delete(
    '/internal/db/reset-scraped-data',
    { preHandler: requireInternalToken },
    async (req, reply) => {
      const confirm = req.headers['x-confirm-reset'];
      if (confirm !== 'yes-delete-all-scraped-data') {
        return reply.code(400).send({
          error: 'Missing or invalid x-confirm-reset header. Set it to "yes-delete-all-scraped-data" to confirm.',
        });
      }

      const supabase = getAdminClient();

      const tables: Array<{ table: string; col: string; op: 'gte' | 'neq' | 'gt'; val: string }> = [
        { table: 'classification_form',    col: 'position', op: 'gte', val: '0' },
        { table: 'classification_entries', col: 'id',       op: 'neq', val: '00000000-0000-0000-0000-000000000000' },
        { table: 'top_scorers',            col: 'id',       op: 'neq', val: '00000000-0000-0000-0000-000000000000' },
        { table: 'match_lineup_entries',   col: 'id',       op: 'neq', val: '00000000-0000-0000-0000-000000000000' },
        { table: 'match_goals',            col: 'id',       op: 'neq', val: '00000000-0000-0000-0000-000000000000' },
        { table: 'match_cards',            col: 'id',       op: 'neq', val: '00000000-0000-0000-0000-000000000000' },
        { table: 'match_staff_entries',    col: 'id',       op: 'neq', val: '00000000-0000-0000-0000-000000000000' },
        { table: 'match_rounds',           col: 'id',       op: 'neq', val: '00000000-0000-0000-0000-000000000000' },
        { table: 'matches',                col: 'id',       op: 'gt',  val: '0' },
        { table: 'player_season_stats',    col: 'id',       op: 'neq', val: '00000000-0000-0000-0000-000000000000' },
        { table: 'team_players',           col: 'id',       op: 'neq', val: '00000000-0000-0000-0000-000000000000' },
        { table: 'team_staff',             col: 'id',       op: 'neq', val: '00000000-0000-0000-0000-000000000000' },
        { table: 'kit_designs',            col: 'id',       op: 'neq', val: '00000000-0000-0000-0000-000000000000' },
        { table: 'players',                col: 'id',       op: 'gt',  val: '0' },
        { table: 'staff_members',          col: 'id',       op: 'gt',  val: '0' },
        { table: 'teams',                  col: 'id',       op: 'gt',  val: '0' },
        { table: 'clubs',                  col: 'id',       op: 'gt',  val: '0' },
        { table: 'venues',                 col: 'id',       op: 'gt',  val: '0' },
        { table: 'competition_groups',     col: 'id',       op: 'gt',  val: '0' },
        { table: 'competitions',           col: 'id',       op: 'gt',  val: '0' },
      ];

      const deleted: Record<string, number> = {};

      for (const { table, col, op, val } of tables) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q = (supabase as any).from(table).delete();
        const { error, count } = await q[op](col, val);

        if (error) {
          return reply.code(500).send({
            error: `${table}: ${(error as any).message}`,
            deletedSoFar: deleted,
          });
        }
        deleted[table] = count ?? 0;
        req.log.info({ table, count }, `reset: deleted ${table}`);
      }

      return reply.code(200).send({ ok: true, deleted });
    }
  );
}
