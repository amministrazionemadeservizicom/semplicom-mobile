/**
 * API Client per Offerte
 * Adattato da sempliswitch/client/api/offerte.ts
 */

import { authed } from './client';
import { API_BASE_URL } from '../config';

// ============================================
// TYPES
// ============================================

export type Categoria = "energia" | "telco" | "fotovoltaico" | "altro";
export type Customer = "privato" | "business" | "condominio";
export type StatoOfferta = "attiva" | "bozza" | "disattiva" | "scaduta";

export interface OffertaBase {
  id?: number;
  nome: string;
  categoria: Categoria;
  customer?: Customer;
  stato?: StatoOfferta;
  idGestore?: number;
  nomeGestore?: string;
  prodotto?: string;
  codiceProdotto?: string;
  dal?: string;
  al?: string;
  note?: string;
  bonus?: string;
}

export interface OffertaEnergiaDto {
  commodity?: "luce" | "gas";
  acquisition?: string;
  prezzoTipo?: boolean;
  prezzo?: number;
  spread?: number;
  indice?: string;
  periodoFatturazione?: "mensile" | "bimestrale";
}

export interface OffertaTelcoDto {
  tecnologia?: string;
  tecnologie?: string[];
  prezzo?: number;
  attivazione?: number;
  nuovaLinea?: boolean;
  portabilita?: boolean;
  contenutiTv?: boolean;
  lineaMobile?: boolean;
  telefonici?: boolean;
  periodoFatturazione?: "mensile" | "bimestrale";
}

export interface OffertaFotovoltaicoDto {
  plantKw: number;
  batteria?: boolean;
  batteryKwh?: number;
  trifase?: boolean;
  prezzo?: number;
  noteExtra?: string;
}

export interface AllegatoDto {
  id: number;
  nome: string;
  estensione?: string;
  tipo?: string;
  riferimento: string;
  idEsterno: number;
  downloadUrl?: string;
  dataCreazione?: string;
}

export interface OffertaCompleta {
  id?: number;
  base?: OffertaBase;
  energia?: OffertaEnergiaDto | null;
  telco?: OffertaTelcoDto | null;
  fotovoltaico?: OffertaFotovoltaicoDto | null;
  allegati?: AllegatoDto[];
  nomeOfferta?: string;
  gestore?: {
    id?: number;
    nome?: string;
    logoUrl?: string;
  };
  tipoOfferta?: "fisso" | "indicizzato";
  categoria?: string;
  note?: string;
  tipoCliente?: string;
  prodotto?: string;
  idPianoCompenso?: number;
  nomePianoCompenso?: string;
}

export interface OffertaQueryParams {
  categoria?: string;
  stato?: string;
  customer?: string;
  idGestore?: number;
  nomeGestore?: string;
  agenziaId?: number;
  userId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ============================================
// API METHODS
// ============================================

export const OfferteAPI = {
  /**
   * GET /api/protected/offerte
   * Lista offerte con filtri e paginazione
   */
  list: async (params: OffertaQueryParams = {}): Promise<PaginatedResponse<OffertaBase>> => {
    const query = new URLSearchParams();

    if (params.categoria) query.append("categoria", params.categoria);
    if (params.stato) query.append("stato", params.stato);
    if (params.customer) query.append("customer", params.customer);
    if (params.idGestore) query.append("idGestore", String(params.idGestore));
    if (params.nomeGestore) query.append("nomeGestore", params.nomeGestore);
    if (params.agenziaId !== undefined) query.append("agenziaId", String(params.agenziaId));
    if (params.userId !== undefined) query.append("userId", String(params.userId));
    if (params.page !== undefined) query.append("page", String(params.page));
    if (params.size !== undefined) query.append("size", String(params.size || 20));
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortDir) query.append("sortDir", params.sortDir);

    const qs = query.toString();
    const url = `/api/protected/offerte${qs ? `?${qs}` : ""}`;

    console.log("📋 OfferteAPI.list:", url);

    const response: any = await authed.get(url);

    let offerte: any[] = [];
    let totalElements = 0;
    let totalPages = 1;

    if (response) {
      if (Array.isArray(response)) {
        offerte = response;
        totalElements = offerte.length;
        totalPages = 1;
      } else if (response.content && Array.isArray(response.content)) {
        offerte = response.content;
        totalElements = response.totalElements || offerte.length;
        totalPages = response.totalPages || 1;
      }
    }

    console.log(`📦 Offerte: ${offerte.length} offerte`);

    return {
      content: offerte,
      totalElements,
      totalPages,
      size: params.size || 20,
      number: params.page || 0,
    };
  },

