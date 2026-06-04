/**
 * API module that wraps backend calls for logs.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { SystemLog } from '../../../types';

export interface LogsResponse {
  logs: SystemLog[];
  total: number;
}

export const logsApi = {
  getLogs: (filter: string = 'all', limit = 100, offset = 0) =>
    fetchClient<LogsResponse>(`/admin/logs?filter=${filter}&limit=${limit}&offset=${offset}`),
};
