/**
 * Handles HTTP request and response logic for the home backend feature.
 * It delegates database work to services and keeps route handlers focused on API behavior.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { getHome } from './homeServices.js';

export async function getHomeHandler(_req: FastifyRequest, _reply: FastifyReply) {
  return getHome();
}




