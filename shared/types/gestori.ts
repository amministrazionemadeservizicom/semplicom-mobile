/**
 * Types per Gestori (Fornitori)
 * Condivisi tra web e mobile
 */

export type CategoriaGestore = 'energia' | 'telefonia';
export type StatoGestore = 'ATTIVO' | 'SOSPESO' | 'DISABILITATO';

/**
 * Base Gestore entity
 */
export interface Gestore {
  id: number;
  nome: string;
  categoria: CategoriaGestore;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Gestore with agency association details
 */
export interface GestoreDettaglio extends Gestore {
  dal?: string;
  al?: string;
  stato?: StatoGestore;
  agenziaId?: number;
  agenziaName?: string;
}

/**
 * Gestore with user assignment details
 */
export interface GestoreUtente extends Gestore {
  userId?: number;
  assignedAt?: string;
}

// ============ API Request Payloads ============

export interface CreateGestorePayload {
  nome: string;
  categoria: CategoriaGestore;
  logo?: string;
}

export interface UpdateGestorePayload {
  nome?: string;
  logo?: string;
  rimuoviLogo?: boolean;
}

export interface AssociaGestoriAgenziaPayload {
  gestoriIds: number[];
  agenziaId: number;
  dal: string;
  al?: string;
}

export interface DisattivaGestoriAgenziaPayload {
  gestoriIds: number[];
  agenziaId: number;
}

// ============ API Response Types ============

export interface GestoriListResponse {
  content: Gestore[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface GestoreDettaglioListResponse {
  content: GestoreDettaglio[];
  totalElements: number;
}

export interface GestoreUtenteListResponse {
  content: GestoreUtente[];
  totalElements: number;
}
