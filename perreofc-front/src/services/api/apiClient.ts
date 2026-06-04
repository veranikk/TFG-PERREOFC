/**
 * Core API client code used by the frontend services.
 * It centralizes request setup, response parsing and shared error handling for backend calls.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/useAuthStore';
import { secureStorage } from '../../utils/secureStorage';

// Si EXPO_PUBLIC_API_URL no está definida, se usa localhost como fallback de desarrollo.
// En producción esta variable DEBE estar definida apuntando a HTTPS.
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '');

// ── Almacenamiento en memoria de tokens (para sesiones no persistentes) ───────────
// Los tokens también se guardan en memoria para evitar lecturas async en el hot path.
// SecureStore (iOS Keychain / Android Keystore) se usa como persistencia segura en lugar
// de AsyncStorage, que almacena en texto plano.
let _memToken: string | null = null;
let _memRefreshToken: string | null = null;

// ── Funciones helper de tokens ────────────────────────────────────────────────────

export const getAuthToken = async () => {
  try { return _memToken ?? await secureStorage.getItem('userToken'); } catch { return _memToken; }
};

/** Persiste el token en SecureStore (iOS Keychain / Android Keystore). Usar cuando rememberMe = true. */
export const setAuthToken = async (token: string) => {
  _memToken = token;
  try { await secureStorage.setItem('userToken', token); } catch (e) {
    console.error('Error saving auth token', e);
  }
};

/** Guarda el token solo en memoria — se pierde al cerrar la app (rememberMe = false). */
export const setAuthTokenMemory = (token: string) => {
  _memToken = token;
};

export const removeAuthToken = async () => {
  _memToken = null;
  try { await secureStorage.removeItem('userToken'); } catch (e) {
    console.error('Error removing auth token', e);
  }
};

export const getRefreshToken = async () => {
  try { return _memRefreshToken ?? await secureStorage.getItem('refreshToken'); } catch { return _memRefreshToken; }
};

/** Persiste el refresh token en SecureStore. Usar cuando rememberMe = true. */
export const setRefreshToken = async (token: string) => {
  _memRefreshToken = token;
  try { await secureStorage.setItem('refreshToken', token); } catch (e) {
    console.error('Error saving refresh token', e);
  }
};

/** Guarda el refresh token solo en memoria (rememberMe = false). */
export const setRefreshTokenMemory = (token: string) => {
  _memRefreshToken = token;
};

export const removeRefreshToken = async () => {
  _memRefreshToken = null;
  try { await secureStorage.removeItem('refreshToken'); } catch (e) {
    console.error('Error removing refresh token', e);
  }
};

// ── ApiError ──────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

// ── Token refresh (singleton, evita múltiples llamadas simultáneas) ───────────

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

async function doRefresh(): Promise<string | null> {
  // Determinar si la sesión es persistente (token guardado en SecureStore) o solo memoria
  const storedRefresh = await secureStorage.getItem('refreshToken').catch(() => null);
  const persistent = !!storedRefresh;
  const refresh_token = _memRefreshToken ?? storedRefresh;
  if (!refresh_token) return null;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const newAccess: string | undefined = data.session?.access_token;
    const newRefresh: string | undefined = data.session?.refresh_token;
    if (!newAccess) return null;
    if (persistent) {
      await setAuthToken(newAccess);
      if (newRefresh) await setRefreshToken(newRefresh);
    } else {
      setAuthTokenMemory(newAccess);
      if (newRefresh) setRefreshTokenMemory(newRefresh);
    }
    return newAccess;
  } catch {
    return null;
  }
}

async function refreshOnce(): Promise<string | null> {
  if (isRefreshing) {
    // Cola: esperar a que la llamada en vuelo resuelva
    return new Promise<string | null>((resolve) => {
      pendingQueue.push(resolve);
    });
  }

  isRefreshing = true;
  let newToken: string | null = null;
  try {
    newToken = await doRefresh();
  } finally {
    isRefreshing = false;
    pendingQueue.forEach((cb) => cb(newToken));
    pendingQueue = [];
  }
  return newToken;
}

async function forceLogout() {
  await removeAuthToken();
  await removeRefreshToken();
  useAuthStore.getState().logout();
}

// ── fetchClient ───────────────────────────────────────────────────────────────

export const fetchClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    ...(options.body !== undefined && options.body !== null ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorData: any;
    try { errorData = await response.json(); } catch { errorData = { message: 'An unexpected error occurred' }; }

    if (response.status === 401 && errorData?.code === 'TOKEN_EXPIRED') {
      const newToken = await refreshOnce();

      if (newToken) {
        // Reintentar la petición original con el token nuevo
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        const retry = await fetch(url, { ...options, headers: retryHeaders });

        if (retry.ok) {
          if (retry.status === 204) return null as T;
          return retry.json() as Promise<T>;
        }

        // El reintento también falló
        let retryError: any;
        try { retryError = await retry.json(); } catch { retryError = {}; }
        if (retry.status === 401) await forceLogout();
        throw new ApiError(retry.status, retryError.error || retryError.message || 'API Error', retryError);
      }

      // No se pudo refrescar: cerrar sesión
      await forceLogout();
    } else if (response.status === 401) {
      await forceLogout();
    }

    throw new ApiError(response.status, errorData.error || errorData.message || 'API Error', errorData);
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
};
