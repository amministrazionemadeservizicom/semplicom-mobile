/**
 * Tipi per il sistema Contratti
 * Condivisi tra web e mobile
 */

// ===== ENUMS =====
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
export type Canale = "porta_a_porta" | "teleselling" | "web" | "agenzia" | "altro";
export type TipoCliente = "privato" | "business" | "condominio";
export type CommodityOpenAPI = "luce" | "gas" | "n-a";
export type CanaleOpenAPI = "d2d" | "telesales" | "online";
export type PeriodoFatturazione = "mensile" | "bimestrale" | "n/a";
export type TelcoTechnology = "FTTH" | "FTTC" | "FWA";

/**
 * Allegato riferito al contratto
 */
export interface AllegatoContratto {
  idAllegato: number;
}

/**
 * Contratto completo (risposta backend)
 */
export interface Contratto {
  id: number;
  idAgenzia: number;
  idUser: number;
  idCliente?: number;
  idOfferta: number;

  // Anagrafica Cliente
  nomeCliente: string;
  cognomeCliente: string;
  codiceFiscale?: string;
  partitaIva?: string;
  email?: string;
  telefono?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;

  // Dati Contratto
  commodity: Commodity;
  canale: Canale;
  POD?: string;
  PDR?: string;
  telcoNumber?: string;

  // Stato e Pagamento
  stato: StatoContratto;
  statoPagamento: StatoPagamento;

  // Date importanti
  dataInserimento: string;
  dataFirma?: string;
  dataAttivazione?: string;
  dataVerifica?: string;
  dataLavorazione?: string;
  dataOkInserimento?: string;
  dataSospensione?: string;
  dataAnnullamento?: string;
  dataStorno?: string;

  // Importi
  importoCommissione?: number;
  importoPagato?: number;

  // Note e Documenti
  note?: string;
  allegati?: AllegatoContratto[];

  // Campi relazionali
  user?: {
    id: number;
    nome?: string;
    cognome?: string;
    email?: string;
  };
  agenzia?: {
    id: number;
    nome?: string;
  };
  offerta?: {
    id: number;
    titolo?: string;
    categoria?: string;
    nomeGestore?: string;
  };

  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO utente semplificato
 */
export interface UserSimpleDto {
  id: number;
  nomeCognome: string;
  email: string;
  ruolo: string;
}

/**
 * DTO offerta base per contratto
 */
export interface OffertaBaseDto {
  id: number;
  nome: string;
  idGestore?: number;
  nomeGestore?: string;
  categoria?: string;
  customer?: string;
  stato?: string;
  dal?: string;
  al?: string;
  note?: string;
  bonus?: string;
}

/**
 * Contratto DTO (formato OpenAPI)
 */
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
  tsCancellato?: string;
  snapshot?: string;
  tipoCliente: TipoCliente;
  nome?: string;
  cognome?: string;
  ragioneSociale?: string;
  codiceFiscale?: string;
  partitaIva?: string;
  email?: string;
  telefono?: string;
  indirizzoFatturazione?: string;
  commodity?: CommodityOpenAPI;
  pod?: string;
  pdr?: string;
  telcoNumber?: string;
  telcoTechnology?: TelcoTechnology;
  indirizzoFornitura?: string;
  agente?: UserSimpleDto;
  master?: UserSimpleDto;
  canale?: CanaleOpenAPI;
  bollettaCartacea?: boolean;
  periodoFatturazione?: PeriodoFatturazione;
  bollettino?: boolean;
  iban?: string;
  ridTerzaPersonaNome?: string;
  ridTerzaPersonaCognome?: string;
  ridTerzaPersonaCF?: string;
  noteFatturazione?: string;
  importoLordo?: number;
  importoNetto?: number;
  provvigioneConsulente?: number;
  provvigioneMaster?: number;
  provvigioneExtra?: number;
  escludiProvvigioni?: boolean;
}

/**
 * Payload per creazione contratto (OpenAPI)
 */