  /**
   * GET /api/protected/offerte/{id}
   * Dettaglio completo offerta
   */
  get: async (id: number): Promise<OffertaCompleta> => {
    console.log("🔍 OfferteAPI.get:", { id });
    const response: any = await authed.get(`/api/protected/offerte/${id}`);
    return response as OffertaCompleta;
  },

  /**
   * POST /api/protected/create-offerta
   * Crea nuova offerta
   */
  create: async (payload: Partial<OffertaCompleta>): Promise<OffertaCompleta> => {
    console.log("➕ OfferteAPI.create:", payload);
    const response: any = await authed.post("/api/protected/create-offerta", payload);
    return response as OffertaCompleta;
  },

  /**
   * PUT /api/protected/update-offerta/{id}
   * Aggiorna offerta
   */
  update: async (id: number, payload: Partial<OffertaCompleta>): Promise<OffertaCompleta> => {
    const { id: _, ...updatePayload } = payload as any;
    const response: any = await authed.put(`/api/protected/update-offerta/${id}`, updatePayload);
    return response as OffertaCompleta;
  },

  /**
   * DELETE /api/protected/delete-offerta/{id}
   */
  delete: async (id: number): Promise<void> => {
    console.log("🗑️ OfferteAPI.delete:", id);
    await authed.delete(`/api/protected/delete-offerta/${id}`);
  },

  // ===== ALLEGATI =====

  /**
   * GET allegati di un'offerta
   */
  getAllegati: async (idOfferta: number): Promise<AllegatoDto[]> => {
    const url = `/api/protected/allegati?riferimento=offerta&idEsterno=${idOfferta}`;
    console.log("📎 OfferteAPI.getAllegati:", url);

    const response: any = await authed.get(url);
    const allegati = response || [];
    return Array.isArray(allegati) ? allegati : [];
  },

  /**
   * Upload allegato
   */
  uploadAllegato: async (data: {
    nome: string;
    estensione: string;
    riferimento: string;
    idEsterno: number;
    base64: string;
  }): Promise<AllegatoDto> => {
    console.log("📤 OfferteAPI.uploadAllegato:", { nome: data.nome });
    const response = await authed.post("/api/protected/upload-allegato", data);
    return response as AllegatoDto;
  },

  /**
   * Download allegato
   */
  downloadAllegato: async (id: number): Promise<{ base64: string; nome: string; estensione: string }> => {
    console.log("📥 OfferteAPI.downloadAllegato:", id);
    const response = await authed.get(`/api/protected/download-allegato/${id}`);
    return response as { base64: string; nome: string; estensione: string };
  },

  /**
   * Elimina allegato
   */
  deleteAllegato: async (id: number): Promise<void> => {
    console.log("🗑️ OfferteAPI.deleteAllegato:", id);
    await authed.delete(`/api/protected/elimina-allegato/${id}`);
  },

  /**
   * Ottiene URL logo gestore
   */
  getLogoGestoreUrl: (idGestore: number): string => {
    return `${API_BASE_URL}/api/protected/logo-gestore/${idGestore}`;
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getCategoriaColor(categoria: Categoria): string {
  const colors: Record<Categoria, string> = {
    energia: '#F59E0B',      // amber
    telco: '#3B82F6',        // blue
    fotovoltaico: '#10B981', // green
    altro: '#6B7280',        // gray
  };
  return colors[categoria] || '#6B7280';
}

export function getCategoriaLabel(categoria: Categoria): string {
  const labels: Record<Categoria, string> = {
    energia: 'Energia',
    telco: 'Telco',
    fotovoltaico: 'Fotovoltaico',
    altro: 'Altro',
  };
  return labels[categoria] || categoria;
}

export function getStatoOffertaColor(stato: StatoOfferta): string {
  const colors: Record<StatoOfferta, string> = {
    attiva: '#10B981',
    bozza: '#F59E0B',
    disattiva: '#6B7280',
    scaduta: '#EF4444',
  };
  return colors[stato] || '#6B7280';
}

export function getStatoOffertaLabel(stato: StatoOfferta): string {
  const labels: Record<StatoOfferta, string> = {
    attiva: 'Attiva',
    bozza: 'Bozza',
    disattiva: 'Disattiva',
    scaduta: 'Scaduta',
  };
  return labels[stato] || stato;
}
