/**
 * Core API client code used by the frontend services.
 * It centralizes request setup, response parsing and shared error handling for backend calls.
 */

import { meApi } from './modules/me';
import { usersApi } from './modules/users';
import { leaguesApi } from './modules/leagues';
import { matchesApi } from './modules/matches';
import { teamsApi } from './modules/teams';
import { playersApi } from './modules/players';
import { betsApi } from './modules/bets';
import { notificationsApi } from './modules/notifications';
import { homeApi } from './modules/home';
import { newsApi } from './modules/news';
import { eventsApi } from './modules/events';
import { authApi } from './modules/auth';
import { chatApi } from './modules/chat';
import { playerImagesApi } from './modules/playerImages';
import { staffImagesApi } from './modules/staffImages';
import { squadCallsApi } from './modules/squadCalls';
import { albumsApi } from './modules/albums';
import { logsApi } from './modules/logs';

export * from './types';
export * from './apiClient';
export { uploadFile, uploadFromUrl, uploadAlbumPhoto } from './modules/upload';

export const api = {
  auth: authApi,
  me: meApi,
  users: usersApi,
  leagues: leaguesApi,
  matches: matchesApi,
  teams: teamsApi,
  players: playersApi,
  bets: betsApi,
  notifications: notificationsApi,
  home: homeApi,
  news: newsApi,
  events: eventsApi,
  chat: chatApi,
  playerImages: playerImagesApi,
  staffImages: staffImagesApi,
  squadCalls: squadCallsApi,
  albums: albumsApi,
  logs: logsApi,
};

export default api;
