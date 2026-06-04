/**
 * Contains the business and persistence logic for the logs backend feature.
 * Important Supabase queries and domain rules live here instead of inside the routes.
 */

import { getAdminClient } from '../../../shared/supabase.js';

export async function logAction(params: {
  userId: string;
  username: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
}) {
  try {
    await getAdminClient().from('system_logs').insert({
      user_id: params.userId,
      username: params.username,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      details: params.details ?? null,
    });
  } catch {
    // Logging nunca debe romper la operación principal
  }
}

export async function getLogs(params: {
  limit?: number;
  offset?: number;
  actions?: string[];
}) {
  const { limit = 100, offset = 0, actions } = params;

  let query = getAdminClient()
    .from('system_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (actions && actions.length > 0) {
    query = query.in('action', actions);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    logs: (data ?? []).map((row) => ({
      id: row.id as string,
      action: row.action as string,
      entityType: row.entity_type as string | null,
      entityId: row.entity_id as string | null,
      userId: row.user_id as string | null,
      username: row.username as string,
      timestamp: row.created_at as string,
      details: row.details as string | null,
    })),
    total: count ?? 0,
  };
}





