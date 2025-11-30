/**
 * API Client per Gestori
 * Condiviso tra web e mobile
 */

import { authed } from './client';
import { API_ENDPOINTS } from '../constants';
import type {
  Gestore,
  GestoreDettaglio,
  GestoreUtente,
  CreateGestorePayload,
  UpdateGestorePayload,
  CategoriaGestore,
} from '../types/gestori';
import type { ApiResponse } from '../types/common';

// Re-export types
export type { Gestore, GestoreDettaglio, CreateGestorePayload, UpdateGestorePayload };

/**
 * Estrae data dalla risposta API o lancia errore
 */
function extractDataOrThrow<T>(response: any, message: string): T {
  if (response?.data !== undefined && response.data !== null) {
    return response.data as T;
  }
  if (response && response.data === undefined) {
    return response as T;
  }
  throw new Error(response?.message || message);
}

/**
 * Estrae array dalla risposta API
 */
function extractArrayOrThrow<T>(response: any, message: string): T {
  if (Array.isArray(response)) {
    return response as T;
  }
  if (response?.data) {
    if (Array.isArray(response.data)) {
      return response.data as T;
    }
    if (Array.isArray(response.data.content)) {
      return response.data.content as T;
    }
  }
  if (Array.isArray(response?.content)) {
    return response.content as T;
  }
  if (response?.data === null || response?.data === undefined) {
    return [] as T;
  }
  throw new Error(response?.message || message);
}

/**
 * Normalizza categoria gestore
 */
export function normalizeCategoria(raw: unknown): CategoriaGestore {
  const value = String(raw ?? '').trim().toLowerCase();
  if (value.includes('telefon')) return 'telefonia';
  if (value.includes('energ')) return 'energia';
  return 'energia'; // default
}

/**
 * Crea slug da nome
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const gestoriApi = {
  /**
   * GET /api/protected/gestori
   * Lista tutti i gestori (con filtro categoria opzionale)
   */
  async listGestori(categoria?: string): Promise<Gestore[]> {
    const path = categoria
      ? `${API_ENDPOINTS.GESTORI}?categoria=${encodeURIComponent(categoria)}`
      : API_ENDPOINTS.GESTORI;

    const response = await authed.get<any>(path);
    const items = extractArrayOrThrow<any[]>(response, 'Errore durante il caricamento dei gestori');

    return items.map((item) => {
      const id = item?.id ?? item?.gestoreId ?? item?.gestore?.id;
      const nome = item?.nome ?? item?.gestoreNome ?? item?.gestore?.nome ?? 'Nome non disponibile';
      const categoriaValue = item?.categoria ?? item?.gestoreCategoria ?? categoria;
      const categoriaNormalized = categoriaValue
        ? String(categoriaValue).trim().toLowerCase()
        : 'altro';

      return {
        ...item,
        id: Number(id ?? 0),
        nome,
        categoria: categoriaNormalized as CategoriaGestore,
        logo: item?.logo ?? item?.logoUrl ?? item?.gestore?.logo ?? null,
      } as Gestore;
    });
  },

  /**
   * GET /api/protected/gestori/{id}
   * Dettaglio singolo gestore
   */
  async getGestore(id: number): Promise<Gestore> {
    const response = await authed.get<ApiResponse<Gestore>>(API_ENDPOINTS.GESTORE_DETAIL(id));
    return extractDataOrThrow<Gestore>(response, 'Gestore non trovato');
  },

  /**
   * POST /api/protected/create-gestore
   * Crea nuovo gestore
   */
  async createGestore(payload: CreateGestorePayload): Promise<Gestore> {
    const response = await authed.post<ApiResponse<Gestore>>(
      '/api/protected/create-gestore',
      payload
    );
    const data = extractDataOrThrow<Gestore>(response, 'Errore durante la creazione del gestore');

    return {
      ...data,
      id: Number(data.id),
      nome: data.nome,
      categoria: (String(data.categoria ?? payload.categoria ?? '')
        .trim()
        .toLowerCase() || payload.categoria) as CategoriaGestore,
      logo: data.logo ?? (data as any).logoUrl ?? undefined,
    };
  },

  /**
   * PUT /api/protected/update-gestore/{id}
   * Aggiorna gestore
   */
  async updateGestore(id: number, payload: UpdateGestorePayload): Promise<Gestore> {
    const response = await authed.put<ApiResponse<Gestore>>(
      `/api/protected/update-gestore/${id}`,
      payload
    );
    const data = extractDataOrThrow<Gestore>(
      response,
      "Errore durante l'aggiornamento del gestore"
    );

    return {
      ...data,
      id: Number(data.id),
      nome: data.nome,
      categoria: (String(data.categoria ?? '').trim().toLowerCase() || 'altro') as CategoriaGestore,
      logo: data.logo ?? (data as any).logoUrl ?? undefined,
    };
  },

  /**
   * DELETE /api/protected/delete-gestore/{id}
   * Elimina gestore
   */
  async deleteGestore(id: number): Promise<{ success: boolean; message?: string }> {
    const response = await authed.delete<ApiResponse<any>>(`/api/protected/delete-gestore/${id}`);
    return {
      success: true,
      message: response?.message || 'Gestore eliminato con successo',
    };
  },

  /**
   * GET /api/protected/gestori-agenzia/{agenziaId}
   * Lista gestori associati a un'agenzia
   */
  async listGestoriAgenzia(agenziaId: number): Promise<GestoreDettaglio[]> {
    const response = await authed.get<any>(`/api/protected/gestori-agenzia/${agenziaId}`);
    return extractArrayOrThrow<GestoreDettaglio[]>(
      response,
      "Impossibile caricare i gestori dell'agenzia"
    );
  },

  /**
   * GET /api/protected/gestori-utente/{userId}
   * Lista gestori assegnati a un utente
   */
  async listGestoriUtente(userId: number): Promise<GestoreUtente[]> {
    const response = await authed.get<any>(`/api/protected/gestori-utente/${userId}`);
    return extractArrayOrThrow<GestoreUtente[]>(
      response,
      "Impossibile caricare i gestori assegnati all'utente"
    );
  },

  /**
   * POST /api/protected/assegna-gestori
   * Assegna gestori a un utente
   */
  async assignGestoriToUser(
    userId: number,
    gestoriIds: number[]
  ): Promise<{ success: boolean }> {
    const response = await authed.post('/api/protected/assegna-gestori', {
      userId,
      gestoriIds,
    });
    return response as { success: boolean };
  },

  /**
   * POST /api/protected/associa-gestore
   * Associa gestore ad agenzia
   */
  async associaGestoreAgenzia(payload: {
    idGestore: number;
    idAgenzia: number;
    dal?: string;
    al?: string | null;
    stato?: number;
  }): Promise<{ success: boolean }> {
    const response = await authed.post('/api/protected/associa-gestore', payload);
    return response as { success: boolean };
  },

  /**
   * DELETE /api/protected/disattiva-gestore
   * Disattiva associazione gestore-agenzia
   */
  async disattivaGestoreAgenzia(payload: {
    idGestore: number;
    idAgenzia: number;
  }): Promise<{ success: boolean }> {
    const response = await authed.delete('/api/protected/disattiva-gestore');
    return response as { success: boolean };
  },

  /**
   * URL logo gestore
   */
  getLogoUrl(idGestore: number): string {
    return API_ENDPOINTS.LOGO_GESTORE(idGestore);
  },
};

// Alias per backward compatibility
export const GestoriAPI = gestoriApi;
