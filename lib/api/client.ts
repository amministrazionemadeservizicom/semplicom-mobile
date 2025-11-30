/**
 * API Client centralizzato per React Native
 * Adattato da sempliswitch/client/api/client.ts
 */

import { API_BASE_URL, VERBOSE_LOGGING } from '../config';
import { mobileStorage } from '../storage';

export interface ApiOptions extends RequestInit {
  hasAuth?: boolean;
}

export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data?: T;
}

/**
 * Costruisce URL completo per API
 */
function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  let normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!normalizedPath.startsWith('/api/')) {
    normalizedPath = `/api${normalizedPath}`;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Ottiene token da AsyncStorage
 */
async function getToken(): Promise<string | null> {
  try {
    const token = await mobileStorage.getItem('SS_TOKEN');
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Pulisce auth e ritorna false per trigger redirect
 */
async function clearAuth(): Promise<void> {
  await mobileStorage.removeItem('SS_TOKEN');
  await mobileStorage.removeItem('authToken');
  await mobileStorage.removeItem('userRole');
  await mobileStorage.removeItem('userEmail');
  await mobileStorage.removeItem('userName');
  await mobileStorage.removeItem('authExpiresAt');
}

/**
 * Parse JSON sicuro
 */
async function safeParseJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

/**
 * API client principale
 */
export async function api<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { hasAuth = false, headers: customHeaders, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(customHeaders as Record<string, string>)
  };

  // Inject JWT token se hasAuth
  if (hasAuth) {
    const token = await getToken();

    if (!token) {
      console.error('❌ No token found');
      throw new Error('Unauthorized');
    }

    headers['Authorization'] = `Bearer ${token}`;

    if (VERBOSE_LOGGING) {
      console.log(`🔐 Token: ${token.substring(0, 15)}...`);
    }
  }

  const url = buildUrl(path);

  if (VERBOSE_LOGGING) {
    console.log('🔄 API Request:', {
      url,
      method: init.method || 'GET',
      hasAuth
    });
  }

  try {
    const res = await fetch(url, {
      ...init,
      headers,
    });

    const json = await safeParseJson(res);

    if (VERBOSE_LOGGING) {
      console.log('📥 API Response:', {
        url,
        status: res.status,
        ok: res.ok,
      });
    }

    // Handle 401/403
    if ((res.status === 401 || res.status === 403) && hasAuth) {
      console.warn(`📥 ${res.status} - sessione scaduta`);
      await clearAuth();
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const errorMsg = json?.message || `HTTP ${res.status}`;
      console.error('❌ API Error:', errorMsg);
      throw new Error(errorMsg);
    }

    // Server returns {code, data, message} format
    if (json && typeof json.code === 'number') {
      if (json.code !== 0) {
        throw new Error(json.message || 'Server error');
      }
      return json.data as T;
    }

    return json as T;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ API Error:', errorMsg);
    throw error;
  }
}

/**
 * Helper methods
 */
export async function get<T = any>(path: string, options?: ApiOptions): Promise<T> {
  return api<T>(path, { ...options, method: 'GET' });
}

export async function post<T = any>(path: string, body?: any, options?: ApiOptions): Promise<T> {
  return api<T>(path, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  });
}

export async function put<T = any>(path: string, body?: any, options?: ApiOptions): Promise<T> {
  return api<T>(path, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  });
}

export async function patch<T = any>(path: string, body?: any, options?: ApiOptions): Promise<T> {
  return api<T>(path, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined
  });
}

export async function del<T = any>(path: string, options?: ApiOptions): Promise<T> {
  return api<T>(path, { ...options, method: 'DELETE' });
}

/**
 * Authenticated fetch convenience wrapper
 */
export const authed = {
  get: <T = any>(path: string) =>
    api<T>(path, { method: 'GET', hasAuth: true }),

  post: <T = any>(path: string, body?: any) =>
    api<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      hasAuth: true
    }),

  put: <T = any>(path: string, body?: any) =>
    api<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      hasAuth: true
    }),

  patch: <T = any>(path: string, body?: any) =>
    api<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      hasAuth: true
    }),

  del: <T = any>(path: string) =>
    api<T>(path, { method: 'DELETE', hasAuth: true }),

  delete: <T = any>(path: string) =>
    api<T>(path, { method: 'DELETE', hasAuth: true })
};

export const authedFetch = api;
