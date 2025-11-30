/**
 * API Client per Dashboard
 * Fornisce statistiche per le varie dashboard per ruolo
 */

import { authed } from './client';
import { ContrattiAPI, ContrattoDto } from './contratti';
import { OfferteAPI, OffertaBase } from './offerte';

// ============================================
// TYPES
// ============================================

export interface DashboardStats {
  totaleContratti: number;
  contrattiMese: number;
  contrattiInVerifica: number;
  contrattiAttivi: number;
  contrattiSospesi: number;
  totaleOfferte: number;
  offerteAttive: number;
}

export interface AgenteDashboardStats extends DashboardStats {
  ultimiContratti: ContrattoDto[];
  provvigioniMese: number;
  provvigioniAnno: number;
}

export interface AdminDashboardStats extends DashboardStats {
  totaleAgenti: number;
  agentiAttivi: number;
  fatturato: number;
  fatturatoMese: number;
}

export interface BackofficeDashboardStats {
  contrattiDaVerificare: number;
  contrattiInLavorazione: number;
  contrattiOkInserimento: number;
  contrattiSospesi: number;
  contrattiOggi: number;
  contrattiSettimana: number;
}

// ============================================
// API METHODS
// ============================================

export const DashboardAPI = {
  /**
   * Statistiche per Dashboard Consulente/Master
   */
  getAgenteStats: async (): Promise<AgenteDashboardStats> => {
    console.log("📊 DashboardAPI.getAgenteStats");

    try {
      // Fetch contratti dell'agente
      const contrattiResponse = await ContrattiAPI.list({ size: 100 });
      const contratti = contrattiResponse.content;

      // Calcola statistiche
      const oggi = new Date();
      const primoDelMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);

      const contrattiMese = contratti.filter(c => {
        const dataCreazione = new Date(c.tsCreazione || c.tsInserimento || '');
        return dataCreazione >= primoDelMese;
      });

      const stats: AgenteDashboardStats = {
        totaleContratti: contrattiResponse.totalElements,
        contrattiMese: contrattiMese.length,
        contrattiInVerifica: contratti.filter(c => c.stato === 'in_verifica').length,
        contrattiAttivi: contratti.filter(c => c.stato === 'attivato').length,
        contrattiSospesi: contratti.filter(c => c.stato === 'sospeso').length,
        totaleOfferte: 0, // Da implementare se necessario
        offerteAttive: 0,
        ultimiContratti: contratti.slice(0, 5),
        provvigioniMese: contrattiMese.reduce((sum, c) => sum + (c.importoNetto || 0), 0),
        provvigioniAnno: contratti.reduce((sum, c) => sum + (c.importoNetto || 0), 0),
      };

      console.log("✅ Stats agente:", stats);
      return stats;
    } catch (error) {
      console.error("❌ DashboardAPI.getAgenteStats Error:", error);
      throw error;
    }
  },

  /**
   * Statistiche per Dashboard Admin
   */
  getAdminStats: async (): Promise<AdminDashboardStats> => {
    console.log("📊 DashboardAPI.getAdminStats");

    try {
      const [contrattiResponse, offerteResponse] = await Promise.all([
        ContrattiAPI.list({ size: 100 }),
        OfferteAPI.list({ size: 100 }),
      ]);

      const contratti = contrattiResponse.content;
      const offerte = offerteResponse.content;

      const oggi = new Date();
      const primoDelMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);

      const contrattiMese = contratti.filter(c => {
        const dataCreazione = new Date(c.tsCreazione || c.tsInserimento || '');
        return dataCreazione >= primoDelMese;
      });

      const stats: AdminDashboardStats = {
        totaleContratti: contrattiResponse.totalElements,
        contrattiMese: contrattiMese.length,
        contrattiInVerifica: contratti.filter(c => c.stato === 'in_verifica').length,
        contrattiAttivi: contratti.filter(c => c.stato === 'attivato').length,
        contrattiSospesi: contratti.filter(c => c.stato === 'sospeso').length,
        totaleOfferte: offerteResponse.totalElements,
        offerteAttive: offerte.filter(o => o.stato === 'attiva').length,
        totaleAgenti: 0, // Da endpoint separato
        agentiAttivi: 0,
        fatturato: contratti.reduce((sum, c) => sum + (c.importoLordo || 0), 0),
        fatturatoMese: contrattiMese.reduce((sum, c) => sum + (c.importoLordo || 0), 0),
      };

      console.log("✅ Stats admin:", stats);
      return stats;
    } catch (error) {
      console.error("❌ DashboardAPI.getAdminStats Error:", error);
      throw error;
    }
  },

  /**
   * Statistiche per Dashboard Backoffice
   */
  getBackofficeStats: async (): Promise<BackofficeDashboardStats> => {
    console.log("📊 DashboardAPI.getBackofficeStats");

    try {
      const contrattiResponse = await ContrattiAPI.list({ size: 200 });
      const contratti = contrattiResponse.content;

      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);

      const inizioSettimana = new Date(oggi);
      inizioSettimana.setDate(oggi.getDate() - oggi.getDay());

      const contrattiOggi = contratti.filter(c => {
        const data = new Date(c.tsCreazione || c.tsInserimento || '');
        data.setHours(0, 0, 0, 0);
        return data.getTime() === oggi.getTime();
      });

      const contrattiSettimana = contratti.filter(c => {
        const data = new Date(c.tsCreazione || c.tsInserimento || '');
        return data >= inizioSettimana;
      });

      const stats: BackofficeDashboardStats = {
        contrattiDaVerificare: contratti.filter(c => c.stato === 'in_verifica').length,
        contrattiInLavorazione: contratti.filter(c => c.stato === 'lavorazione').length,
        contrattiOkInserimento: contratti.filter(c => c.stato === 'ok_inserimento').length,
        contrattiSospesi: contratti.filter(c => c.stato === 'sospeso').length,
        contrattiOggi: contrattiOggi.length,
        contrattiSettimana: contrattiSettimana.length,
      };

      console.log("✅ Stats backoffice:", stats);
      return stats;
    } catch (error) {
      console.error("❌ DashboardAPI.getBackofficeStats Error:", error);
      throw error;
    }
  },

  /**
   * Statistiche per SuperAdmin Dashboard
   */
  getSuperAdminStats: async (): Promise<AdminDashboardStats> => {
    // Per ora usa le stesse stats dell'admin
    return await DashboardAPI.getAdminStats();
  },
};