export interface CreateContrattoRequest {
  idOfferta: number;
  tipoCliente: TipoCliente;
  codice?: string;
  codiceEsterno?: string;
  note?: string;
  stato?: StatoContratto;
  statoPagamento?: StatoPagamento;
  nome?: string;
  cognome?: string;
  ragioneSociale?: string;
  codiceFiscale?: string;
  partitaIva?: string;
  email?: string;
  telefono?: string;
  indirizzoFatturazione?: string;
  commodity?: CommodityOpenAPI;
  pod?: string;
  pdr?: string;
  telcoNumber?: string;
  telcoTechnology?: TelcoTechnology;
  indirizzoFornitura?: string;
  canale?: CanaleOpenAPI;
  periodoFatturazione?: PeriodoFatturazione;
  bollettaCartacea?: boolean;
  bollettino?: boolean;
  iban?: string;
  ridTerzaPersonaNome?: string;
  ridTerzaPersonaCognome?: string;
  ridTerzaPersonaCF?: string;
  noteFatturazione?: string;
  importoLordo?: number;
  importoNetto?: number;
  escludiProvvigioni?: boolean;
}

/**
 * Filtri per lista contratti
 */
export interface ContrattiFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  searchTerm?: string;
  stato?: StatoContratto;
  statoPagamento?: StatoPagamento;
  tipoCliente?: TipoCliente;
  commodity?: string;
  canale?: string;
  idAgente?: number;
  idOfferta?: number;
  tsCreazioneDa?: string;
  tsCreazioneA?: string;
  tsInserimentoDa?: string;
  tsInserimentoA?: string;
  tsFirmatoDa?: string;
  tsFirmatoA?: string;
  tsAttivazioneDa?: string;
  tsAttivazioneA?: string;
}

// ===== HELPERS =====

/**
 * Get label italiana per stato
 */
export function getStatoLabel(stato: StatoContratto): string {
  switch (stato) {
    case 'inserito':
      return 'Inserito';
    case 'in_verifica':
      return 'In Verifica';
    case 'lavorazione':
      return 'In Lavorazione';
    case 'ok_inserimento':
      return 'OK Inserimento';
    case 'attivato':
      return 'Attivato';
    case 'sospeso':
      return 'Sospeso';
    case 'annullato':
      return 'Annullato';
    case 'stornato':
      return 'Stornato';
    default:
      return stato;
  }
}

/**
 * Get label italiana per stato pagamento
 */
export function getStatoPagamentoLabel(stato: StatoPagamento): string {
  switch (stato) {
    case 'non_pagato':
      return 'Non Pagato';
    case 'pronto_fattura':
      return 'Pronto Fattura';
    case 'inviato_fatturare':
      return 'Inviato a Fatturare';
    case 'pagato':
      return 'Pagato';
    case 'stornato':
      return 'Stornato';
    default:
      return stato;
  }
}

/**
 * Formatta importo per display
 */
export function formatImporto(importo: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(importo);
}

/**
 * Regole di transizione stati contratto
 */
export const STATO_TRANSITIONS: Record<StatoContratto, StatoContratto[]> = {
  inserito: ["in_verifica"],
  in_verifica: ["lavorazione", "sospeso", "annullato"],
  lavorazione: ["in_verifica", "ok_inserimento", "sospeso", "annullato"],
  ok_inserimento: ["lavorazione", "in_verifica", "attivato", "sospeso", "annullato"],
  attivato: ["ok_inserimento", "stornato"],
  sospeso: ["in_verifica", "lavorazione", "annullato"],
  annullato: ["in_verifica"],
  stornato: [],
};

/**
 * Verifica se una transizione di stato è permessa
 */
export function canTransitionTo(
  currentStato: StatoContratto,
  newStato: StatoContratto
): boolean {
  const allowedTransitions = STATO_TRANSITIONS[currentStato];
  return allowedTransitions.includes(newStato);
}

/**
 * Ottiene gli stati successivi permessi
 */
export function getNextStati(currentStato: StatoContratto): StatoContratto[] {
  return STATO_TRANSITIONS[currentStato] || [];
}
