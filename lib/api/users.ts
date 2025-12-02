/**
 * API Client per Utenti
 * Gestisce le chiamate API per la gestione utenti
 */

import { authed } from './client';

// Types
export interface UserDto {
  id: number;
  username: string;
  nomeCognome: string;
  email: string;
  telefono?: string | null;
  codiceFiscale?: string | null;
  indirizzo?: string | null;
  citta?: string | null;
  cap?: string | null;
  provincia?: string | null;
  ruolo: string; // c=consulente, m=master, b=backoffice, a=admin, s=superadmin
  idAgenzia: number;
  stato: number; // 1=attivo, 0=disattivo, -1=eliminato
  notePersonale?: string | null;
  lastUpdate?: string;
  dataCreazione?: string;
  lastAccess?: string | null;
  twoFactor?: boolean;
  iban?: string | null;
  masterRiferimento?: string | number | null;
  idPianoCompenso?: number | string | null;
  nomePianoCompenso?: string | null;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  nomeCognome: string;
  password?: string;
  ruolo: string;
  idAgenzia?: number;
  telefono?: string;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  nomeCognome?: string;
  password?: string;
  ruolo?: string;
  telefono?: string;
  stato?: number;
  idPianoCompenso?: number | null;
  masterRiferimento?: number | null;
}

// Map stato number to string
export const mapStatoToString = (stato: number): 'ATTIVO' | 'SOSPESO' | 'DISABILITATO' => {
  switch (stato) {
    case 1: return 'ATTIVO';
    case 0: return 'SOSPESO';
    case -1: return 'DISABILITATO';
    default: return 'SOSPESO';
  }
};

// Map ruolo code to readable label
export const mapRuoloToLabel = (ruolo: string): string => {
  switch (ruolo) {
    case 's': return 'SuperAdmin';
    case 'a': return 'Admin';
    case 'm': return 'Master';
    case 'b': return 'BackOffice';
    case 'c': return 'Consulente';
    default: return ruolo;
  }
};

// API Methods
export const UsersAPI = {
  /**
   * GET /api/protected/users
   * Lista utenti
   */
  list: async (params?: {
    ruolo?: string;
    idAgenzia?: number;
    stato?: number;
  }): Promise<UserDto[]> => {
    console.log('👥 UsersAPI.list', params);

    try {
      const queryParams = new URLSearchParams();
      if (params?.ruolo) queryParams.set('ruolo', params.ruolo);
      if (params?.idAgenzia) queryParams.set('idAgenzia', String(params.idAgenzia));
      if (params?.stato !== undefined) queryParams.set('stato', String(params.stato));

      const url = `/api/protected/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await authed.get(url);

      // Handle response format { data: [...] } or direct array
      const data = (response as any)?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ UsersAPI.list Error:', error);
      throw error;
    }
  },

  /**
   * GET /api/protected/users/{id}
   * Dettaglio utente
   */
  getById: async (id: number): Promise<UserDto> => {
    console.log('👥 UsersAPI.getById', id);

    try {
      const response = await authed.get(`/api/protected/users/${id}`);
      const data = (response as any)?.data || response;
      return data;
    } catch (error) {
      console.error('❌ UsersAPI.getById Error:', error);
      throw error;
    }
  },

  /**
   * POST /api/protected/create-user
   * Crea nuovo utente
   */
  create: async (payload: CreateUserPayload): Promise<UserDto> => {
    console.log('👥 UsersAPI.create', payload.username);

    try {
      const response = await authed.post('/api/protected/create-user', payload);
      const data = (response as any)?.data || response;
      return data;
    } catch (error) {
      console.error('❌ UsersAPI.create Error:', error);
      throw error;
    }
  },

  /**
   * PUT /api/protected/update-user/{id}
   * Aggiorna utente
   */
  update: async (id: number, payload: UpdateUserPayload): Promise<UserDto> => {
    console.log('👥 UsersAPI.update', id);

    try {
      const response = await authed.put(`/api/protected/update-user/${id}`, payload);
      const data = (response as any)?.data || response;
      return data;
    } catch (error) {
      console.error('❌ UsersAPI.update Error:', error);
      throw error;
    }
  },

  /**
   * PUT /api/protected/toggle-user-status/{id}
   * Attiva/disattiva utente
   */
  toggleStatus: async (id: number): Promise<UserDto> => {
    console.log('👥 UsersAPI.toggleStatus', id);

    try {
      const response = await authed.put(`/api/protected/toggle-user-status/${id}`, {});
      const data = (response as any)?.data || response;
      return data;
    } catch (error) {
      console.error('❌ UsersAPI.toggleStatus Error:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/protected/delete-user/{id}
   * Elimina utente (logicamente)
   */
  delete: async (id: number): Promise<void> => {
    console.log('👥 UsersAPI.delete', id);

    try {
      await authed.delete(`/api/protected/delete-user/${id}`);
    } catch (error) {
      console.error('❌ UsersAPI.delete Error:', error);
      throw error;
    }
  },

  /**
   * GET /api/protected/agenti
   * Lista agenti
   */
  listAgenti: async (params?: {
    idAgenzia?: number;
    attivi?: boolean;
  }): Promise<any[]> => {
    console.log('👥 UsersAPI.listAgenti', params);

    try {
      const queryParams = new URLSearchParams();
      if (params?.idAgenzia) queryParams.set('idAgenzia', String(params.idAgenzia));
      if (params?.attivi !== undefined) queryParams.set('attivi', params.attivi ? '1' : '0');

      const url = `/api/protected/agenti${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await authed.get(url);

      const data = (response as any)?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ UsersAPI.listAgenti Error:', error);
      throw error;
    }
  },
};
