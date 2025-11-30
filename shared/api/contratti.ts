/**
 * API Client per Contratti
 * Condiviso tra web e mobile
 */

import { authed, authedFetch } from './client';
import { API_ENDPOINTS } from '../constants';
import type {
  Contratto,
  ContrattoDto,
  ContrattiFilters,
  CreateContrattoRequest,
  StatoContratto,
} from '../types/contratti';
import type { PagedResponse } from '../types/common';

// Re-export types
export type { Contratto, ContrattoDto, ContrattiFilters, CreateContrattoRequest };

/**
 * Costruisce query string dai filtri
 */
function buildQueryString(params: Partial<ContrattiFilters>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const contrattiApi = {
  /**
   * GET /api/protected/contratti
   * Lista contratti con filtri e paginazione
   */
  async listContratti(
    params: Partial<ContrattiFilters> = {}
  ): Promise<PagedResponse<ContrattoDto>> {
    const queryString = buildQueryString(params);
    const endpoint = `${API_ENDPOINTS.CONTRATTI}${queryString}`;

    console.log('📋 contrattiApi.listContratti:', endpoint);

    const response = await authedFetch(endpoint, { method: 'GET' });

    // Parsing risposta wrappata: { code: 0, data: PagedResponse }
    let pagedData: PagedResponse<ContrattoDto>;

    if ((response as any).code === 0 && (response as any).data) {
      pagedData = (response as any).data;
    } else if ((response as any).content !== undefined) {
      pagedData = response as PagedResponse<ContrattoDto>;
    } else {
      console.warn('⚠️ Risposta non riconosciuta, uso defaults');
      pagedData = {
        content: [],
        page: 0,
        size: 0,
        totalElements: 0,
        totalPages: 0,
      };
    }

    console.log(
      `✅ Contratti caricati: ${pagedData.totalElements} totali, pagina ${pagedData.page + 1}/${pagedData.totalPages}`
    );

    return pagedData;
  },

  /**
   * GET /api/protected/contratto/{id}
   * Dettaglio singolo contratto
   */
  async getContratto(id: number): Promise<ContrattoDto | null> {
    console.log('🔍 contrattiApi.getContratto:', { id });

    try {
      const response = await authed.get(API_ENDPOINTS.CONTRATTO_DETAIL(id));

      // Gestione response wrapper { code: 0, data: ... }
      if ((response as any)?.data) {
        return (response as any).data as ContrattoDto;
      }

      return response as ContrattoDto;
    } catch (error: any) {
      if (error?.message?.includes('404') || error?.status === 404) {
        console.warn('⚠️ Contratto non trovato:', { id });
        return null;
      }
      throw error;
    }
  },

  /**
   * POST /api/protected/create-contratto
   * Crea un nuovo contratto
   */
  async createContratto(payload: CreateContrattoRequest): Promise<ContrattoDto> {
    console.log('➕ contrattiApi.createContratto:', {
      idOfferta: payload.idOfferta,
      tipoCliente: payload.tipoCliente,
    });

    const response = await authed.post(API_ENDPOINTS.CONTRATTO_CREATE, payload);

    // Il backend può restituire { code: 0, data: ContrattoDto }
    if ((response as any)?.data) {
      return (response as any).data as ContrattoDto;
    }

    return response as ContrattoDto;
  },

  /**
   * PUT /api/protected/update-contratto/{id}
   * Aggiorna un contratto esistente
   */
  async updateContratto(
    id: number,
    payload: Partial<CreateContrattoRequest>
  ): Promise<ContrattoDto> {
    console.log('✏️ contrattiApi.updateContratto:', { id });

    const response = await authed.put(API_ENDPOINTS.CONTRATTO_UPDATE(id), payload);

    if ((response as any)?.data) {
      return (response as any).data as ContrattoDto;
    }

    return response as ContrattoDto;
  },

  /**
   * DELETE /api/protected/delete-contratto/{id}
   * Elimina (soft delete) un contratto
   */
  async deleteContratto(id: number): Promise<void> {
    console.log('🗑️ contrattiApi.deleteContratto:', { id });

    try {
      await authed.delete(API_ENDPOINTS.CONTRATTO_DELETE(id));
      console.log('🗑️ Contratto eliminato');
    } catch (error: any) {
      if (error?.message?.includes('404') || error?.status === 404) {
        console.warn('⚠️ Contratto già eliminato o non trovato:', { id });
        return;
      }
      throw error;
    }
  },

  /**
   * Annulla contratto (soft delete via update)
   */
  async annullaContratto(id: number): Promise<ContrattoDto> {
    console.log('❌ contrattiApi.annullaContratto:', { id });
    return await this.updateContratto(id, { stato: 'annullato' as StatoContratto });
  },

  /**
   * Riassegna un contratto a un altro agente
   */
  async reassignAgent(id: number, idUser: number): Promise<ContrattoDto> {
    console.log('🔄 contrattiApi.reassignAgent:', { id, idUser });

    const response = await authed.put(API_ENDPOINTS.CONTRATTO_UPDATE(id), { idUser });

    if ((response as any)?.data) {
      return (response as any).data as ContrattoDto;
    }

    return response as ContrattoDto;
  },
};

// Alias per backward compatibility
export const ContrattiAPI = contrattiApi;
