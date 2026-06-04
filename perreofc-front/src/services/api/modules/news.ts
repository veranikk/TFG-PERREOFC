/**
 * API module that wraps backend calls for news.
 * Keeping endpoint calls here gives screens a typed and reusable data access layer.
 */

import { fetchClient } from '../apiClient';
import { News, NewsCategory, PaginatedResponse } from '../types';

export const newsApi = {
  // FASE 12: News (CRUD) [ADMIN/SUPERADMIN]
  
  /** 60. GET /news - Listado de noticias */
  getNews: (page = 1, limit = 10) => fetchClient<PaginatedResponse<News>>(`/news?page=${page}&limit=${limit}`),

  /** 61. POST /news - Crear noticia */
  createNews: (data: Partial<News>) => fetchClient<News>('/news', { method: 'POST', body: JSON.stringify(data) }),

  /** 62. GET /news/:id - Obtener detalle de noticia */
  getNewsById: (id: string) => fetchClient<News>(`/news/${id}`),

  /** 63. PATCH /news/:id - Actualizar noticia */
  updateNews: (id: string, data: Partial<News>) => fetchClient<News>(`/news/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  /** 64. DELETE /news/:id - Eliminar noticia */
  deleteNews: (id: string) => fetchClient<void>(`/news/${id}`, { method: 'DELETE' }),

  /** POST /news/:id/image - Establecer imagen de portada */
  setNewsImage: (newsId: string, url: string) =>
    fetchClient<void>(`/news/${newsId}/image`, { method: 'POST', body: JSON.stringify({ url }) }),

  /** DELETE /news/:id/image - Eliminar imagen de portada */
  deleteNewsImage: (newsId: string) =>
    fetchClient<void>(`/news/${newsId}/image`, { method: 'DELETE' }),

  /** GET /news/categories - Listar categorías */
  getCategories: () =>
    fetchClient<NewsCategory[]>('/news/categories'),

  /** POST /news/categories - Crear categoría (admin/superadmin) */
  createCategory: (data: { name: string; color: string }) =>
    fetchClient<NewsCategory>('/news/categories', { method: 'POST', body: JSON.stringify(data) }),

  /** DELETE /news/categories/:id - Borrar categoría (admin/superadmin) */
  deleteCategory: (id: string) =>
    fetchClient<void>(`/news/categories/${id}`, { method: 'DELETE' }),
};
