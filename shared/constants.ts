/**
 * Costanti condivise tra web e mobile
 * Allineato con OpenAPI spec SempliSwitch API v1.0.0
 */

/**
 * Configurazione API
 * Questi valori saranno sovrascritti dall'ambiente specifico (web/mobile)
 */
export const API_CONFIG = {
  // Base URL per le API (relativo, gestito dal proxy su web)
  BASE_URL: '/api',

  // Timeout richieste in ms
  TIMEOUT: 30000,

  // Versione API (se necessaria)
  VERSION: 'v1',
} as const;

/**
 * Endpoints API - Allineato con OpenAPI spec
 */
export const API_ENDPOINTS = {
  // ============ AUTH ============
  AUTH_LOGIN: '/auth/login',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_RESET_ACCOUNT: '/auth/reset-account',

  // ============ USER INFO ============
  USER_INFO: '/protected/user-info',
  CHANGE_PASSWORD: '/protected/change-password',

  // ============ UTENTI ============
  USERS: '/protected/users',
  USER_DETAIL: (id: number) => `/protected/users/${id}`,
  USER_CREATE: '/protected/create-user',
  USER_UPDATE: (id: number) => `/protected/update-user/${id}`,
  USER_DELETE: (id: number) => `/protected/delete-user/${id}`,
  USER_TOGGLE_STATUS: (id: number) => `/protected/users/${id}/toggle-status`,

  // ============ OFFERTE ============
  OFFERTE: '/protected/offerte',
  OFFERTA_DETAIL: (id: number) => `/protected/offerte/${id}`,
  OFFERTA_CREATE: '/protected/create-offerta',
  OFFERTA_UPDATE: (id: number) => `/protected/update-offerta/${id}`,
  OFFERTA_DELETE: (id: number) => `/protected/delete-offerta/${id}`,

  // ============ CONTRATTI ============
  CONTRATTI: '/protected/contratti',
  CONTRATTO_DETAIL: (id: number) => `/protected/contratto/${id}`,
  CONTRATTO_CREATE: '/protected/create-contratto',
  CONTRATTO_UPDATE: (id: number) => `/protected/update-contratto/${id}`,
  CONTRATTO_DELETE: (id: number) => `/protected/delete-contratto/${id}`,
  CHECK_CELLULARE: '/protected/check-cellulare',

  // ============ GESTORI ============
  GESTORI: '/protected/gestori',
  GESTORE_DETAIL: (id: number) => `/protected/gestore/${id}`,
  GESTORE_CREATE: '/protected/create-gestore',
  GESTORE_UPDATE: (id: number) => `/protected/update-gestore/${id}`,
  GESTORE_DELETE: (id: number) => `/protected/delete-gestore/${id}`,
  LOGO_GESTORE: (id: number) => `/protected/logo-gestore/${id}`,
  GESTORI_AGENZIA: (agenziaId: number) => `/protected/gestori-agenzia/${agenziaId}`,
  ASSOCIA_GESTORI: '/protected/associa-gestore',
  DISATTIVA_GESTORI: '/protected/disattiva-gestore',
  GESTORE_DETTAGLIO_UPDATE: (gestoreId: number, agenziaId: number) =>
    `/protected/update-gestore-dettaglio/${gestoreId}/agenzia/${agenziaId}`,

  // ============ GESTORI UTENTE ============
  GESTORI_UTENTE: (userId: number) => `/protected/gestori-utente/${userId}`,
  ASSEGNA_GESTORI_UTENTE: '/protected/assegna-gestori',
  RIMUOVI_GESTORI_UTENTE: (userId: number) => `/protected/rimuovi-gestori-utente/${userId}`,
  RIMUOVI_GESTORE_UTENTE: (gestoreId: number, userId: number) =>
    `/protected/rimuovi-gestore/${gestoreId}/utente/${userId}`,

  // ============ AGENZIE ============
  AGENZIE: '/protected/agenzie',
  AGENZIA_DETAIL: (id: number) => `/protected/agenzie/${id}`,
  AGENZIA_CREATE: '/protected/create-agenzia',
  AGENZIA_UPDATE: (id: number) => `/protected/update-agenzia/${id}`,
  AGENZIA_DELETE: (id: number) => `/protected/delete-agenzia/${id}`,
  AGENZIA_TOGGLE_STATUS: (id: number) => `/protected/agenzie/${id}/toggle-status`,

  // ============ AGENTI ============
  AGENTI: '/protected/agenti',
  AGENTE_DETAIL: (idUser: number) => `/protected/agenti/${idUser}`,
  AGENTE_CREATE: '/protected/create-agente',
  AGENTE_UPDATE: (idUser: number) => `/protected/update-agente/${idUser}`,
  AGENTE_DELETE: (idUser: number) => `/protected/delete-agente/${idUser}`,
  AGENTI_BATCH_UPDATE_MASTER: '/protected/agenti/batch-update-master',

  // ============ PIANI COMPENSO ============
  PIANI_COMPENSO: '/protected/piani-compenso',
  PIANO_COMPENSO_DETAIL: (id: number) => `/protected/piano-compenso/${id}`,
  PIANO_COMPENSO_CREATE: '/protected/create-piano-compenso',
  PIANO_COMPENSO_UPDATE: (id: number) => `/protected/update-piano-compenso/${id}`,
  PIANO_COMPENSO_DELETE: (id: number) => `/protected/delete-piano-compenso/${id}`,
  PIANO_COMPENSO_DETTAGLIO_DELETE: (idPianoCompenso: number) =>
    `/protected/delete-piano-compenso/${idPianoCompenso}/dettaglio`,
  PIANO_COMPENSO_MIO: '/protected/my-piano-compenso',
  PIANO_COMPENSO_VERIFICA: '/protected/verifica-piano-compenso',

  // ============ PROFILI ============
  PROFILI: '/protected/profili',
  PROFILO_DETAIL: (id: number) => `/protected/profili/${id}`,
  PROFILO_CREATE: '/protected/create-profilo',
  PROFILO_UPDATE: (id: number) => `/protected/update-profile/${id}`,
  PROFILO_DELETE: (id: number) => `/protected/delete-profilo/${id}`,

  // ============ ALLEGATI ============
  ALLEGATI: '/protected/allegati',
  ALLEGATI_PERSONALI: '/protected/allegati-personali',
  ALLEGATO_DETAIL: (id: number) => `/protected/allegato/${id}`,
  ALLEGATO_UPLOAD: '/protected/upload-allegato',
  ALLEGATO_DOWNLOAD: (id: number) => `/protected/download-allegato/${id}`,
  ALLEGATO_DELETE: (id: number) => `/protected/elimina-allegato/${id}`,

  // ============ PUBLIC ============
  HEALTH: '/public/health',
} as const;

