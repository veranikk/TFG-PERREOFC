/**
 * Shared TypeScript types used throughout the frontend.
 * These contracts keep screens, services and stores aligned with the domain model.
 */

// src/types/index.ts — tipos globales de la app

export type UserRole = 'aficionado' | 'jugador' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  points: number;          // solo aficionado
  banned: boolean;
  playerId?: number | null; // vinculación con players.id (solo jugadores)
  createdAt: string;       // ISO date
}

export type EventType =
  | 'match'
  | 'friendly'
  | 'training'
  | 'medical'
  | 'dinner'
  | 'meeting'
  | 'other';

export type EventVisibility = 'aficionado' | 'jugador' | 'admin' | 'superadmin';

export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface MatchStats {
  possession: [number, number];   // [local, visitor] %
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
}

export interface PlayerLineup {
  playerId: string;
  name: string;
  dorsal: number;
  position: string;
  x: number;   // % horizontal en el campo (0–100)
  y: number;   // % vertical en el campo (0–100)
  isStarter?: boolean;
  isSubstitute?: boolean;
  isCaptain?: boolean;
  isGoalkeeper?: boolean;
}

export interface MatchStaffEntry {
  staffId?: string;
  staffName: string;
  roleDescription?: string;
  side: 'home' | 'away';
}

export interface EventRecurrence {
  type: 'weekly' | 'monthly' | 'custom';
  interval: number;
  days?: number[];         // 0=Dom … 6=Sáb (solo para type='custom')
  endDate?: string;        // 'yyyy-MM-dd'
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  date: string;            // ISO date
  time?: string;           // 'HH:mm'
  location?: string;
  visibility: EventVisibility[];
  matchId?: string;        // si type === 'match' | 'friendly'
  color?: string;          // color personalizado elegido por admin/superadmin (hex)
  recurrence?: EventRecurrence;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: number;
  awayTeamId?: number;
  homeShieldUrl?: string;
  awayShieldUrl?: string;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  date: string;
  time?: string;
  location?: string;
  competition?: string;
  stats?: MatchStats;
  lineup?: {
    home: PlayerLineup[];
    away: PlayerLineup[];
  };
  homeFormation?: string;
  awayFormation?: string;
  homeCoachName?: string;
  awayCoachName?: string;
  isSuspended?: boolean;
  staff?: MatchStaffEntry[];
  weather?: {
    temp: number;
    description: string;
    humidity: number;
    wind: number;
    icon: string;
  };
}

export interface RecentMatch {
  matchId: number;
  date: string;
  homeTeamName: string;
  awayTeamName: string;
  score: string;
  isStarter: boolean;
  goals: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  lastName: string;
  fullName?: string;
  birthYear?: number;
  isGoalkeeper?: boolean;
  dorsal: number;
  position: string;
  positionCode?: string;
  photoUrl?: string;
  stats: {
    matches: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutes: number;
    matchesCalled?: number;
    matchesStarting?: number;
    matchesSubstitute?: number;
    goalsAvg?: number;
    minutesAvg?: number;
    doubleYellowCards?: number;
  };
  recentMatches?: RecentMatch[];
  squadInfo?: {
    called: boolean;
    callTime?: string;
    kit?: 'titular' | 'suplente';
  };
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  category: string;
  author: string;
  publishedAt: string;
  isFeatures?: boolean;
}

export interface NewsCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface MediaImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  location?: string;
  type: 'photo' | 'video';
  takenAt: string;
}

export interface ImageFolder {
  id: string;
  name: string;
  coverUrl?: string;   // primera imagen de la carpeta como portada
  images: MediaImage[];
  createdAt: string;
}

export interface TopScorerEntry {
  position: number;
  playerId: number | string;
  playerName: string;
  teamId: number | string;
  teamName: string;
  matchesPlayed: number;
  goals: number;
  penaltyGoals: number;
}

export interface ClassificationEntry {
  pos: number;
  teamId: string;
  teamName: string;
  teamLogoUrl?: string;
  pts: number;
  pj: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  gc: number;
  sanction?: number;
  isOwn?: boolean;         // true para Perreo FC
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  points: number;
  isCurrentUser?: boolean;
}

export interface SystemLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId: string;
  username: string;
  timestamp: string;
  details?: string;
}

export interface PointsConfig {
  register: number;
  dailyLogin: number;
  voteMvp: number;
  bet: number;
  winBet: number;
}

export interface PlayerImage {
  id: string;
  url: string;
  isProfile: boolean;
  description?: string;
  createdAt: string;
}

export interface StaffImage {
  id: string;
  url: string;
  isProfile: boolean;
  description?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  fullName: string;
  photoUrl?: string;
  role: string;
  roleDescription?: string;
}

export interface UploadResult {
  publicUrl: string;
}
