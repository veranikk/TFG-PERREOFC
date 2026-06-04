/**
 * Service layer for scraper orchestration: scrape all.
 * It coordinates jobs, progress state and the sequence of scraping tasks.
 */

// src/services/scrapeAll.ts

import type { FastifyBaseLogger } from 'fastify';

import {
  scrapeCompetitions,
  scrapeGroupsForCompetition,
  scrapeCalendar,
  type ScrapedCompetition,
  type ScrapedCalendar,
} from '../scrapers/competitions.js';
import { scrapeStandings, type ScrapedStandings } from '../scrapers/standings.js';
import { scrapeTopScorers } from '../scrapers/topScorers.js';
import { scrapeMatch } from '../scrapers/match.js';
import { scrapePlayer } from '../scrapers/player.js';
import { env } from '../shared/env.js';

import { upsertCompetitionGroups } from '../persist/upsertCompetitionGroups.js';
import { upsertCompetitions } from '../persist/upsertCompetitions.js';
import { upsertStandings } from '../persist/upsertStandings.js';
import { upsertTopScorers } from '../persist/upsertTopScorers.js';
import { upsertMatch } from '../persist/upsertMatch.js';
import { upsertMatches } from '../persist/upsertMatches.js';
import { upsertPlayer } from '../persist/upsertPlayer.js';
import { getAdminClient } from '../shared/supabase.js';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ScrapeMode = 'competitions-only' | 'calendars' | 'full';

export interface ProgressUpdate {
  step?: string;
  competitionId?: number;
  groupId?: number;
  competitionsTotal?: number;
  groupsTotal?: number;
  matchesTotal?: number;
  competitionsProcessed?: number;
  groupsProcessed?: number;
  matchesProcessed?: number;
  errorOccurred?: boolean;
}

export interface RunFullScrapeOptions {
  seasonId: number;
  gameTypeId: number;
  mode?: ScrapeMode;
  onlyActive?: boolean;
  /** Si se especifica, solo se procesa esta competición */
  competitionId?: number;
  /** Si se especifica junto a competitionId, solo se procesa este grupo */
  groupId?: number;
  /** Callback para reportar progreso con detalle */
  onProgress?: (update: ProgressUpdate) => void;
}

