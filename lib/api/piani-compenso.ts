/**
 * API Client per Piani Compenso
 * Gestisce le chiamate API per i piani compenso
 */

import { authed } from './client';

// Types
export interface DettaglioPiano {
  id?: number;
  prodotto: string;
  importo: number;
  soglia?: number | null;
  descr?: string | null;
}

export interface PianoCompensoDto {
  id: number;
  nome: string;
  dal?: string;
  al?: string;
  attivo: boolean;
  dettagli?: DettaglioPiano[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LineItem {
  gestore: string;
  tipoContratto: string;
  tipoCliente: string;
  compensoLordo: number;
  note?: string;
}

export interface MyPianoCompenso {
  id: string;
  nome: string;
  descrizione?: string;
  dataInizio?: string;
  dataFine?: string;
  stato: 'attivo' | 'scaduto' | 'futuro';
  lineItems: LineItem[];
}

// API Methods
export const PianiCompensoAPI = {
  /**
   * GET /api/protected/piani-compenso
   * Lista piani compenso (admin only)
   */
  list: async (attivi?: boolean): Promise<PianoCompensoDto[]> => {
    console.log('📊 PianiCompensoAPI.list', { attivi });

    try {
      const params = new URLSearchParams();
      if (attivi !== undefined) {
        params.set('attivi', attivi ? '1' : '0');
      }

      const url = `/api/protected/piani-compenso${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await authed.get(url);

      // Handle response format { data: [...] }
      const data = (response as any)?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ PianiCompensoAPI.list Error:', error);
      throw error;
    }
  },

  /**
   * GET /api/protected/piano-compenso/{id}
   * Dettaglio piano compenso
   */
  getById: async (id: number): Promise<PianoCompensoDto> => {
    console.log('📊 PianiCompensoAPI.getById', id);

    try {
      const response = await authed.get(`/api/protected/piano-compenso/${id}`);
      const data = (response as any)?.data || response;
      return data;
    } catch (error) {
      console.error('❌ PianiCompensoAPI.getById Error:', error);
      throw error;
    }
  },

  /**
   * GET /api/protected/my-piano-compenso
   * Piano compenso dell'utente corrente
   */
  getMyPiano: async (): Promise<MyPianoCompenso | null> => {
    console.log('📊 PianiCompensoAPI.getMyPiano');

    try {
      const response = await authed.get('/api/protected/my-piano-compenso');
      const data = (response as any)?.data || response;

      if (!data) return null;

      // Map API response to local format
      const lineItems: LineItem[] = (data.dettagli || []).map((det: any) => ({
        gestore: det.gestore || det.prodotto || 'N/D',
        tipoContratto: det.tipoContratto || det.prodotto || 'Switch',
        tipoCliente: det.tipoCliente || 'Domestico',
        compensoLordo: det.importo || det.compensoLordo || 0,
        note: det.descr || det.note,
      }));

      return {
        id: String(data.id),
        nome: data.nome || 'Piano Compenso',
        descrizione: data.descrizione,
        dataInizio: data.dal || data.dataInizio,
        dataFine: data.al || data.dataFine,
        stato: data.attivo !== false ? 'attivo' : 'scaduto',
        lineItems,
      };
    } catch (error) {
      console.error('❌ PianiCompensoAPI.getMyPiano Error:', error);
      return null;
    }
  },

  /**
   * POST /api/protected/create-piano-compenso
   * Crea nuovo piano compenso
   */
  create: async (payload: {
    nome: string;
    dal: string;
    al: string;
    dettagli: DettaglioPiano[];
  }): Promise<PianoCompensoDto> => {
    console.log('📊 PianiCompensoAPI.create', payload.nome);

    try {
      const response = await authed.post('/api/protected/create-piano-compenso', payload);
      const data = (response as any)?.data || response;
      return data;
    } catch (error) {
      console.error('❌ PianiCompensoAPI.create Error:', error);
      throw error;
    }
  },

  /**
   * PUT /api/protected/update-piano-compenso/{id}
   * Aggiorna piano compenso
   */
  update: async (id: number, payload: {
    nome?: string;
    dal?: string;
    al?: string;
    dettagli?: DettaglioPiano[];
  }): Promise<PianoCompensoDto> => {
    console.log('📊 PianiCompensoAPI.update', id);

    try {
      const response = await authed.put(`/api/protected/update-piano-compenso/${id}`, payload);
      const data = (response as any)?.data || response;
      return data;
    } catch (error) {
      console.error('❌ PianiCompensoAPI.update Error:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/protected/delete-piano-compenso/{id}
   * Elimina (logicamente) piano compenso
   */
  delete: async (id: number): Promise<void> => {
    console.log('📊 PianiCompensoAPI.delete', id);

    try {
      await authed.delete(`/api/protected/delete-piano-compenso/${id}`);
    } catch (error) {
      console.error('❌ PianiCompensoAPI.delete Error:', error);
      throw error;
    }
  },
};
