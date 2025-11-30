/**
 * Inizializzazione app mobile
 * Configura storage e client API
 */

import { initStorage } from '../shared/lib/storage';
import { initClient } from '../shared/api/client';
import { mobileStorage } from './storage';
import { API_BASE_URL, API_TIMEOUT, VERBOSE_LOGGING } from './config';

let initialized = false;

/**
 * Inizializza l'app con storage e client API
 * Chiamare in _layout.tsx prima del render
 */
export function initializeApp(onUnauthorized?: () => void): void {
  if (initialized) {
    return;
  }

  // Inizializza storage con AsyncStorage adapter
  initStorage(mobileStorage);

  // Inizializza client API
  initClient({
    baseUrl: API_BASE_URL,
    timeout: API_TIMEOUT,
    verbose: VERBOSE_LOGGING,
    onUnauthorized,
  });

  initialized = true;
  console.log('✅ App initialized with baseUrl:', API_BASE_URL);
}

/**
 * Verifica se l'app è inizializzata
 */
export function isAppInitialized(): boolean {
  return initialized;
}
