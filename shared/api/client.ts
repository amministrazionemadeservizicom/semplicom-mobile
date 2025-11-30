/**
 * HTTP Client condiviso - Platform agnostic
 * Usa IStorage per gestire i token invece di localStorage diretto
 */

import { getStorage, STORAGE_KEYS } from '../lib/storage';
import { API_CONFIG } from '../constants';

/**
 * Configurazione del client
 */
export interface ClientConfig {
  baseUrl: string;
  timeout: number;
  onUnauthorized?: () => void;
  verbose?: boolean;
}

let _config: ClientConfig = {
  baseUrl: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  verbose: false,
};

/**
 * Inizializza la configurazione del client
 */
export function initClient(config: Partial<ClientConfig>): void {
  _config = { ..._config, ...config };
}

/**
 * Ottiene la configurazione corrente
 */
export function getClientConfig(): ClientConfig {
  return _config;
}

/**
 * Costruisce URL con prefisso /api se necessario
 */
export function buildUrl(path: string): string {
  // Se path è già un URL completo, ritornalo
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Normalizza path: assicura che inizi con /
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Aggiungi /api prefix se non presente
  if (!normalizedPath.startsWith('/api/')) {
    normalizedPath = `/api${normalizedPath}`;
  }

  // Se baseUrl è relativo (/api), ritorna solo il path
  if (_config.baseUrl.startsWith('/')) {
    return normalizedPath;
  }

  // Altrimenti costruisci URL completo
  return `${_config.baseUrl}${normalizedPath}`;
}

/**
 * Ottiene il token JWT dallo storage
 */
async function getToken(): Promise<string | null> {
  try {
    const storage = getStorage();
    const token = await storage.getItem(STORAGE_KEYS.TOKEN);
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Pulisce i dati di autenticazione
 */
async function clearAuthData(): Promise<void> {
  try {
    const storage = getStorage();
    await Promise.all([
      storage.removeItem(STORAGE_KEYS.TOKEN),
      storage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
      storage.removeItem(STORAGE_KEYS.USER_ROLE),
      storage.removeItem(STORAGE_KEYS.USER_EMAIL),
      storage.removeItem(STORAGE_KEYS.USER_NAME),
      storage.removeItem(STORAGE_KEYS.AUTH_EXPIRES_AT),
    ]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

/**
 * Fetch autenticato per endpoint /api/protected/**
 * Aggiunge automaticamente Authorization: Bearer header
 * Gestisce status code 401/403/423
 */
export async function authedFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  if (!token) {
    console.warn('⚠️ authedFetch: No token found');
    await clearAuthData();
    _config.onUnauthorized?.();
    throw new Error('No authentication token');
  }

  // Build headers
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add Content-Type for POST/PUT/PATCH if body exists
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Add Authorization header
  headers['Authorization'] = `Bearer ${token}`;

  // Build full URL
  const url = buildUrl(path);

  if (_config.verbose) {
    console.log('🔐 authedFetch:', {
      url,
      method: options.method || 'GET',
      hasToken: !!token,
    });
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle different status codes
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - clearing auth');
      await clearAuthData();
      _config.onUnauthorized?.();
      throw new Error('Unauthorized');
    }

    if (response.status === 403) {
      console.error('❌ 403 Forbidden - insufficient permissions');
      throw new Error('Forbidden: insufficient permissions');
    }

    if (response.status === 423) {
      console.error('❌ 423 Locked - account locked');
      throw new Error('Account locked');
    }

    if (response.status === 500) {
      console.error('❌ 500 Internal Server Error');
      try {
        const errorBody = await response.json().catch(() => ({}));
        const errorMsg =
          errorBody.message ||
          errorBody.error ||
          "Errore interno del server. Contatta l'assistenza.";
        throw new Error(errorMsg);
      } catch {
        throw new Error("Errore interno del server. Contatta l'assistenza.");
      }
    }

    // Success responses (200, 201, 202)
    if (response.ok) {
      try {
        const json = await response.json().catch(() => null);

        // Check if server returned error code (even with 200 status)
        if (json && typeof json.code === 'number' && json.code !== 0) {
          console.error('❌ Server returned error code:', json.code, json.message);
          throw new Error(json.message || 'Server error');
        }

        return json as T;
      } catch (parseError) {
        console.warn('⚠️ Failed to parse success response:', parseError);
        return null as T;
      }
    }

    // Other error status codes
    try {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}`,
      }));
      const errorMsg = error.message || error.msg || `HTTP ${response.status}`;
      console.error(`❌ authedFetch error ${response.status}:`, errorMsg);
      throw new Error(errorMsg);
    } catch {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('❌ Network error - API unreachable');
      throw new Error('Network error: API non raggiungibile. Verifica la connessione.');
    }
    throw error;
  }
}

/**
 * Metodi di convenienza
 */
export const authed = {
  get: <T = any>(path: string) => authedFetch<T>(path, { method: 'GET' }),

  post: <T = any>(path: string, body?: any) =>
    authedFetch<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(path: string, body?: any) =>
    authedFetch<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(path: string, body?: any) =>
    authedFetch<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  del: <T = any>(path: string) => authedFetch<T>(path, { method: 'DELETE' }),

  delete: <T = any>(path: string) => authedFetch<T>(path, { method: 'DELETE' }),
};

/**
 * Fetch pubblico (non autenticato) per endpoint come /auth/login
 */
export async function publicFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = buildUrl(path);

  if (_config.verbose) {
    console.log('📡 publicFetch:', {
      url,
      method: options.method || 'GET',
    });
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Errore di rete',
      }));
      throw new Error(
        error.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('API non raggiungibile. Verifica la connessione al server.');
    }
    throw error;
  }
}
