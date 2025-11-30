/**
 * API Module Index
 * Esporta tutti i moduli API
 */

// Client
export { api, get, post, put, patch, del, authed, authedFetch } from './client';
export type { ApiOptions, ApiResponse } from './client';

// Contratti
export { ContrattiAPI, getStatoColor, getStatoLabel, getStatoPagamentoColor, getStatoPagamentoLabel, formatImporto } from './contratti';
export type {
  StatoContratto,
  StatoPagamento,
  Commodity,
  TipoCliente,
  Canale,
  PagedResponse,
  ListContrattiParams,
  UserSimpleDto,
  OffertaBaseDto,
  ContrattoDto,
  CreateContrattoPayload,
} from './contratti';

// Offerte
export { OfferteAPI, getCategoriaColor, getCategoriaLabel, getStatoOffertaColor, getStatoOffertaLabel } from './offerte';
export type {
  Categoria,
  Customer,
  StatoOfferta,
  OffertaBase,
  OffertaEnergiaDto,
  OffertaTelcoDto,
  OffertaFotovoltaicoDto,
  AllegatoDto,
  OffertaCompleta,
  OffertaQueryParams,
  PaginatedResponse,
} from './offerte';

// Dashboard
export { DashboardAPI } from './dashboard';
export type {
  DashboardStats,
  AgenteDashboardStats,
  AdminDashboardStats,
  BackofficeDashboardStats,
} from './dashboard';
