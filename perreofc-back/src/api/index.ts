/**
 * Builds the main Fastify API plugin for the backend.
 * Each feature route is mounted here so the server exposes a single API surface.
 */

import type { FastifyPluginAsync } from 'fastify';
import { healthRoutes } from './features/health/healthRoutes.js';
import { authRoutes } from './features/auth/authRoutes.js';

import { meRoutes } from './features/me/meRoutes.js';
import { classificationRoutes } from './features/classification/classificationRoutes.js';
import { topScorersRoutes } from './features/topScorers/topScorersRoutes.js';
import { teamsRoutes } from './features/teams/teamsRoutes.js';
import { playersRoutes } from './features/players/playersRoutes.js';
import { matchesRoutes } from './features/matches/matchesRoutes.js';
import { seasonsRoutes } from './features/seasons/seasonsRoutes.js';
import { competitionsRoutes } from './features/competitions/competitionsRoutes.js';
import { groupsRoutes } from './features/groups/groupsRoutes.js';
import { homeRoutes } from './features/home/homeRoutes.js';
import { betsRoutes } from './features/bets/betsRoutes.js';
import { mvpVotesRoutes } from './features/mvpVotes/mvpVotesRoutes.js';
import { leaderboardRoutes } from './features/leaderboard/leaderboardRoutes.js';
import { pointsRoutes } from './features/points/pointsRoutes.js';
import { newsRoutes } from './features/news/newsRoutes.js';
import { eventsRoutes } from './features/events/eventsRoutes.js';
import { usersRoutes } from './features/users/usersRoutes.js';
import { notificationsRoutes } from './features/notifications/notificationsRoutes.js';
import { chatRoutes } from './features/chat/chatRoutes.js';
import { imagesRoutes } from './features/images/imagesRoutes.js';
import { uploadRoutes } from './features/upload/uploadRoutes.js';
import { squadCallsRoutes } from './features/squadCalls/squadCallsRoutes.js';
import { albumsRoutes } from './features/albums/albumsRoutes.js';
import { logsRoutes } from './features/logs/logsRoutes.js';

export const apiPlugin: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/auth' })

  await app.register(meRoutes);
  await app.register(usersRoutes);
  await app.register(notificationsRoutes);
  await app.register(classificationRoutes);
  await app.register(topScorersRoutes);
  await app.register(teamsRoutes);
  await app.register(playersRoutes);
  await app.register(seasonsRoutes);
  await app.register(competitionsRoutes);
  await app.register(groupsRoutes);
  await app.register(matchesRoutes);
  await app.register(homeRoutes);
  await app.register(betsRoutes);
  await app.register(mvpVotesRoutes);
  await app.register(leaderboardRoutes);
  await app.register(pointsRoutes);
  await app.register(newsRoutes);
  await app.register(eventsRoutes);
  await app.register(chatRoutes, { prefix: '/chat' });
  await app.register(imagesRoutes);
  await app.register(uploadRoutes);
  await app.register(squadCallsRoutes);
  await app.register(albumsRoutes);
  await app.register(logsRoutes);
};
