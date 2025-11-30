/**
 * API per autenticazione
 * Condivisa tra web e mobile
 */

import { publicFetch, buildUrl } from './client';
import { getStorage, STORAGE_KEYS } from '../lib/storage';
import { API_ENDPOINTS } from '../constants';
import type { LoginRequest, LoginResponse, User } from '../types/auth';

// Re-export types for convenience
export type { LoginRequest, LoginResponse, User };

/**
 * Effettua il login
 */
export async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  console.log('🔐 Login attempt for:', credentials.username);

  const response = await publicFetch<LoginResponse>(API_ENDPOINTS.AUTH_LOGIN, {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.username, // Backend expects 'email' field
      password: credentials.password,
    }),
  });

  if (response.code !== 0) {
    throw new Error(response.message || 'Login fallito');
  }

  // Save token automatically
  if (response.data?.token) {
    const storage = getStorage();
    await storage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
    console.log('💾 Token saved');
  }

  return response;
}

/**
 * Salva i dati di autenticazione nello storage
 */
export async function saveAuthData(
  token: string,
  user: User,
  _rememberMe: boolean = false,
  expiresIn?: number
): Promise<void> {
  const storage = getStorage();

  // Salva token JWT
  await storage.setItem(STORAGE_KEYS.TOKEN, token);
  await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token); // backward compatibility

  // Salva user info separatamente
  await storage.setItem(STORAGE_KEYS.USER_ROLE, user.ruolo || '');
  await storage.setItem(STORAGE_KEYS.USER_EMAIL, user.email || '');
  await storage.setItem(STORAGE_KEYS.USER_NAME, user.nomeCognome || '');
  await storage.setItem(STORAGE_KEYS.USER_USERNAME, user.username || user.email || '');

  if (expiresIn) {
    const expiresAt = Date.now() + expiresIn * 1000;
    await storage.setItem(STORAGE_KEYS.AUTH_EXPIRES_AT, expiresAt.toString());
  }

  console.log('💾 Auth data saved:', {
    role: user.ruolo,
    email: user.email,
    name: user.nomeCognome,
    username: user.username,
    expiresIn: expiresIn ? `${expiresIn}s` : 'no expiry',
  });
}

/**
 * Recupera i dati utente salvati
 */
export async function getStoredUser(): Promise<User | null> {
  try {
    const storage = getStorage();

    const [role, email, name, username] = await Promise.all([
      storage.getItem(STORAGE_KEYS.USER_ROLE),
      storage.getItem(STORAGE_KEYS.USER_EMAIL),
      storage.getItem(STORAGE_KEYS.USER_NAME),
      storage.getItem(STORAGE_KEYS.USER_USERNAME),
    ]);

    if (!role || !email) {
      console.log('🔍 getStoredUser: No user data found');
      return null;
    }

    console.log('🔍 getStoredUser:', { role, email, name, username });

    return {
      ruolo: role,
      email: email,
      nomeCognome: name || '',
      username: username || email,
    };
  } catch (error) {
    console.error('Error getting stored user:', error);
    return null;
  }
}

/**
 * Recupera il token salvato
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    const storage = getStorage();
    return await storage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

/**
 * Verifica se il token è scaduto
 */
export async function isTokenExpired(): Promise<boolean> {
  try {
    const storage = getStorage();
    const expiresAt = await storage.getItem(STORAGE_KEYS.AUTH_EXPIRES_AT);

    if (!expiresAt) {
      return false; // No expiry set
    }

    const expiresAtMs = parseInt(expiresAt, 10);
    return Date.now() > expiresAtMs;
  } catch {
    return true;
  }
}

/**
 * Verifica se l'utente è autenticato
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getStoredToken();

  if (!token) {
    return false;
  }

  const expired = await isTokenExpired();
  return !expired;
}

/**
 * Rimuove i dati di autenticazione (logout)
 */
export async function clearAuthData(): Promise<void> {
  const storage = getStorage();

  await Promise.all([
    storage.removeItem(STORAGE_KEYS.TOKEN),
    storage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
    storage.removeItem(STORAGE_KEYS.AUTH_EXPIRES_AT),
    storage.removeItem(STORAGE_KEYS.USER_ROLE),
    storage.removeItem(STORAGE_KEYS.USER_EMAIL),
    storage.removeItem(STORAGE_KEYS.USER_NAME),
    storage.removeItem(STORAGE_KEYS.USER_USERNAME),
  ]);

  console.log('🗑️ Auth data cleared');
}

/**
 * Effettua il logout
 */
export async function logoutApi(): Promise<void> {
  // Per ora solo clear locale, in futuro potrebbe chiamare /auth/logout
  await clearAuthData();
}

/**
 * Refresh token (se supportato dal backend)
 */
export async function refreshTokenApi(oldToken: string): Promise<string> {
  console.log('🔄 Token refresh attempt...');

  const response = await publicFetch<{ code: number; data?: { token: string }; token?: string }>(
    API_ENDPOINTS.AUTH_REFRESH,
    {
      method: 'POST',
      body: JSON.stringify({ token: oldToken }),
    }
  );

  const newToken = response.data?.token || (response as any).token;

  if (!newToken) {
    throw new Error('Token di refresh non valido');
  }

  // Save new token
  const storage = getStorage();
  await storage.setItem(STORAGE_KEYS.TOKEN, newToken);

  console.log('✅ Token refreshed');
  return newToken;
}
