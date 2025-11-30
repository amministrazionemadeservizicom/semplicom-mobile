/**
 * Configurazione app mobile
 */

import { Platform } from 'react-native';

// Determina se siamo su web
const isWeb = Platform.OS === 'web';

// URL del backend API
// Su web in dev: usa proxy locale per evitare CORS (esegui: node proxy-server.js)
// Su mobile: usa URL completo del backend (niente CORS su native)
export const API_BASE_URL = __DEV__
  ? isWeb
    ? 'http://localhost:3001' // Web dev: proxy locale (node proxy-server.js)
    : 'http://dev.ceposto.it:16732' // Mobile dev: URL diretto
  : 'https://api.semplicom.it'; // Produzione (placeholder)

// Timeout richieste API (ms)
export const API_TIMEOUT = 30000;

// Abilita logging verbose in dev
export const VERBOSE_LOGGING = __DEV__;
