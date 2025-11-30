/**
 * API Client per Offerte
 * Condiviso tra web e mobile
 */

import { authed } from './client';
import { API_ENDPOINTS } from '../constants';
import type {
  OffertaBase,
  OffertaCompleta,
  OffertaQueryParams,
  AllegatoDto,
} from '../types/offerte';
import type { PagedResponse } from '../types/common';

// Re-export types
export type { OffertaBase, OffertaCompleta, OffertaQueryParams, AllegatoDto };

/**
 * Costruisce query string dai parametri
 */
function buildQueryString(params: OffertaQueryParams): string {
  const query = new URLSearchParams();

  if (params.categoria) query.append('categoria', params.categoria);
  if (params.stato) query.append('stato', params.stato);
  if (params.customer) query.append('customer', params.customer);
  if (params.idGestore) query.append('idGestore', String(params.idGestore));
  if (params.nomeGestore) query.append('nomeGestore', params.nomeGestore);
  if (params.agenziaId !== undefined) query.append('agenziaId', String(params.agenziaId));
  if (params.userId !== undefined) query.append('userId', String(params.userId));
  if (params.page !== undefined) query.append('page', String(params.page));
  if (params.size !== undefined) query.append('size', String(params.size || 20));
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortDir) query.append('sortDir', params.sortDir);

  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const offerteApi = {
  /**
   * GET /api/protected/offerte
   * Lista offerte con filtri e paginazione
   */
  async listOfferte(params: OffertaQueryParams = {}): Promise<PagedResponse<OffertaBase>> {
    const qs = buildQueryString(params);
    const url = `${API_ENDPOINTS.OFFERTE}${qs}`;

    console.log('📋 offerteApi.listOfferte:', url);

    const response: any = await authed.get(url);

    // Backend può ritornare:
    // 1. { code: 0, data: [...] } - array diretto
    // 2. { code: 0, data: { content: [...], totalElements: N } } - formato paginato
    let offerte: OffertaBase[] = [];
    let totalElements = 0;
    let totalPages = 1;

    if (response?.data) {
      if (Array.isArray(response.data)) {
        // Formato 1: array diretto
        offerte = response.data;
        totalElements = offerte.length;
        totalPages = 1;
      } else if (response.data.content && Array.isArray(response.data.content)) {
        // Formato 2: oggetto paginato
        offerte = response.data.content;
        totalElements = response.data.totalElements || offerte.length;
        totalPages = response.data.totalPages || 1;
      }
    }

    console.log(`📦 Offerte estratte: ${offerte.length} offerte`);

    return {
      content: offerte,
      totalElements,
      totalPages,
      size: params.size || 20,
      page: params.page || 0,
    };
  },

  /**
   * GET /api/protected/offerte/{id}
   * Dettaglio completo offerta
   */
  async getOfferta(id: number): Promise<OffertaCompleta> {
    const response: any = await authed.get(API_ENDPOINTS.OFFERTA_DETAIL(id));
    return response?.data || response;
  },

  /**
   * POST /api/protected/create-offerta
   * Crea nuova offerta
   */
  async createOfferta(payload: Partial<OffertaCompleta>): Promise<OffertaCompleta> {
    console.log('➕ offerteApi.createOfferta:', payload);

    const response: any = await authed.post(API_ENDPOINTS.OFFERTA_CREATE, payload);
    console.log('✅ Risposta create-offerta:', response);
    return response?.data || response;
  },

  /**
   * PUT /api/protected/update-offerta/{id}
   * Aggiorna offerta (partial update)
   */
  async updateOfferta(id: number, payload: Partial<OffertaCompleta>): Promise<OffertaCompleta> {
    // Rimuovi campi non modificabili
    const { id: _, categoria: __, ...updatePayload } = payload as any;
    const response: any = await authed.put(API_ENDPOINTS.OFFERTA_UPDATE(id), updatePayload);
    return response?.data || response;
  },

  /**
   * DELETE /api/protected/delete-offerta/{id}
   * Elimina offerta
   */
  async deleteOfferta(id: number): Promise<void> {
    console.log('🗑️ offerteApi.deleteOfferta:', id);
    await authed.delete(API_ENDPOINTS.OFFERTA_DELETE(id));
  },

  // ===== ALLEGATI =====

  /**
   * GET /api/protected/allegati?riferimento=offerta&idEsterno={id}
   * Lista allegati di un'offerta
   */
  async getAllegati(idOfferta: number): Promise<AllegatoDto[]> {
    const url = `${API_ENDPOINTS.ALLEGATI}?riferimento=offerta&idEsterno=${idOfferta}`;
    console.log('📎 offerteApi.getAllegati:', url);

    const response: any = await authed.get(url);
    const allegati = response?.data || response || [];
    return Array.isArray(allegati) ? allegati : [];
  },

  /**
   * POST /api/protected/upload-allegato
   * Upload allegato (PDF, immagine, ecc.)
   */
  async uploadAllegato(data: {
    nome: string;
    estensione: string;
    riferimento: string;
    idEsterno: number;
    base64: string;
  }): Promise<AllegatoDto> {
    console.log('📤 offerteApi.uploadAllegato:', {
      nome: data.nome,
      estensione: data.estensione,
    });

    const response = await authed.post(API_ENDPOINTS.ALLEGATO_UPLOAD, data);
    return response as AllegatoDto;
  },

  /**
   * GET /api/protected/download-allegato/{id}
   * Download allegato (ritorna base64)
   */
  async downloadAllegato(
    id: number
  ): Promise<{ base64: string; nome: string; estensione: string }> {
    console.log('📥 offerteApi.downloadAllegato:', id);

    const response = await authed.get(API_ENDPOINTS.ALLEGATO_DOWNLOAD(id));
    return response as { base64: string; nome: string; estensione: string };
  },

  /**
   * DELETE /api/protected/elimina-allegato/{id}
   * Elimina allegato
   */
  async deleteAllegato(id: number): Promise<void> {
    console.log('🗑️ offerteApi.deleteAllegato:', id);
    await authed.delete(API_ENDPOINTS.ALLEGATO_DELETE(id));
  },

  // ===== LOGO GESTORE =====

  /**
   * URL logo gestore
   */
  getLogoGestoreUrl(idGestore: number): string {
    return API_ENDPOINTS.LOGO_GESTORE(idGestore);
  },
};

// Alias per backward compatibility
export const OfferteAPI = offerteApi;
