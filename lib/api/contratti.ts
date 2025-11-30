/**
 * API Client per Contratti
 * Adattato da sempliswitch/client/api/contratti.ts
 */

import { authed } from './client';

// ============================================
// TYPES
// ============================================

export type StatoContratto =
  | "inserito"
  | "in_verifica"
  | "lavorazione"
  | "ok_inserimento"
  | "attivato"
  | "sospeso"
  | "annullato"
  | "stornato";

export type StatoPagamento =
  | "non_pagato"
  | "pronto_fattura"
  | "inviato_fatturare"
  | "pagato"
  | "stornato";

export type Commodity = "luce" | "gas" | "dual" | "telco" | "fotovoltaico" | "altro";
export type TipoCliente = "privato" | "business" | "condominio";
export type Canale = "d2d" | "telesales" | "online";

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ListContrattiParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  searchTerm?: string;
  stato?: string;
  statoPagamento?: string;
  tipoCliente?: string;
  commodity?: string;
  canale?: string;
  idAgente?: number;
  idOfferta?: number;
}

export interface UserSimpleDto {
  id: number;
  nomeCognome: string;
  email: string;
  ruolo: string;
}

export interface OffertaBaseDto {
  id: number;
  nome: string;
  idGestore?: number;
  nomeGestore?: string;
  categoria?: string;
  customer?: string;
  stato?: string;
}

export interface ContrattoDto {
  id: number;
  codice?: string;
  codiceEsterno?: string;
  note?: string;
  offerta?: OffertaBaseDto;
  stato: StatoContratto;
  statoPagamento: StatoPagamento;
  tsCreazione?: string;
  tsInserimento?: string;
  tsFirmato?: string;
  tsAttivazione?: string;
  tipoCliente: TipoCliente;
  nome?: string;
  cognome?: string;
  ragioneSociale?: string;
  codiceFiscale?: string;
  partitaIva?: string;
  email?: string;
  telefono?: string;
  indirizzoFatturazione?: string;
  commodity?: string;
  pod?: string;
  pdr?: string;
  telcoNumber?: string;
  indirizzoFornitura?: string;
  agente?: UserSimpleDto;
  master?: UserSimpleDto;
  canale?: Canale;
  importoLordo?: number;
  importoNetto?: number;
}

export interface CreateContrattoPayload {
  idOfferta: number;
  tipoCliente: TipoCliente;
  nome?: string;
  cognome?: string;
  ragioneSociale?: string;
  codiceFiscale?: string;
  partitaIva?: string;
  email?: string;
  telefono?: string;
  commodity?: string;
  pod?: string;
  pdr?: string;
  telcoNumber?: string;
  indirizzoFornitura?: string;
  indirizzoFatturazione?: string;
  canale?: Canale;
  note?: string;
  stato?: StatoContratto;
  statoPagamento?: StatoPagamento;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildQueryString(params: Partial<ListContrattiParams>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// ============================================
// API METHODS
// ============================================

export const ContrattiAPI = {
  /**
   * GET /api/protected/contratti
   * Lista contratti con filtri e paginazione
   */
  list: async (params: Partial<ListContrattiParams> = {}): Promise<PagedResponse<ContrattoDto>> => {
    const queryString = buildQueryString(params);
    const endpoint = `/api/protected/contratti${queryString}`;

    console.log("📋 ContrattiAPI.list:", endpoint);

    try {
      const response: any = await authed.get(endpoint);

      let pagedData: PagedResponse<ContrattoDto>;

      if (response?.content !== undefined) {
        pagedData = response as PagedResponse<ContrattoDto>;
      } else if (Array.isArray(response)) {
        pagedData = {
          content: response,
          page: 0,
          size: response.length,
          totalElements: response.length,
          totalPages: 1,
          first: true,
          last: true,
          empty: response.length === 0,
        };
      } else {
        pagedData = {
          content: [],
          page: 0,
          size: 0,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
          empty: true,
        };
      }

      console.log(`✅ Contratti: ${pagedData.totalElements} totali`);
      return pagedData;
    } catch (error: any) {
      console.error("❌ ContrattiAPI.list Error:", error);
      throw error;
    }
  },

  /**
   * GET /api/protected/contratto/{id}
   * Dettaglio singolo contratto
   */
  get: async (id: number): Promise<ContrattoDto | null> => {
    console.log("🔍 ContrattiAPI.get:", { id });

    try {
      const response: any = await authed.get(`/api/protected/contratto/${id}`);
      return response as ContrattoDto;
    } catch (error: any) {
      if (error?.message?.includes("404")) {
        return null;
      }
      throw error;
    }
  },

  /**
   * POST /api/protected/create-contratto
   * Crea nuovo contratto
   */
  create: async (payload: CreateContrattoPayload): Promise<ContrattoDto> => {
    console.log("➕ ContrattiAPI.create:", payload);

    const response: any = await authed.post("/api/protected/create-contratto", payload);
    return response as ContrattoDto;
  },

  /**
   * PUT /api/protected/update-contratto/{id}
   * Aggiorna contratto
   */
  update: async (id: number, payload: Partial<CreateContrattoPayload>): Promise<ContrattoDto> => {
    console.log("✏️ ContrattiAPI.update:", { id });

    const response: any = await authed.put(`/api/protected/update-contratto/${id}`, payload);
    return response as ContrattoDto;
  },

  /**
   * DELETE /api/protected/delete-contratto/{id}
   */
  delete: async (id: number): Promise<void> => {
    console.log("🗑️ ContrattiAPI.delete:", { id });
    await authed.delete(`/api/protected/delete-contratto/${id}`);
  },

  /**
   * Annulla contratto (soft delete)
   */
  annulla: async (id: number): Promise<ContrattoDto> => {
    return await ContrattiAPI.update(id, { stato: "annullato" });
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getStatoColor(stato: StatoContratto): string {
  const colors: Record<StatoContratto, string> = {
    inserito: '#6B7280',       // gray
    in_verifica: '#9CA3AF',    // gray-400
    lavorazione: '#EC4899',    // pink
    ok_inserimento: '#10B981', // green
    attivato: '#059669',       // green-600
    sospeso: '#EF4444',        // red
    annullato: '#DC2626',      // red-600
    stornato: '#8B5CF6',       // purple
  };
  return colors[stato] || '#6B7280';
}

export function getStatoLabel(stato: StatoContratto): string {
  const labels: Record<StatoContratto, string> = {
    inserito: 'Inserito',
    in_verifica: 'In Verifica',
    lavorazione: 'In Lavorazione',
    ok_inserimento: 'OK Inserimento',
    attivato: 'Attivato',
    sospeso: 'Sospeso',
    annullato: 'Annullato',
    stornato: 'Stornato',
  };
  return labels[stato] || stato;
}

export function getStatoPagamentoColor(stato: StatoPagamento): string {
  const colors: Record<StatoPagamento, string> = {
    non_pagato: '#6B7280',
    pronto_fattura: '#F59E0B',
    inviato_fatturare: '#3B82F6',
    pagato: '#10B981',
    stornato: '#EF4444',
  };
  return colors[stato] || '#6B7280';
}

export function getStatoPagamentoLabel(stato: StatoPagamento): string {
  const labels: Record<StatoPagamento, string> = {
    non_pagato: 'Non Pagato',
    pronto_fattura: 'Pronto Fattura',
    inviato_fatturare: 'Inviato a Fatturare',
    pagato: 'Pagato',
    stornato: 'Stornato',
  };
  return labels[stato] || stato;
}

export function formatImporto(importo: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(importo);
}