export interface StepResult {
  name: string;
  ok: boolean;
  itemsProcessed?: number;
  durationMs: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface ScrapeResult {
  ok: boolean;
  mode: ScrapeMode;
  seasonId: number;
  gameTypeId: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  summary: {
    competitions: number;
    groups: number;
    matches: number;
    failedSteps: number;
  };
  steps: StepResult[];
  stats?: {
    competitions: number;
    groups: number;
    matches: number;
  };
}

// ---------------------------------------------------------------------------
// runFullScrape
// ---------------------------------------------------------------------------

/**
 * Orquesta el scrapeo completo en cadena:
 *   competitions → groups → calendar → standings → top-scorers → matches
 *
 * Filosofía: errores por paso, nunca aborta el resto. El informe final
 * indica qué pasos fueron OK y cuáles no.
 */
export async function runFullScrape(
  log: FastifyBaseLogger,
  opts: RunFullScrapeOptions
): Promise<ScrapeResult> {
  const mode: ScrapeMode = opts.mode ?? 'full';
  const onlyActive = opts.onlyActive !== false;
  const startedAt = new Date();
  const steps: StepResult[] = [];

  let competitionsCount = 0;
  let groupsCount = 0;
  let matchesCount = 0;
  let groupsProcessed = 0;
  let matchesProcessed = 0;

  log.info(
    { seasonId: opts.seasonId, gameTypeId: opts.gameTypeId, mode, onlyActive },
    'runFullScrape: start'
  );

  opts.onProgress?.({ step: 'initializing' });

  // -------------------------------------------------------------------------
  // Helper para encapsular un paso individual
  // -------------------------------------------------------------------------
  async function runStep<T>(
    name: string,
    fn: () => Promise<{ items: number; result?: T }>
  ): Promise<T | undefined> {
    const stepStart = Date.now();
    log.info({ step: name }, `step start: ${name}`);

    try {
      const out = await fn();
      const durationMs = Date.now() - stepStart;
      steps.push({ name, ok: true, itemsProcessed: out.items, durationMs });
      log.info({ step: name, items: out.items, durationMs }, `step OK: ${name}`);
      return out.result;
    } catch (err) {
      const durationMs = Date.now() - stepStart;
      const error = err instanceof Error ? err.message : String(err);
      steps.push({ name, ok: false, durationMs, error });
      log.error({ step: name, durationMs, err }, `step FAILED: ${name}`);
      opts.onProgress?.({ step: name, errorOccurred: true });
      return undefined;
    }
  }

  // -------------------------------------------------------------------------
  // 1. COMPETITIONS
  // -------------------------------------------------------------------------
  const competitions = await runStep<ScrapedCompetition[]>(
    'competitions:scrape',
    async () => {
      const data = await scrapeCompetitions({
        seasonId: opts.seasonId,
        gameTypeId: opts.gameTypeId,
      });
      return { items: data.length, result: data };
    }
  );

  if (!competitions) {
    return buildResult();
  }

  opts.onProgress?.({
    step: 'competitions:upsert',
    competitionsTotal: competitions.length,
  });

  const competitionsToPersist = opts.competitionId
    ? competitions.filter((c) => c.id === opts.competitionId)
    : competitions;

  await runStep('competitions:upsert', async () => {
    const result = await upsertCompetitions(competitionsToPersist, {
      seasonId: opts.seasonId,
    });
    return { items: result.upserted };
  });
  competitionsCount = competitionsToPersist.length;

  opts.onProgress?.({
    step: 'competitions:done',
    competitionsProcessed: competitionsCount,
    competitionsTotal: competitionsCount,
  });

  if (mode === 'competitions-only') {
    return buildResult();
  }

  const targets = onlyActive
    ? competitions.filter((c) => c.is_active && (!opts.competitionId || c.id === opts.competitionId))
    : competitions.filter((c) => !opts.competitionId || c.id === opts.competitionId);

  log.info(
    { totalCompetitions: competitions.length, active: targets.length },
    'filter active'
  );

  opts.onProgress?.({
    step: 'preparing-groups-scrape',
    competitionsTotal: targets.length,
  });

  // Pre-contar grupos para estimar la duración total
  let totalGroupsExpected = 0;
  for (let i = 0; i < targets.length; i++) {
    const comp = targets[i];
    opts.onProgress?.({
      step: 'counting-groups',
      competitionsProcessed: i,
      competitionsTotal: targets.length,
    });

    try {
      const groups = await scrapeGroupsForCompetition({
        seasonId: opts.seasonId,
        gameTypeId: opts.gameTypeId,
        competitionId: comp.id,
      });
      totalGroupsExpected += groups.length;
    } catch (err) {
      log.warn({ competitionId: comp.id, err }, 'Could not pre-count groups');
    }
  }

  opts.onProgress?.({
    step: 'starting-calendars',
    groupsTotal: totalGroupsExpected,
    // Estimación: ~306 partidos por grupo (34 jornadas × 9 partidos).
    // Solo es una heurística para la barra de progreso; el valor real varía
    // según el formato de la competición.
    matchesTotal: totalGroupsExpected * 306,
  });

  // -------------------------------------------------------------------------
  // 2. Para cada competición activa: GROUPS → CALENDAR → STANDINGS → TOP-SCORERS
  // -------------------------------------------------------------------------
  for (let compIdx = 0; compIdx < targets.length; compIdx++) {
    const comp = targets[compIdx];
    log.info(
      { competitionId: comp.id, name: comp.name, compIdx: compIdx + 1, totalComps: targets.length },
      'processing competition'
    );

    const groups = await runStep<Array<{ id: number; name: string }>>(
      `groups:scrape:${comp.id}`,
      async () => {
        const g = await scrapeGroupsForCompetition({
          seasonId: opts.seasonId,
          gameTypeId: opts.gameTypeId,
          competitionId: comp.id,
        });
        return { items: g.length, result: g };
      }
    );

    if (!groups) continue;
    groupsCount += groups.length;

    opts.onProgress?.({ step: `groups:upsert:${comp.id}`, competitionId: comp.id });

    const groupsToPersist = opts.groupId
      ? groups.filter((g) => g.id === opts.groupId)
      : groups;

    await runStep(`groups:upsert:${comp.id}`, async () => {
      const result = await upsertCompetitionGroups(groupsToPersist, {
        seasonId: opts.seasonId,
        competitionId: comp.id,
      });
      return { items: result.groups.length };
    });

    const groupsToProcess = opts.groupId
      ? groups.filter((g) => g.id === opts.groupId)
      : groups;

    if (opts.groupId && groupsToProcess.length === 0) {
      log.warn(
        { competitionId: comp.id, groupId: opts.groupId },
        'groupId forzado no encontrado en esta competición'
      );
    }

    for (let groupIdx = 0; groupIdx < groupsToProcess.length; groupIdx++) {
      const group = groupsToProcess[groupIdx];
      const ctx = { competitionId: comp.id, groupId: group.id };
      log.info(
        { ...ctx, groupIdx: groupIdx + 1, totalGroups: groups.length },
        'processing group'
      );

      // ✅ 1. STANDINGS — primero para saber si Perreo FC está en este grupo
      const standings = await runStep<ScrapedStandings>(
        `standings:${comp.id}:${group.id}`,
        async () => {
          const s = await scrapeStandings({
            competition_id: comp.id,
            group_id: group.id,
            season_id: opts.seasonId,
            game_type_id: opts.gameTypeId,
          });
          return { items: Array.isArray(s.entries) ? s.entries.length : 1, result: s };
        }
      );

      if (!standings) continue;

      // 🔍 FILTRO PERREO: solo continuar si el equipo está en este grupo
      const isPerreoInGroup = standings.entries.some((e) => e.team_id === env.OWN_TEAM_ID);

      if (!isPerreoInGroup) {
        log.info(
          { ...ctx, teamId: env.OWN_TEAM_ID },
          'Skipping group: target team not found in standings'
        );
        groupsProcessed++;
        continue;
      }

      log.info(
        { ...ctx, teamId: env.OWN_TEAM_ID },
        '✅ Target team found in group! Processing full data...'
      );

      await upsertStandings(standings);

      // ✅ 2. CALENDAR
      const calendar = await runStep<ScrapedCalendar>(
        `calendar:${comp.id}:${group.id}`,
        async () => {
          const cal = await scrapeCalendar({
            seasonId: opts.seasonId,
            gameTypeId: opts.gameTypeId,
            competitionId: comp.id,
            groupId: group.id,
          });
          await upsertMatches(cal, { seasonId: opts.seasonId });
          return { items: cal.matches.length, result: cal };
        }
      );

      if (calendar?.matches?.length) {
        matchesProcessed += calendar.matches.length;
        opts.onProgress?.({
          step: `matches-upserted:${comp.id}:${group.id}`,
          competitionId: comp.id,
          groupId: group.id,
          matchesProcessed,
          groupsProcessed: groupsProcessed + 1,
          groupsTotal: totalGroupsExpected,
        });
      }

      // ✅ 3. TOP SCORERS
      await runStep(`topScorers:${comp.id}:${group.id}`, async () => {
        const scorers = await scrapeTopScorers({
          competition_id: comp.id,
          group_id: group.id,
          season_id: opts.seasonId,
          game_type_id: opts.gameTypeId,
        });
        await upsertTopScorers(scorers, { seasonId: opts.seasonId });
        return { items: Array.isArray(scorers.scorers) ? scorers.scorers.length : 1 };
      });

      groupsProcessed++;

      if (mode === 'calendars') continue;

      // ✅ 4. MATCHES (modo 'full') — acta detallada solo de partidos con Perreo FC
      if (calendar?.matches?.length) {
        for (const m of calendar.matches) {
          const involvesOwnTeam =
            m.home_team_id === env.OWN_TEAM_ID ||
            m.away_team_id === env.OWN_TEAM_ID;

          if (!involvesOwnTeam) {
            log.debug({ acta_id: m.acta_id }, 'Skipping match detail: Perreo FC not involved');
            continue;
          }

          await runStep(`match:${m.acta_id}`, async () => {
            const data = await scrapeMatch(m.acta_id);
            await upsertMatch(data, { seasonId: opts.seasonId });
            return { items: 1 };
          });
          matchesCount++;
        }
      }

      // ✅ 5. PLAYER SEASON STATS del Perreo FC (modo 'full')
      await runStep(`playerStats:${comp.id}:${group.id}`, async () => {
        const supabase = getAdminClient();
        const { data: roster } = await supabase
          .from('team_players')
          .select('player_id')
          .eq('team_id', env.OWN_TEAM_ID)
          .eq('season_id', opts.seasonId);

        let count = 0;
        for (const row of roster ?? []) {
          try {
            const playerData = await scrapePlayer(row.player_id);
            await upsertPlayer(playerData, { skipCompetitions: true });
            count++;
          } catch (err) {
            log.warn({ playerId: row.player_id, err }, 'player stats scrape failed, skipping');
          }
        }
        return { items: count };
      });
    }
  }

  return buildResult();

  // -------------------------------------------------------------------------
  function buildResult(): ScrapeResult {
    const finishedAt = new Date();
    const failedSteps = steps.filter((s) => !s.ok).length;

    opts.onProgress?.({
      step: 'finished',
      competitionsProcessed: competitionsCount,
      groupsProcessed,
      matchesProcessed,
    });

    return {
      ok: failedSteps === 0,
      mode,
      seasonId: opts.seasonId,
      gameTypeId: opts.gameTypeId,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      summary: {
        competitions: competitionsCount,
        groups: groupsCount,
        matches: matchesCount,
        failedSteps,
      },
      stats: {
        competitions: competitionsCount,
        groups: groupsCount,
        matches: matchesCount,
      },
      steps,
    };
  }
}
