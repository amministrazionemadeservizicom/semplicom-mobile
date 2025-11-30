/**
 * Interfaccia astratta per Storage
 * Permette di usare localStorage (web) o AsyncStorage (mobile)
 * senza dipendenze dirette nel codice condiviso
 */

/**
 * Interfaccia storage asincrona
 * Compatibile con AsyncStorage di React Native
 */
export interface IStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear?(): Promise<void>;
}

/**
 * Chiavi storage usate dall'app
 */
export const STORAGE_KEYS = {
  TOKEN: 'SS_TOKEN',
  AUTH_TOKEN: 'authToken', // backward compatibility
  USER_ROLE: 'userRole',
  USER_EMAIL: 'userEmail',
  USER_NAME: 'userName',
  USER_USERNAME: 'userUsername',
  AUTH_EXPIRES_AT: 'authExpiresAt',
} as const;

/**
 * Storage placeholder - sarà iniettato dall'app
 * Su web: usa localStorage wrapper
 * Su mobile: usa AsyncStorage
 */
let _storage: IStorage | null = null;

/**
 * Inizializza lo storage
 */
export function initStorage(storage: IStorage): void {
  _storage = storage;
}

/**
 * Ottiene l'istanza storage corrente
 */
export function getStorage(): IStorage {
  if (!_storage) {
    throw new Error('Storage not initialized. Call initStorage() first.');
  }
  return _storage;
}

/**
 * Verifica se lo storage è inizializzato
 */
export function isStorageInitialized(): boolean {
  return _storage !== null;
}
