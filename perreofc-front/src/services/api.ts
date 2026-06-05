/**
 * Frontend service module for api behavior.
 * It isolates platform or API concerns away from React components.
 */

// src/services/api.ts
// Única puerta de entrada a los datos. Migrado a backend real (USE_MOCKS = false).

import { addDays, addMonths, parseISO, format, getDay } from 'date-fns';
import { User, Event, Match, NewsArticle, MediaImage, Player, Team, LeaderboardEntry, ClassificationEntry, StaffMember } from '../types';
import { api as newApi, fetchClient, setAuthToken, setRefreshToken, setAuthTokenMemory, setRefreshTokenMemory, uploadAlbumPhoto } from './api/index';
import type { Album, AlbumDetail, Photo } from './api/modules/albums';
import { MOCK_IMAGES, mockLogin } from '../mocks';

const USE_MOCKS = false;

function expandRecurringEvents(events: Event[]): Event[] {
  const result: Event[] = [];
  const maxDate = addMonths(new Date(), 12); // máximo 12 meses adelante

  for (const event of events) {
    result.push(event);
    if (!event.recurrence) continue;
    console.log('[recurrence] evento:', event.title, JSON.stringify(event.recurrence));

    const { type, interval, days, endDate } = event.recurrence;
    const limit = endDate ? parseISO(endDate) : maxDate;
    const effectiveLimit = limit < maxDate ? limit : maxDate;

    if (type === 'weekly' || type === 'monthly') {
      let current = parseISO(event.date);
      for (let i = 0; i < 500; i++) {
        current = type === 'weekly'
          ? addDays(current, (interval || 1) * 7)
          : addMonths(current, interval || 1);
        if (current > effectiveLimit) break;
        result.push({ ...event, date: format(current, 'yyyy-MM-dd') });
      }
    } else if (type === 'custom' && days && days.length > 0) {
      // Para cada día de la semana objetivo, busca la primera ocurrencia
      // después de la fecha base y repite cada 7 días
      for (const targetDay of days) {
        let d = addDays(parseISO(event.date), 1);
        // avanza hasta el próximo targetDay
        while (getDay(d) !== targetDay) d = addDays(d, 1);
        while (d <= effectiveLimit) {
          result.push({ ...event, date: format(d, 'yyyy-MM-dd') });
          d = addDays(d, 7);
        }
      }
    }
  }
  return result;
}

const RFFM_BASE = 'https://www.rffm.es';
function normalizeRffmUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith('/') ? `${RFFM_BASE}${url}` : url;
}

