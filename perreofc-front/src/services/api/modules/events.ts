/**
 * API module that wraps backend calls for events.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { Event, EventCategory, PaginatedResponse } from '../types';

export const eventsApi = {
  // FASE 13: Events (CRUD) [ADMIN/SUPERADMIN]

  /** 65. GET /events - Listado de eventos */
  getEvents: (page = 1, limit = 10) => fetchClient<PaginatedResponse<Event>>(`/events?page=${page}&limit=${limit}`),

  /** 66. POST /events - Crear evento */
  createEvent: (data: Partial<Event>) => fetchClient<Event>('/events', { method: 'POST', body: JSON.stringify(data) }),

  /** 67. GET /events/:id - Obtener detalle de evento */
  getEventById: (id: string) => fetchClient<Event>(`/events/${id}`),

  /** 68. PATCH /events/:id - Actualizar evento */
  updateEvent: (id: string, data: Partial<Event>) => fetchClient<Event>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  /** 69. DELETE /events/:id - Eliminar evento */
  deleteEvent: (id: string) => fetchClient<void>(`/events/${id}`, { method: 'DELETE' }),

  // Categorías de eventos [ADMIN/SUPERADMIN]
  getEventCategories: () => fetchClient<EventCategory[]>('/events/categories'),
  createEventCategory: (data: { name: string; color: string }) =>
    fetchClient<EventCategory>('/events/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteEventCategory: (id: string) =>
    fetchClient<void>(`/events/categories/${id}`, { method: 'DELETE' }),
};