/**
 * Codici di risposta API
 */
export const API_CODES = {
  SUCCESS: 0,
  TWO_FACTOR_REQUIRED: 1,
  ERROR: -1,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  LOCKED: 423,
  SERVER_ERROR: 500,
} as const;

/**
 * Messaggi di errore comuni
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Errore di rete. Verifica la connessione.',
  UNAUTHORIZED: 'Sessione scaduta. Effettua nuovamente il login.',
  FORBIDDEN: 'Non hai i permessi per questa operazione.',
  NOT_FOUND: 'Risorsa non trovata.',
  CONFLICT: 'Dati in conflitto. Verifica i dati inseriti.',
  LOCKED: 'Account temporaneamente bloccato per troppi tentativi.',
  SERVER_ERROR: 'Errore del server. Riprova più tardi.',
  GENERIC: 'Si è verificato un errore. Riprova.',
} as const;

/**
 * Stati contratto
 */
export const STATI_CONTRATTO = {
  INSERITO: 'inserito',
  IN_VERIFICA: 'in_verifica',
  LAVORAZIONE: 'lavorazione',
  OK_INSERIMENTO: 'ok_inserimento',
  ATTIVATO: 'attivato',
  SOSPESO: 'sospeso',
  ANNULLATO: 'annullato',
  STORNATO: 'stornato',
} as const;

export type StatoContratto = (typeof STATI_CONTRATTO)[keyof typeof STATI_CONTRATTO];

/**
 * Stati pagamento
 */
export const STATI_PAGAMENTO = {
  NON_PAGATO: 'non_pagato',
  PRONTO_FATTURA: 'pronto_fattura',
  INVIATO_FATTURARE: 'inviato_fatturare',
  PAGATO: 'pagato',
  STORNATO: 'stornato',
} as const;

export type StatoPagamento = (typeof STATI_PAGAMENTO)[keyof typeof STATI_PAGAMENTO];

/**
 * Tipi cliente
 */
export const TIPI_CLIENTE = {
  PRIVATO: 'privato',
  BUSINESS: 'business',
  CONDOMINIO: 'condominio',
} as const;

export type TipoCliente = (typeof TIPI_CLIENTE)[keyof typeof TIPI_CLIENTE];

/**
 * Commodity
 */
export const COMMODITY = {
  LUCE: 'luce',
  GAS: 'gas',
  NA: 'n-a',
} as const;

export type Commodity = (typeof COMMODITY)[keyof typeof COMMODITY];

/**
 * Canali acquisizione
 */
export const CANALI = {
  D2D: 'd2d',
  TELESALES: 'telesales',
  ONLINE: 'online',
} as const;

export type Canale = (typeof CANALI)[keyof typeof CANALI];

/**
 * Categorie offerta
 */
export const CATEGORIE_OFFERTA = {
  ENERGIA: 'energia',
  TELCO: 'telco',
  FOTOVOLTAICO: 'fotovoltaico',
  ALTRO: 'altro',
} as const;

export type CategoriaOfferta = (typeof CATEGORIE_OFFERTA)[keyof typeof CATEGORIE_OFFERTA];

/**
 * Stati offerta
 */
export const STATI_OFFERTA = {
  BOZZA: 'bozza',
  ATTIVA: 'attiva',
  DISATTIVA: 'disattiva',
  SCADUTA: 'scaduta',
} as const;

export type StatoOfferta = (typeof STATI_OFFERTA)[keyof typeof STATI_OFFERTA];

/**
 * Tecnologie telco
 */
export const TECNOLOGIE_TELCO = {
  FTTH: 'FTTH',
  FTTC: 'FTTC',
  FWA: 'FWA',
} as const;

export type TecnologiaTelco = (typeof TECNOLOGIE_TELCO)[keyof typeof TECNOLOGIE_TELCO];

/**
 * Periodi fatturazione
 */
export const PERIODI_FATTURAZIONE = {
  MENSILE: 'mensile',
  BIMESTRALE: 'bimestrale',
  NA: 'n/a',
} as const;

export type PeriodoFatturazione = (typeof PERIODI_FATTURAZIONE)[keyof typeof PERIODI_FATTURAZIONE];
