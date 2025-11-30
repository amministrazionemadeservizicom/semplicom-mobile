/**
 * Shared module - Logica condivisa tra web e mobile
 *
 * Questo modulo contiene:
 * - Types: Interfacce TypeScript per API e modelli dati
 * - API: Client HTTP e moduli API (auth, offerte, contratti, gestori)
 * - Lib: Utilities pure (storage abstraction)
 * - Constants: Configurazioni e costanti
 *
 * Uso:
 * 1. Importa e inizializza lo storage con l'implementazione specifica:
 *    - Web: localStorage wrapper
 *    - Mobile: AsyncStorage
 *
 * 2. Inizializza il client API con la configurazione:
 *    - baseUrl: URL del backend
 *    - onUnauthorized: callback per gestire 401
 *
 * Esempio:
 * ```typescript
 * import { initStorage, initClient, loginApi } from '@shared';
 *
 * // Inizializza storage (mobile)
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * initStorage(AsyncStorage);
 *
 * // Inizializza client
 * initClient({
 *   baseUrl: 'https://api.example.com',
 *   onUnauthorized: () => navigation.navigate('Login'),
 * });
 *
 * // Usa le API
 * const response = await loginApi({ username, password });
 * ```
 */

// Types
export * from './types';

// API
export * from './api';

// Lib/Utils
export * from './lib';

// Constants
export * from './constants';
