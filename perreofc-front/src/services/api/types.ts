/**
 * Core API client code used by the frontend services.
 * It centralizes request setup, response parsing and shared error handling for backend calls.
 */

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  firstName: string;
  lastName: string;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  matchUpdates: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Competition {
  id: string;
  seasonId: string;
  name: string;
  type: string;
}

export interface Standing {
  teamId: string;
  teamName: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  teamId: string;
  goals: number;
  assists?: number;
  yellowCards: number;
  redCards: number;
}

export interface Group {
  id: string;
  competitionId: string;
  name: string;
}

export interface Match {
  id: string;
  groupId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  status: 'upcoming' | 'live' | 'finished' | 'suspended';
  roundNumber?: number;
}

export interface Lineup {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  isStarter: boolean;
  position?: string;
  jerseyNumber?: number;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  minute: number;
  playerId: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
}

export interface Player {
  id: string;
  teamId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: string;
  photoUrl?: string;
}

export interface Bet {
  id: string;
  userId: string;
  matchId: string;
  prediction: 'home' | 'draw' | 'away';
  status: 'pending' | 'won' | 'lost';
  pointsWagered: number;
  pointsEarned?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsPaginated {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface News {
  id: string;
  title: string;
  content: string;
  authorId: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  type: string;
  visibility: string[];
  matchId?: string;
  recurrence?: {
    type: 'weekly' | 'monthly' | 'custom';
    interval: number;
    endDate?: string;
  };
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}