export const api = {
  // ── AUTH ──────────────────────────────────────────────────────────────────
  register: async (data: { email: string; password: string; username: string; firstName: string; lastName: string }): Promise<{ message: string }> => {
    return newApi.auth.register(data);
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return newApi.auth.forgotPassword(email);
  },

  verifyOtp: async (email: string, token: string, type: 'signup' | 'recovery' | 'email_change'): Promise<{ session: any; user: any }> => {
    return newApi.auth.verifyOtp(email, token, type);
  },

  resetPasswordWithOtp: async (email: string, otp: string, newPassword: string): Promise<{ message: string }> => {
    return newApi.auth.resetPasswordWithOtp(email, otp, newPassword);
  },

  resetPassword: async (password: string, token: string): Promise<{ message: string }> => {
    return newApi.auth.resetPassword(password, token);
  },

  login: async (email: string, password: string, rememberMe = true): Promise<User | null> => {
    if (USE_MOCKS) {
      const result = mockLogin(email, password);
      if (!result) return null;
      const { password: _pw, ...user } = result;
      return user as User;
    }
    const res = await fetchClient<{ user: User; session: { access_token: string; refresh_token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.session?.access_token) {
      if (rememberMe) {
        await setAuthToken(res.session.access_token);
      } else {
        setAuthTokenMemory(res.session.access_token);
      }
    }
    if (res.session?.refresh_token) {
      if (rememberMe) {
        await setRefreshToken(res.session.refresh_token);
      } else {
        setRefreshTokenMemory(res.session.refresh_token);
      }
    }

    return res.user;
  },

  // ── USERS ─────────────────────────────────────────────────────────────────
  getMe: async (): Promise<User | null> => {
    if (USE_MOCKS) return null;
    try { return (await newApi.me.getMe()) as unknown as User; } catch { return null; }
  },

  getUsers: async (search?: string): Promise<User[]> => {
    if (USE_MOCKS) return [];
    try {
      const params = new URLSearchParams({ page: '1', limit: '100' });
      if (search) params.set('search', search);
      const res = await fetchClient<any>(`/admin/users?${params.toString()}`);
      return (res?.data ?? res) as unknown as User[];
    } catch { return []; }
  },

  getUser: async (id: string): Promise<User | null> => {
    if (USE_MOCKS) return null;
    try { return (await newApi.users.getUserProfile(id)) as unknown as User; } catch { return null; }
  },

  getAdminUser: async (id: string): Promise<User | null> => {
    try { return (await newApi.users.getAdminUser(id)) as unknown as User; } catch { return null; }
  },

  requestDeleteAccount: async (): Promise<{ message: string }> => {
    return newApi.users.requestDeleteAccount();
  },

  confirmDeleteAccount: async (pin: string): Promise<{ message: string }> => {
    return newApi.users.confirmDeleteAccount(pin);
  },

  // ── EVENTS ────────────────────────────────────────────────────────────────
  getEvents: async (): Promise<Event[]> => {
    if (USE_MOCKS) return [];
    try {
      const res = await newApi.events.getEvents(1, 100);
      return expandRecurringEvents(res.data as unknown as Event[]);
    } catch { return []; }
  },

  getEvent: async (id: string): Promise<Event | null> => {
    if (USE_MOCKS) return null;
    try { return (await newApi.events.getEventById(id)) as unknown as Event; } catch { return null; }
  },

  createEvent: async (data: Partial<Event>): Promise<Event> => {
    return (await newApi.events.createEvent(data as any)) as unknown as Event;
  },

  updateEvent: async (id: string, data: Partial<Event>): Promise<Event> => {
    return (await newApi.events.updateEvent(id, data as any)) as unknown as Event;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await newApi.events.deleteEvent(id);
  },

  // ── MATCHES ───────────────────────────────────────────────────────────────
  getMatch: async (id: string): Promise<Match | null> => {
    if (USE_MOCKS) return null;
    try { return (await newApi.matches.getMatchById(id)) as unknown as Match; } catch { return null; }
  },

  /** Partidos del equipo propio — para mostrar en el calendario */
  getTeamMatches: async (teamId: string): Promise<Match[]> => {
    if (USE_MOCKS) return [];
    try {
      const res = await newApi.teams.getTeamMatches(teamId);
      const list: any[] = Array.isArray(res) ? res : (res as any)?.matches ?? (res as any)?.data ?? [];
      return list.map((m: any): Match => ({
        id:             String(m.id ?? m.matchId ?? ''),
        homeTeam:       m.homeTeamName ?? m.home_team_name ?? m.homeTeam ?? '',
        awayTeam:       m.awayTeamName ?? m.away_team_name ?? m.awayTeam ?? '',
        homeShieldUrl:  normalizeRffmUrl(m.homeShieldUrl ?? m.home_shield_url),
        awayShieldUrl:  normalizeRffmUrl(m.awayShieldUrl ?? m.away_shield_url),
        homeScore:      m.homeScore    ?? m.home_score   ?? m.goalsHome ?? undefined,
        awayScore:      m.awayScore    ?? m.away_score   ?? m.goalsAway ?? undefined,
        status:         (m.status === 'finished' || m.status === 'played') ? 'finished'
                      : m.status === 'live'     ? 'live'
                      : 'upcoming',
        date:           (m.date ?? m.matchDate ?? m.scheduledAt ?? '').slice(0, 10),
        time:           m.time ?? m.matchTime ?? undefined,
        location:       m.location ?? m.venue ?? undefined,
        competition:    m.competitionName ?? m.competition ?? undefined,
      }));
    } catch { return []; }
  },

  // ── NEWS ──────────────────────────────────────────────────────────────────
  getNews: async (): Promise<NewsArticle[]> => {
    if (USE_MOCKS) return [];
    try {
      const res = await fetchClient<any>('/news?page=1&limit=50');
      // Backend: { data: [...], pagination: {...} }
      const raw: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      return raw.map((n: any): NewsArticle => ({
        id:         n.id ?? '',
        title:      n.title ?? '',
        body:       n.body ?? '',
        imageUrl:   n.imageUrl ?? n.image_url ?? undefined,
        category:   n.category ?? '',
        author:     n.author ?? '',
        publishedAt: n.publishedAt ?? n.published_at ?? new Date().toISOString(),
        isFeatures: n.isFeatures ?? n.is_featured ?? false,
      }));
    } catch { return []; }
  },

  getNewsArticle: async (id: string): Promise<NewsArticle | null> => {
    if (USE_MOCKS) return null;
    try {
      const n = await newApi.news.getNewsById(id) as any;
      if (!n) return null;
      return {
        id:         n.id ?? '',
        title:      n.title ?? '',
        body:       n.body ?? '',
        imageUrl:   n.imageUrl ?? n.image_url ?? undefined,
        category:   n.category ?? '',
        author:     n.author ?? n.authorUsername ?? '',
        publishedAt: n.publishedAt ?? n.published_at ?? new Date().toISOString(),
        isFeatures: n.isFeatures ?? n.is_featured ?? false,
      };
    } catch { return null; }
  },

  createNews: async (data: Partial<NewsArticle>): Promise<NewsArticle> => {
    // Backend espera camelCase: title, body, category, publishedAt, imageUrl, isFeatures
    const raw = await fetchClient<any>('/news', {
      method: 'POST',
      body: JSON.stringify({
        title:      data.title,
        body:       data.body,
        category:   data.category,
        publishedAt: data.publishedAt ?? new Date().toISOString(),
        imageUrl:   data.imageUrl ?? null,
        isFeatures: data.isFeatures ?? false,
      }),
    });
    // Respuesta: row cruda de Supabase (snake_case) o mapeada (camelCase)
    return {
      id:         raw.id ?? '',
      title:      raw.title ?? data.title ?? '',
      body:       raw.body ?? data.body ?? '',
      imageUrl:   raw.imageUrl ?? raw.image_url ?? undefined,
      category:   raw.category ?? data.category ?? '',
      author:     raw.author ?? '',
      publishedAt: raw.publishedAt ?? raw.published_at ?? data.publishedAt ?? new Date().toISOString(),
      isFeatures: raw.isFeatures ?? raw.is_featured ?? false,
    };
  },

  deleteNews: async (id: string): Promise<void> => {
    await newApi.news.deleteNews(id);
  },

  // ── IMAGES ────────────────────────────────────────────────────────────────
  getImages: async (): Promise<MediaImage[]> => {
    // No existe endpoint de imágenes en los 69 de la especificación, usamos mock por ahora
    return MOCK_IMAGES;
  },

  // ── ALBUMS ────────────────────────────────────────────────────────────────
  getAlbums: async (page = 1, limit = 20): Promise<{ data: Album[]; pagination: any }> => {
    try { return await newApi.albums.getAlbums(page, limit); } catch { return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } }; }
  },

  getAlbum: async (id: string): Promise<AlbumDetail | null> => {
    try { return await newApi.albums.getAlbumById(id); } catch { return null; }
  },

  createAlbum: async (data: { title: string; description?: string | null; coverUrl?: string | null; eventDate?: string | null }): Promise<Album> => {
    return newApi.albums.createAlbum(data);
  },

  updateAlbum: async (id: string, data: Partial<{ title: string; description: string | null; coverUrl: string | null; eventDate: string | null }>): Promise<Album> => {
    return newApi.albums.updateAlbum(id, data);
  },

  deleteAlbum: async (id: string): Promise<void> => {
    await newApi.albums.deleteAlbum(id);
  },

  /** Sube un archivo local al bucket Y persiste en media_images (un solo request) */
  uploadAlbumPhoto: async (albumId: string, localUri: string): Promise<Photo> => {
    return uploadAlbumPhoto(albumId, localUri);
  },

  /** Añade una foto a un álbum a partir de una URL ya pública */
  addPhotoToAlbum: async (albumId: string, data: { url: string; thumbnailUrl?: string | null; description?: string | null; location?: string | null; type?: 'photo' | 'video'; takenAt?: string | null }): Promise<Photo> => {
    return newApi.albums.addPhoto(albumId, data);
  },

  updateAlbumPhoto: async (albumId: string, photoId: string, data: Partial<{ description: string | null; takenAt: string | null }>): Promise<Photo> => {
    return newApi.albums.updatePhoto(albumId, photoId, data);
  },

  deleteAlbumPhoto: async (albumId: string, photoId: string): Promise<void> => {
    await newApi.albums.deletePhoto(albumId, photoId);
  },

  setAlbumCover: async (albumId: string, photoId: string): Promise<void> => {
    await newApi.albums.setAlbumCover(albumId, photoId);
  },

  // ── TEAMS & PLAYERS ───────────────────────────────────────────────────────
  getTeams: async (): Promise<Team[]> => {
    if (USE_MOCKS) return [];
    try { return await fetchClient<Team[]>('/teams'); } catch { return []; }
  },

  getPlayers: async (teamId: string): Promise<Player[]> => {
    if (USE_MOCKS) return [];
    try {
      const res = (await newApi.teams.getTeamSquad(teamId)) as any;
      const list: any[] = Array.isArray(res) ? res : (res.players ?? []);
      return list.map((p: any) => ({
        id:       String(p.id),
        teamId:   String(p.teamId ?? teamId),
        name:     p.firstName ?? p.first_name ?? (p.fullName ?? p.full_name ?? '').split(' ')[0] ?? '',
        lastName: p.lastName  ?? p.last_name  ?? (p.fullName ?? p.full_name ?? '').split(' ').slice(1).join(' ') ?? '',
        dorsal:   p.dorsal ?? 0,
        position:     p.position      ?? p.position_code ?? '',
        positionCode: p.positionCode  ?? p.position_code ?? p.position ?? '',
        photoUrl:     p.photoUrl      ?? p.photo_url     ?? undefined,
        stats: {
          matches:     p.stats?.matchesPlayed ?? p.stats?.matches_played ?? 0,
          goals:       p.stats?.goalsTotal    ?? p.stats?.goals_total    ?? 0,
          assists:     p.stats?.assists       ?? 0,
          yellowCards: p.stats?.yellowCards   ?? p.stats?.yellow_cards   ?? 0,
          redCards:    p.stats?.redCards      ?? p.stats?.red_cards      ?? 0,
          minutes:     p.stats?.minutesTotal  ?? p.stats?.minutes_total  ?? 0,
        },
      }));
    } catch { return []; }
  },

  getStaff: async (teamId: string): Promise<StaffMember[]> => {
    if (USE_MOCKS) return [];
    try {
      const res = (await newApi.teams.getTeamSquad(teamId)) as any;
      const list: any[] = Array.isArray(res) ? [] : (res.staff ?? []);
      return list.map((s: any): StaffMember => ({
        id:              String(s.id),
        fullName:        s.fullName ?? s.full_name ?? '',
        photoUrl:        s.photoUrl ?? s.photo_url ?? undefined,
        role:            s.role ?? '',
        roleDescription: s.roleDescription ?? s.role_description ?? undefined,
      }));
    } catch { return []; }
  },

  getPlayer: async (id: string): Promise<Player | null> => {
    if (USE_MOCKS) return null;
    try {
      const p = (await newApi.players.getPlayerById(id)) as any;
      if (!p) return null;
      const team = p.currentTeam ?? null;
      return {
        id:           String(p.id),
        teamId:       String(team?.id ?? p.teamId ?? ''),
        name:         p.firstName  ?? p.first_name  ?? (p.fullName ?? p.full_name ?? '').split(' ')[0] ?? '',
        lastName:     p.lastName   ?? p.last_name   ?? (p.fullName ?? p.full_name ?? '').split(' ').slice(1).join(' ') ?? '',
        fullName:     p.fullName   ?? p.full_name   ?? undefined,
        birthYear:    p.birthYear  ?? p.birth_year  ?? undefined,
        isGoalkeeper: p.isGoalkeeper ?? p.is_goalkeeper ?? false,
        dorsal:       team?.dorsal  ?? p.dorsal ?? 0,
        position:     team?.position ?? p.position ?? p.position_code ?? '',
        positionCode: team?.position ?? p.positionCode ?? p.position_code ?? p.position ?? '',
        photoUrl:     p.photoUrl   ?? p.photo_url   ?? undefined,
        stats: {
          matches:           p.stats?.matchesPlayed     ?? p.stats?.matches_played ?? 0,
          goals:             p.stats?.goalsTotal        ?? p.stats?.goals_total    ?? 0,
          assists:           p.stats?.assists           ?? 0,
          yellowCards:       p.stats?.yellowCards       ?? p.stats?.yellow_cards   ?? 0,
          redCards:          p.stats?.redCards          ?? p.stats?.red_cards      ?? 0,
          minutes:           p.stats?.minutesTotal      ?? p.stats?.minutes_total  ?? 0,
          matchesCalled:     p.stats?.matchesCalled     ?? p.stats?.matches_called ?? undefined,
          matchesStarting:   p.stats?.matchesStarting   ?? p.stats?.matches_starting ?? undefined,
          matchesSubstitute: p.stats?.matchesSubstitute ?? p.stats?.matches_substitute ?? undefined,
          goalsAvg:          p.stats?.goalsAvg          ?? p.stats?.goals_avg     ?? undefined,
          minutesAvg:        p.stats?.minutesAvg        ?? p.stats?.minutes_avg   ?? undefined,
          doubleYellowCards: p.stats?.doubleYellowCards ?? p.stats?.double_yellow_cards ?? undefined,
        },
        recentMatches: p.recentMatches ?? [],
      };
    } catch { return null; }
  },

  adjustUserPoints: async (userId: string, delta: number): Promise<{ userId: string; delta: number; newPoints: number } | null> => {
    try { return await newApi.users.adjustUserPoints(userId, delta); } catch { return null; }
  },

  banUser: async (userId: string, banned: boolean, banReason?: string): Promise<void> => {
    await newApi.users.banUser(userId, banned, banReason);
  },

  hardDeleteUser: async (userId: string): Promise<void> => {
    await newApi.users.hardDeleteUser(userId);
  },

  getUnlinkedPlayers: async (): Promise<{ id: number; fullName: string; firstName: string; lastName: string; photoUrl: string | null }[]> => {
    try { return await newApi.users.getUnlinkedPlayers(); } catch { return []; }
  },

  createAdminUser: async (data: {
    role: 'jugador' | 'admin' | 'superadmin';
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
    playerId?: number;
  }): Promise<User> => {
    return newApi.users.createAdminUser(data) as unknown as User;
  },

  // ── LEADERBOARD ───────────────────────────────────────────────────────────
  getLeaderboard: async (period: 'total' | 'mensual' | 'semanal' = 'total'): Promise<LeaderboardEntry[]> => {
    if (USE_MOCKS) return [];
    const backendPeriod = period === 'mensual' ? 'monthly' : period === 'semanal' ? 'weekly' : 'total';
    try {
      const res = await fetchClient<{ period: string; data: LeaderboardEntry[] }>(`/leaderboard?period=${backendPeriod}`);
      return res?.data ?? [];
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
      return [];
    }
  },

  // ── CLASSIFICATION ────────────────────────────────────────────────────────
  getClassification: async (): Promise<ClassificationEntry[]> => {
    if (USE_MOCKS) return [];
    try {
      const res = (await newApi.home.getQuickClassification()) as any;
      const entries: any[] = Array.isArray(res) ? res : (res?.entries ?? []);
      return entries.map((e: any) => ({
        pos:        e.position  ?? e.pos ?? 0,
        teamId:     String(e.teamId ?? ''),
        teamName:   e.teamName  ?? '',
        teamLogoUrl: normalizeRffmUrl(e.teamShieldUrl ?? e.teamLogoUrl),
        pts:        e.pts       ?? 0,
        pj:         e.pj        ?? 0,
        w:          e.wins      ?? e.w  ?? 0,
        d:          e.draws     ?? e.d  ?? 0,
        l:          e.losses    ?? e.l  ?? 0,
        gf:         e.goalsFor  ?? e.gf ?? 0,
        gc:         e.goalsAgainst ?? e.gc ?? 0,
        sanction:   e.ptsSanction ?? e.sanction,
        isOwn:      e.isOwnTeam ?? e.isOwn ?? false,
      }));
    } catch { return []; }
  },

  getClassificationWithMeta: async (): Promise<{
    entries: ClassificationEntry[];
    leagueName: string;
    groupName: string;
    seasonName: string;
  }> => {
    const fallback = { entries: [], leagueName: 'Liga', groupName: '', seasonName: '' };
    if (USE_MOCKS) return fallback;
    try {
      const [classRes, seasonRes] = await Promise.all([
        newApi.home.getQuickClassification() as Promise<any>,
        newApi.leagues.getCurrentSeason().catch(() => null) as Promise<any>,
      ]);

      const raw: any[] = Array.isArray(classRes) ? classRes : (classRes?.entries ?? []);
      const entries: ClassificationEntry[] = raw.map((e: any) => ({
        pos:        e.position  ?? e.pos ?? 0,
        teamId:     String(e.teamId ?? ''),
        teamName:   e.teamName  ?? '',
        teamLogoUrl: normalizeRffmUrl(e.teamShieldUrl ?? e.teamLogoUrl),
        pts:        e.pts       ?? 0,
        pj:         e.pj        ?? 0,
        w:          e.wins      ?? e.w  ?? 0,
        d:          e.draws     ?? e.d  ?? 0,
        l:          e.losses    ?? e.l  ?? 0,
        gf:         e.goalsFor  ?? e.gf ?? 0,
        gc:         e.goalsAgainst ?? e.gc ?? 0,
        sanction:   e.ptsSanction ?? e.sanction,
        isOwn:      e.isOwnTeam ?? e.isOwn ?? false,
      }));

      // Nombre de liga/grupo vienen en la respuesta de clasificación
      const leagueName: string = classRes?.competitionName ?? '';
      const groupName: string = classRes?.groupName ?? '';
      const seasonName: string = seasonRes?.name ?? '';

      return { entries, leagueName, groupName, seasonName };
    } catch { return fallback; }
  },
};

