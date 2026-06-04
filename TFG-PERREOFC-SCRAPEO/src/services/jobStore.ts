/**
 * Service layer for scraper orchestration: job store.
 * It coordinates jobs, progress state and the sequence of scraping tasks.
 */

/**
 * jobStore.ts - Sistema de tracking de jobs con progreso detallado
 * 
 * Maneja:
 * - Creación de jobs
 * - Tracking del progreso (step actual, items procesados, ETA)
 * - Estado: queued → running → finished/failed
 */

interface JobProgress {
  currentStep: string; // ej: "competitions:upsert", "groups:scrape:24037579", "calendar:24037579:24037584"
  currentCompetitionId?: number;
  currentGroupId?: number;
  
  // Totales conocidos
  competitionsTotal?: number;
  groupsTotal?: number;
  matchesTotal?: number;
  
  // Progreso actual
  competitionsProcessed: number;
  groupsProcessed: number;
  matchesProcessed: number;
  
  // Timing
  startedAt: Date;
  lastUpdateAt: Date;
  estimatedRemainingMs?: number;
  
  // Errores
  errorsCount: number;
}

interface ScrapeJob {
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  progress: JobProgress;
  result: any;
  error: string | null;
}

// Store en memoria (en prod usarías Redis)
const jobs = new Map<string, ScrapeJob>();

function generateJobId(): string {
  return crypto.randomUUID();
}

export function createJob(): ScrapeJob {
  const jobId = generateJobId();
  const now = new Date();

  const job: ScrapeJob = {
    jobId,
    status: 'queued',
    startedAt: now,
    finishedAt: null,
    durationMs: null,
    progress: {
      currentStep: 'pending',
      competitionsProcessed: 0,
      groupsProcessed: 0,
      matchesProcessed: 0,
      startedAt: now,
      lastUpdateAt: now,
      errorsCount: 0,
    },
    result: null,
    error: null,
  };

  jobs.set(jobId, job);
  return job;
}

export function getJob(jobId: string): ScrapeJob | null {
  return jobs.get(jobId) ?? null;
}

export function getActiveJob(): ScrapeJob | null {
  for (const job of jobs.values()) {
    if (job.status === 'queued' || job.status === 'running') {
      return job;
    }
  }
  return null;
}

export function markRunning(jobId: string): void {
  const job = jobs.get(jobId);
  if (job) {
    job.status = 'running';
    job.progress.startedAt = new Date();
    // No usamos log de Fastify aquí porque no lo tenemos, pero el objeto es mutado
    // y se verá en los siguientes logs de internal.ts o scrapeAll.ts
  }
}

/**
 * Actualizar progreso del job
 * 
 * Ejemplos:
 * - Step: "competitions:scrape"
 * - Step: "groups:scrape:24037579" (competitionId)
 * - Step: "calendar:24037579:24037584" (competitionId, groupId)
 */
export function updateProgress(
  jobId: string,
  update: {
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
): void {
  const job = jobs.get(jobId);
  if (!job) return;

  const progress = job.progress;
  const now = new Date();

  // Actualizar step
  if (update.step) progress.currentStep = update.step;
  if (update.competitionId) progress.currentCompetitionId = update.competitionId;
  if (update.groupId) progress.currentGroupId = update.groupId;

  // Actualizar totales
  if (update.competitionsTotal) progress.competitionsTotal = update.competitionsTotal;
  if (update.groupsTotal) progress.groupsTotal = update.groupsTotal;
  if (update.matchesTotal) progress.matchesTotal = update.matchesTotal;

  // Actualizar procesados
  if (update.competitionsProcessed !== undefined) {
    progress.competitionsProcessed = update.competitionsProcessed;
  }
  if (update.groupsProcessed !== undefined) {
    progress.groupsProcessed = update.groupsProcessed;
  }
  if (update.matchesProcessed !== undefined) {
    progress.matchesProcessed = update.matchesProcessed;
  }

  // Contar errores
  if (update.errorOccurred) {
    progress.errorsCount += 1;
  }

  // Calcular ETA si hay totales
  if (progress.groupsTotal && progress.groupsProcessed > 0) {
    const elapsedMs = now.getTime() - progress.startedAt.getTime();
    const msPerGroup = elapsedMs / progress.groupsProcessed;
    const remainingGroups = progress.groupsTotal - progress.groupsProcessed;
    progress.estimatedRemainingMs = Math.round(msPerGroup * remainingGroups);
  }

  progress.lastUpdateAt = now;
}

export function markDone(
  jobId: string,
  result: any
): void {
  const job = jobs.get(jobId);
  if (job) {
    job.status = 'done';
    job.finishedAt = new Date();
    job.durationMs = job.finishedAt.getTime() - job.startedAt.getTime();
    job.result = result;
  }
}

export function markFailed(jobId: string, error: string): void {
  const job = jobs.get(jobId);
  if (job) {
    job.status = 'failed';
    job.finishedAt = new Date();
    job.durationMs = job.finishedAt.getTime() - job.startedAt.getTime();
    job.error = error;
  }
}

/**
 * Obtener progreso formateado para el cliente
 */
export function getJobWithFormattedProgress(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return null;

  const progress = job.progress;
  
  // Calcular porcentajes
  let progressPercent = 0;
  let progressLabel = '';

  if (progress.groupsTotal && progress.groupsTotal > 0) {
    progressPercent = Math.round((progress.groupsProcessed / progress.groupsTotal) * 100);
    progressLabel = `${progress.groupsProcessed}/${progress.groupsTotal} grupos`;
  } else if (progress.competitionsTotal && progress.competitionsTotal > 0) {
    progressPercent = Math.round((progress.competitionsProcessed / progress.competitionsTotal) * 100);
    progressLabel = `${progress.competitionsProcessed}/${progress.competitionsTotal} competiciones`;
  }

  // Formatear ETA
  let estimatedTimeRemaining = '';
  if (progress.estimatedRemainingMs && progress.estimatedRemainingMs > 0) {
    const totalSeconds = Math.round(progress.estimatedRemainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    estimatedTimeRemaining = `${minutes}m ${seconds}s`;
  }

  return {
    jobId: job.jobId,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    durationMs: job.durationMs,
    progress: {
      currentStep: progress.currentStep,
      currentCompetitionId: progress.currentCompetitionId,
      currentGroupId: progress.currentGroupId,
      
      // Formato para mostrar al usuario
      percent: progressPercent,
      label: progressLabel,
      estimatedTimeRemaining,
      
      // Stats
      competitionsProcessed: progress.competitionsProcessed,
      competitionsTotal: progress.competitionsTotal,
      groupsProcessed: progress.groupsProcessed,
      groupsTotal: progress.groupsTotal,
      matchesProcessed: progress.matchesProcessed,
      matchesTotal: progress.matchesTotal,
      errorsCount: progress.errorsCount,
    },
    result: job.result,
    error: job.error,
  };
}