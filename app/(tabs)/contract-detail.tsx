/**
 * ContractDetail - Dettaglio contratto (React Native)
 * Visualizzazione completa con sezioni collassabili, modifica, cambio stato
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import { ContrattiAPI, ContrattoDto as ContrattoApiDto } from '../../lib/api';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#1d4ed8',
  green: '#22C55E',
  orange: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
};

// Tipi
type StatoContratto = 'inserito' | 'in_verifica' | 'lavorazione' | 'ok_inserimento' | 'attivato' | 'sospeso' | 'annullato' | 'stornato';

interface ContrattoDto {
  id: number;
  nome?: string;
  cognome?: string;
  ragioneSociale?: string;
  codiceFiscale?: string;
  partitaIva?: string;
  email?: string;
  telefono?: string;
  indirizzoFatturazione?: string;
  indirizzoFornitura?: string;
  pod?: string;
  pdr?: string;
  telcoNumber?: string;
  commodity?: string;
  canale?: string;
  stato?: StatoContratto;
  statoPagamento?: string;
  tsInserimento?: string;
  tsFirmato?: string;
  tsAttivazione?: string;
  iban?: string;
  bollettino?: boolean;
  bollettaCartacea?: boolean;
  periodoFatturazione?: string;
  nomeTerzeParti?: string;
  cognomeTerzeParti?: string;
  codiceFiscaleTerzeParti?: string;
  note?: string;
  offerta?: {
    id?: number;
    nome?: string;
    categoria?: string;
    nomeGestore?: string;
  };
  agente?: {
    id?: number;
    nomeCognome?: string;
    email?: string;
    ruolo?: string;
  };
  master?: {
    id?: number;
    nomeCognome?: string;
    email?: string;
    ruolo?: string;
  };
  provvigioneConsulente?: number;
  provvigioneMaster?: number;
  importoLordo?: number;
  importoNetto?: number;
}

// Mock contratto per demo
const MOCK_CONTRATTO: ContrattoDto = {
  id: 123,
  nome: 'Mario',
  cognome: 'Rossi',
  codiceFiscale: 'RSSMRA80A01H501U',
  email: 'mario.rossi@email.it',
  telefono: '3331234567|0689123456',
  indirizzoFatturazione: 'Via Roma 10, 00100 Roma RM',
  indirizzoFornitura: 'Via Milano 5, 00100 Roma RM',
  pod: 'IT001E12345678',
  commodity: 'luce',
  canale: 'switch',
  stato: 'in_verifica',
  statoPagamento: 'non_pagato',
  tsInserimento: '2024-01-15T10:30:00',
  iban: 'IT60X0542811101000000123456',
  bollettino: false,
  periodoFatturazione: 'mensile',
  note: '[15/01/2024 10:30] Backoffice: Marco - Stato cambiato a In Verifica',
  offerta: {
    id: 1,
    nome: 'Luce Verde Plus',
    categoria: 'energia',
    nomeGestore: 'Enel',
  },
  agente: {
    id: 5,
    nomeCognome: 'Luigi Verdi',
    email: 'luigi.verdi@agenzia.it',
    ruolo: 'consulente',
  },
  master: {
    id: 3,
    nomeCognome: 'Paolo Bianchi',
    email: 'paolo.bianchi@agenzia.it',
    ruolo: 'master',
  },
  provvigioneConsulente: 25.00,
  provvigioneMaster: 10.00,
  importoNetto: 35.00,
  importoLordo: 42.70,
};

// Helper per colore stato
function getStatoColor(stato?: string): { bg: string; text: string; border: string } {
  switch (stato) {
    case 'inserito':
      return { bg: '#E5E7EB', text: '#374151', border: '#9CA3AF' };
    case 'in_verifica':
      return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' };
    case 'lavorazione':
      return { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' };
    case 'ok_inserimento':
      return { bg: '#D1FAE5', text: '#065F46', border: '#10B981' };
    case 'attivato':
      return { bg: '#D1FAE5', text: '#065F46', border: '#10B981' };
    case 'sospeso':
      return { bg: '#FFEDD5', text: '#9A3412', border: '#F97316' };
    case 'annullato':
      return { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' };
    case 'stornato':
      return { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' };
    default:
      return { bg: '#E5E7EB', text: '#374151', border: '#9CA3AF' };
  }
}

// Helper per label stato
function getStatoLabel(stato?: string): string {
  const labels: Record<string, string> = {
    inserito: 'Inserito',
    in_verifica: 'In Verifica',
    lavorazione: 'Lavorazione',
    ok_inserimento: 'OK Inserimento',
    attivato: 'Attivato',
    sospeso: 'Sospeso',
    annullato: 'Annullato',
    stornato: 'Stornato',
  };
  return labels[stato || ''] || stato || 'N/A';
}

// Transizioni stato disponibili
const STATO_TRANSITIONS: Record<StatoContratto, StatoContratto[]> = {
  inserito: ['in_verifica', 'sospeso', 'annullato'],
  in_verifica: ['lavorazione', 'sospeso', 'annullato'],
  lavorazione: ['ok_inserimento', 'sospeso', 'annullato'],
  ok_inserimento: ['attivato', 'sospeso', 'annullato'],
  attivato: ['stornato'],
  sospeso: ['in_verifica', 'annullato'],
  annullato: [],
  stornato: [],
};

// Parse indirizzo
function parseAddress(indirizzo?: string): { via: string; cap: string; citta: string; provincia: string } {
  if (!indirizzo) return { via: '', cap: '', citta: '', provincia: '' };

  const parts = indirizzo.split(',').map(p => p.trim());
  if (parts.length < 2) return { via: indirizzo, cap: '', citta: '', provincia: '' };

  const via = parts[0];
  const resto = parts[1];

  const match = resto.match(/^(\d{5})\s+(.+?)\s+([A-Z]{2})$/);
  if (match) {
    return { via, cap: match[1], citta: match[2], provincia: match[3] };
  }

  return { via, cap: '', citta: resto, provincia: '' };
}

// Componente sezione collassabile
function CollapsibleSection({
  title,
  icon,
  iconColor,
  bgColor,
  borderColor,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card style={[styles.card, borderColor ? { borderLeftWidth: 4, borderLeftColor: borderColor } : null]}>
      <TouchableOpacity
        style={[styles.sectionHeader, bgColor ? { backgroundColor: bgColor } : null]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon} size={20} color={iconColor || colors.foreground} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
      {expanded && <CardContent style={styles.sectionContent}>{children}</CardContent>}
    </Card>
  );
}

// Componente campo
function Field({
  label,
  value,
  icon,
  mono,
  editable,
  editValue,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value?: string | number | null;
  icon?: keyof typeof Ionicons.glyphMap;
  mono?: boolean;
  editable?: boolean;
  editValue?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        {icon && <Ionicons name={icon} size={14} color={colors.mutedForeground} style={{ marginRight: 4 }} />}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {editable ? (
        <TextInput
          style={[styles.fieldInput, mono && styles.fieldMono]}
          value={editValue}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize={mono ? 'characters' : 'sentences'}
        />
      ) : (
        <Text style={[styles.fieldValue, mono && styles.fieldMono]}>
          {value?.toString() || '-'}
        </Text>
      )}
    </View>
  );
}

export default function ContractDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { userRole, user, isAdmin, isSuperAdmin } = useAuth();

  const contractId = params.id ? parseInt(params.id as string) : null;

  const [contratto, setContratto] = useState<ContrattoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ContrattoDto>>({});

  const [changingStato, setChangingStato] = useState(false);
  const [showNotaDialog, setShowNotaDialog] = useState(false);
  const [pendingStato, setPendingStato] = useState<StatoContratto | null>(null);
  const [notaMotivo, setNotaMotivo] = useState('');

  // Sezioni espanse
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    cliente: true,
    indirizzoFatturazione: false,
    indirizzoFornitura: false,
    fornitura: false,
    offerta: false,
    pagamento: false,
    allegati: false,
    note: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Permessi
  const isBackOfficeOrAdmin = userRole === ROLES.BACK_OFFICE || userRole === ROLES.ADMIN || isSuperAdmin;
  const canEdit = isAdmin || isSuperAdmin || contratto?.stato === 'inserito' || contratto?.stato === 'sospeso';
  const canSeeProvvigioneMaster = userRole === ROLES.MASTER || isAdmin || isSuperAdmin || userRole === ROLES.BACK_OFFICE;

  // Map API response to local interface
  const mapApiToLocal = (dto: ContrattoApiDto): ContrattoDto => ({
    id: dto.id,
    nome: dto.nome,
    cognome: dto.cognome,
    ragioneSociale: dto.ragioneSociale,
    codiceFiscale: dto.codiceFiscale,
    partitaIva: dto.partitaIva,
    email: dto.email,
    telefono: dto.telefono || dto.cellulare,
    indirizzoFatturazione: dto.indirizzoFatturazione || dto.indirizzoResidenza,
    indirizzoFornitura: dto.indirizzoFornitura,
    pod: dto.pod,
    pdr: dto.pdr,
    telcoNumber: dto.numeroTelefonico,
    commodity: dto.commodity,
    canale: dto.canale,
    stato: dto.stato as StatoContratto,
    statoPagamento: dto.statoPagamento,
    tsInserimento: dto.tsInserimento || dto.tsCreazione,
    tsFirmato: dto.tsFirmato,
    tsAttivazione: dto.tsAttivazione,
    iban: dto.iban,
    bollettino: dto.pagamentoBollettino,
    bollettaCartacea: dto.bollettaCartacea,
    periodoFatturazione: dto.periodoFatturazione,
    nomeTerzeParti: dto.nomeTerzeParti,
    cognomeTerzeParti: dto.cognomeTerzeParti,
    codiceFiscaleTerzeParti: dto.codiceFiscaleTerzeParti,
    note: dto.note,
    offerta: dto.offerta,
    agente: dto.agente,
    master: dto.master,
    provvigioneConsulente: dto.provvigioneConsulente,
    provvigioneMaster: dto.provvigioneMaster,
    importoLordo: dto.importoLordo,
    importoNetto: dto.importoNetto,
  });

  // Load contratto
  const loadContratto = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch real data from API
      const data = await ContrattiAPI.getById(Number(contractId));
      const mapped = mapApiToLocal(data);
      setContratto(mapped);
      setEditedData(mapped);
    } catch (error) {
      console.error('Error loading contract:', error);
      Alert.alert('Errore', 'Impossibile caricare i dettagli del contratto');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadContratto();
  }, [loadContratto]);

  const onRefresh = () => {
    setRefreshing(true);
    loadContratto();
  };

  // Handle input changes
  const handleInputChange = (field: keyof ContrattoDto, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  // Toggle edit mode
  const handleEditToggle = () => {
    if (isEditing) {
      setEditedData(contratto || {});
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!contratto?.id) return;

    try {
      setSaving(true);
      // In produzione: chiamata API
      // await ContrattiAPI.update(contratto.id, editedData);

      await new Promise(resolve => setTimeout(resolve, 500));

      Alert.alert('Successo', 'Contratto aggiornato con successo');
      setContratto({ ...contratto, ...editedData } as ContrattoDto);
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Errore', error?.message || 'Impossibile salvare le modifiche');
    } finally {
      setSaving(false);
    }
  };

  // Cambio stato
  const handleChangeStato = (newStato: StatoContratto) => {
    if (newStato === 'sospeso' || newStato === 'annullato') {
      setPendingStato(newStato);
      setNotaMotivo('');
      setShowNotaDialog(true);
    } else {
      executeChangeStato(newStato, '');
    }
  };

  const executeChangeStato = async (newStato: StatoContratto, motivoNote: string) => {
    if (!contratto?.id) return;

    try {
      setChangingStato(true);

      const now = new Date();
      const dataOra = now.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      let notaBackoffice = `[${dataOra}] Backoffice - Stato cambiato a ${getStatoLabel(newStato)}`;
      if (motivoNote.trim()) {
        notaBackoffice += `\nMotivo: ${motivoNote.trim()}`;
      }

      const noteAggiornate = contratto.note
        ? `${contratto.note}\n${notaBackoffice}`
        : notaBackoffice;

      // In produzione: chiamata API
      // await ContrattiAPI.update(contratto.id, { stato: newStato, note: noteAggiornate });

      await new Promise(resolve => setTimeout(resolve, 500));

      setContratto(prev => prev ? { ...prev, stato: newStato, note: noteAggiornate } : null);

      Alert.alert('Stato aggiornato', `Contratto #${contratto.id} → ${getStatoLabel(newStato)}`);
      setShowNotaDialog(false);
      setPendingStato(null);
      setNotaMotivo('');
    } catch (error: any) {
      Alert.alert('Errore', error?.message || 'Impossibile cambiare lo stato');
    } finally {
      setChangingStato(false);
    }
  };

  // Parse indirizzi
  const parsedFatturazione = parseAddress(contratto?.indirizzoFatturazione);
  const parsedFornitura = parseAddress(contratto?.indirizzoFornitura);

  // Telefoni
  const telefonoPrincipale = contratto?.telefono?.split('|')[0] || '';
  const telefonoAlternativo = contratto?.telefono?.split('|')[1] || '';

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
        <Text style={styles.loadingText}>Caricamento contratto...</Text>
      </View>
    );
  }

  if (!contratto) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="document-text-outline" size={64} color={colors.mutedForeground} />
        <Text style={styles.emptyTitle}>Contratto non trovato</Text>
        <Text style={styles.emptyText}>Il contratto richiesto non esiste o non hai i permessi.</Text>
        <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
          <Text style={styles.backButtonLargeText}>Torna ai Contratti</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayData = isEditing ? editedData : contratto;
  const statoColors = getStatoColor(contratto.stato);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Contratto #{contratto.id}</Text>
          <Badge
            style={[styles.statoBadge, { backgroundColor: statoColors.bg, borderColor: statoColors.border }]}
          >
            <Text style={[styles.statoBadgeText, { color: statoColors.text }]}>
              {getStatoLabel(contratto.stato)}
            </Text>
          </Badge>
        </View>
        {canEdit && !isEditing && (
          <TouchableOpacity onPress={handleEditToggle} style={styles.editButton}>
            <Ionicons name="create-outline" size={22} color={SEMPLISWITCH_COLORS.blue} />
          </TouchableOpacity>
        )}
      </View>

      {/* Edit mode actions */}
      {isEditing && (
        <View style={styles.editActions}>
          <TouchableOpacity
            style={[styles.editActionButton, styles.cancelButton]}
            onPress={handleEditToggle}
            disabled={saving}
          >
            <Ionicons name="close" size={18} color={colors.foreground} />
            <Text style={styles.cancelButtonText}>Annulla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editActionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Salva</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Barra cambio stato - per backoffice/admin */}
      {isBackOfficeOrAdmin && contratto && (
        <View style={styles.statoBar}>
          <Text style={styles.statoBarLabel}>Gestione Stato:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statoButtonsScroll}>
            {(['in_verifica', 'lavorazione', 'ok_inserimento', 'sospeso', 'annullato'] as StatoContratto[]).map(stato => {
              const isCurrentStato = stato === contratto.stato;
              const isAvailable = STATO_TRANSITIONS[contratto.stato as StatoContratto]?.includes(stato);
              const statoColor = getStatoColor(stato);

              return (
                <TouchableOpacity
                  key={stato}
                  style={[
                    styles.statoButton,
                    { backgroundColor: statoColor.bg, borderColor: statoColor.border },
                    isCurrentStato && styles.statoButtonCurrent,
                    !isAvailable && !isCurrentStato && styles.statoButtonDisabled,
                  ]}
                  onPress={() => isAvailable && handleChangeStato(stato)}
                  disabled={!isAvailable || changingStato}
                >
                  <Text style={[
                    styles.statoButtonText,
                    { color: statoColor.text },
                    !isAvailable && !isCurrentStato && styles.statoButtonTextDisabled,
                  ]}>
                    {isCurrentStato ? getStatoLabel(stato) : `→ ${getStatoLabel(stato)}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Sblocca - per agente quando sospeso */}
      {!isBackOfficeOrAdmin && contratto.stato === 'sospeso' && (
        <View style={styles.sbloccaBar}>
          <View style={styles.sbloccaInfo}>
            <Badge style={styles.sbloccaBadge}>
              <Text style={styles.sbloccaBadgeText}>Sospeso</Text>
            </Badge>
            <Text style={styles.sbloccaText}>Correggi i problemi e sblocca</Text>
          </View>
          <TouchableOpacity
            style={styles.sbloccaButton}
            onPress={() => executeChangeStato('in_verifica', 'Sbloccato dall\'agente')}
            disabled={changingStato}
          >
            {changingStato ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.sbloccaButtonText}>Sblocca</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* Anagrafica Cliente */}
        <CollapsibleSection
          title="Dati Anagrafici Cliente"
          icon="person-outline"
          expanded={expandedSections.cliente}
          onToggle={() => toggleSection('cliente')}
        >
          <View style={styles.fieldsGrid}>
            <Field
              label="Nome"
              value={displayData.nome}
              editable={isEditing}
              editValue={editedData.nome || ''}
              onChangeText={(v) => handleInputChange('nome', v)}
            />
            <Field
              label="Cognome"
              value={displayData.cognome}
              editable={isEditing}
              editValue={editedData.cognome || ''}
              onChangeText={(v) => handleInputChange('cognome', v)}
            />
            <Field
              label="Codice Fiscale"
              value={displayData.codiceFiscale}
              mono
              editable={isEditing}
              editValue={editedData.codiceFiscale || ''}
              onChangeText={(v) => handleInputChange('codiceFiscale', v.toUpperCase())}
            />
            <Field
              label="Partita IVA"
              value={displayData.partitaIva}
              editable={isEditing}
              editValue={editedData.partitaIva || ''}
              onChangeText={(v) => handleInputChange('partitaIva', v)}
              keyboardType="numeric"
            />
            <Field
              label="Email"
              value={displayData.email}
              icon="mail-outline"
              editable={isEditing}
              editValue={editedData.email || ''}
              onChangeText={(v) => handleInputChange('email', v)}
              keyboardType="email-address"
            />
            <Field
              label="Telefono Principale"
              value={telefonoPrincipale}
              icon="call-outline"
              editable={isEditing}
              editValue={editedData.telefono?.split('|')[0] || ''}
              onChangeText={(v) => {
                const alt = editedData.telefono?.split('|')[1] || '';
                handleInputChange('telefono', alt ? `${v}|${alt}` : v);
              }}
              keyboardType="phone-pad"
            />
            <Field
              label="Telefono Alternativo"
              value={telefonoAlternativo}
              icon="call-outline"
            />
          </View>
        </CollapsibleSection>

        {/* Indirizzo Fatturazione */}
        <CollapsibleSection
          title="Indirizzo di Fatturazione"
          icon="home-outline"
          iconColor={SEMPLISWITCH_COLORS.magenta}
          bgColor="#FFF5F9"
          borderColor={SEMPLISWITCH_COLORS.magenta}
          expanded={expandedSections.indirizzoFatturazione}
          onToggle={() => toggleSection('indirizzoFatturazione')}
        >
          <View style={styles.fieldsGrid}>
            <Field label="Via" value={parsedFatturazione.via} />
            <Field label="Città" value={parsedFatturazione.citta} />
            <Field label="CAP" value={parsedFatturazione.cap} />
            <Field label="Provincia" value={parsedFatturazione.provincia} mono />
          </View>
        </CollapsibleSection>

        {/* Indirizzo Fornitura */}
        <CollapsibleSection
          title="Indirizzo di Fornitura"
          icon="location-outline"
          iconColor={SEMPLISWITCH_COLORS.orange}
          bgColor="#FFFBF0"
          borderColor={SEMPLISWITCH_COLORS.yellow}
          expanded={expandedSections.indirizzoFornitura}
          onToggle={() => toggleSection('indirizzoFornitura')}
        >
          <View style={styles.fieldsGrid}>
            <Field label="Via" value={parsedFornitura.via} />
            <Field label="Città" value={parsedFornitura.citta} />
            <Field label="CAP" value={parsedFornitura.cap} />
            <Field label="Provincia" value={parsedFornitura.provincia} mono />
          </View>
        </CollapsibleSection>

        {/* Dati Fornitura */}
        <CollapsibleSection
          title="Dati Fornitura"
          icon="flash-outline"
          expanded={expandedSections.fornitura}
          onToggle={() => toggleSection('fornitura')}
        >
          <View style={styles.fieldsGrid}>
            <Field label="Commodity" value={contratto.commodity} />
            <Field label="Canale" value={contratto.canale?.replace(/_/g, ' ')} />
            {contratto.pod && (
              <Field
                label="POD"
                value={displayData.pod}
                mono
                editable={isEditing}
                editValue={editedData.pod || ''}
                onChangeText={(v) => handleInputChange('pod', v.toUpperCase())}
              />
            )}
            {contratto.pdr && (
              <Field
                label="PDR"
                value={displayData.pdr}
                mono
                editable={isEditing}
                editValue={editedData.pdr || ''}
                onChangeText={(v) => handleInputChange('pdr', v.toUpperCase())}
              />
            )}
            {contratto.telcoNumber && (
              <Field label="Numero Telefonico" value={contratto.telcoNumber} mono />
            )}
          </View>
        </CollapsibleSection>

        {/* Dati Commerciali */}
        <CollapsibleSection
          title="Dati Commerciali"
          icon="briefcase-outline"
          expanded={expandedSections.offerta}
          onToggle={() => toggleSection('offerta')}
        >
          <View style={styles.fieldsGrid}>
            <View style={styles.fieldFull}>
              <Text style={styles.fieldLabel}>Offerta</Text>
              <Text style={styles.fieldValue}>{contratto.offerta?.nome || '-'}</Text>
              {contratto.offerta?.nomeGestore && (
                <Text style={styles.fieldSubvalue}>Gestore: {contratto.offerta.nomeGestore}</Text>
              )}
            </View>

            <View style={styles.fieldFull}>
              <Text style={styles.fieldLabel}>Agente (Consulente)</Text>
              <Text style={styles.fieldValue}>{contratto.agente?.nomeCognome || '-'}</Text>
              {contratto.agente?.email && (
                <Text style={styles.fieldSubvalue}>{contratto.agente.email}</Text>
              )}
            </View>

            {canSeeProvvigioneMaster && contratto.master && (
              <View style={styles.fieldFull}>
                <Text style={styles.fieldLabel}>Master</Text>
                <Text style={styles.fieldValue}>{contratto.master.nomeCognome || '-'}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Provvigione Consulente</Text>
              <Text style={[styles.fieldValueLarge, { color: SEMPLISWITCH_COLORS.magenta }]}>
                {contratto.provvigioneConsulente ? `€ ${contratto.provvigioneConsulente.toFixed(2)}` : '-'}
              </Text>
            </View>

            {canSeeProvvigioneMaster && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Provvigione Master</Text>
                <Text style={[styles.fieldValueLarge, { color: SEMPLISWITCH_COLORS.magenta }]}>
                  {contratto.provvigioneMaster ? `€ ${contratto.provvigioneMaster.toFixed(2)}` : '-'}
                </Text>
              </View>
            )}

            <Field label="Importo Netto" value={contratto.importoNetto ? `€ ${contratto.importoNetto.toFixed(2)}` : '-'} />
            <Field label="Importo Lordo" value={contratto.importoLordo ? `€ ${contratto.importoLordo.toFixed(2)}` : '-'} />
          </View>
        </CollapsibleSection>

        {/* Date e Stati */}
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.foreground} />
              <Text style={styles.sectionTitle}>Date e Stati</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.sectionContent}>
            <View style={styles.fieldsGrid}>
              <Field
                label="Data Inserimento"
                value={contratto.tsInserimento ? new Date(contratto.tsInserimento).toLocaleDateString('it-IT') : '-'}
              />
              <Field
                label="Data Firma"
                value={contratto.tsFirmato ? new Date(contratto.tsFirmato).toLocaleDateString('it-IT') : '-'}
              />
              <Field
                label="Data Attivazione"
                value={contratto.tsAttivazione ? new Date(contratto.tsAttivazione).toLocaleDateString('it-IT') : '-'}
              />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Stato Pagamento</Text>
                <Badge variant="outline" style={styles.statoPagamentoBadge}>
                  <Text style={styles.statoPagamentoText}>
                    {contratto.statoPagamento?.replace(/_/g, ' ') || 'Non pagato'}
                  </Text>
                </Badge>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Pagamento */}
        <CollapsibleSection
          title="Metodo di Pagamento"
          icon="card-outline"
          iconColor={SEMPLISWITCH_COLORS.green}
          bgColor="#F0FDF4"
          borderColor={SEMPLISWITCH_COLORS.green}
          expanded={expandedSections.pagamento}
          onToggle={() => toggleSection('pagamento')}
        >
          <View style={styles.fieldsGrid}>
            <Field label="Metodo" value={contratto.bollettino ? 'Bollettino' : 'RID Bancario'} />
            {!contratto.bollettino && (
              <Field
                label="IBAN"
                value={displayData.iban}
                mono
                editable={isEditing}
                editValue={editedData.iban || ''}
                onChangeText={(v) => handleInputChange('iban', v.toUpperCase())}
              />
            )}
            <Field label="Periodo Fatturazione" value={contratto.periodoFatturazione} />
            <Field label="Bolletta Cartacea" value={contratto.bollettaCartacea ? 'Sì' : 'No'} />

            {contratto.nomeTerzeParti && (
              <>
                <View style={styles.fieldFull}>
                  <Text style={[styles.fieldLabel, { marginTop: spacing[3] }]}>
                    Intestatario RID (Terze Parti)
                  </Text>
                </View>
                <Field label="Nome" value={contratto.nomeTerzeParti} />
                <Field label="Cognome" value={contratto.cognomeTerzeParti} />
                <Field label="Codice Fiscale" value={contratto.codiceFiscaleTerzeParti} mono />
              </>
            )}
          </View>
        </CollapsibleSection>

        {/* Note */}
        {(contratto.note || isEditing) && (
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.foreground} />
                <Text style={styles.sectionTitle}>Note</Text>
              </View>
            </CardHeader>
            <CardContent style={styles.sectionContent}>
              {isEditing ? (
                <TextInput
                  style={styles.noteInput}
                  value={editedData.note || ''}
                  onChangeText={(v) => handleInputChange('note', v)}
                  multiline
                  numberOfLines={4}
                  placeholder="Inserisci eventuali note..."
                />
              ) : (
                <Text style={styles.noteText}>{contratto.note}</Text>
              )}
            </CardContent>
          </Card>
        )}

        {/* Allegati */}
        <CollapsibleSection
          title="Allegati Contratto"
          icon="attach-outline"
          expanded={expandedSections.allegati}
          onToggle={() => toggleSection('allegati')}
        >
          <View style={styles.allegatiPlaceholder}>
            <Ionicons name="cloud-upload-outline" size={32} color={colors.mutedForeground} />
            <Text style={styles.allegatiPlaceholderText}>
              Funzionalità allegati disponibile a breve
            </Text>
          </View>
        </CollapsibleSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Dialog nota per sospeso/annullato */}
      <Modal
        visible={showNotaDialog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotaDialog(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { paddingTop: insets.top }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Text style={[
              styles.modalTitle,
              { color: pendingStato === 'sospeso' ? SEMPLISWITCH_COLORS.orange : SEMPLISWITCH_COLORS.red }
            ]}>
              {pendingStato === 'sospeso' ? 'Sospendi Contratto' : 'Annulla Contratto'}
            </Text>
            <TouchableOpacity onPress={() => setShowNotaDialog(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Inserisci il motivo per cui stai {pendingStato === 'sospeso' ? 'sospendendo' : 'annullando'} questo contratto.
              L'agente vedrà questa nota.
            </Text>

            <Text style={styles.inputLabel}>Motivo (obbligatorio)</Text>
            <TextInput
              style={styles.motivoInput}
              value={notaMotivo}
              onChangeText={setNotaMotivo}
              placeholder={
                pendingStato === 'sospeso'
                  ? 'Es: Dati incompleti, manca documento...'
                  : 'Es: Richiesta cliente, KO gestore...'
              }
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + spacing[3] }]}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowNotaDialog(false);
                setPendingStato(null);
                setNotaMotivo('');
              }}
              disabled={changingStato}
            >
              <Text style={styles.modalCancelText}>Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalConfirmButton,
                { backgroundColor: pendingStato === 'sospeso' ? SEMPLISWITCH_COLORS.orange : SEMPLISWITCH_COLORS.red },
                !notaMotivo.trim() && styles.modalConfirmButtonDisabled,
              ]}
              onPress={() => pendingStato && executeChangeStato(pendingStato, notaMotivo)}
              disabled={!notaMotivo.trim() || changingStato}
            >
              {changingStato ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalConfirmText}>
                  Conferma {pendingStato === 'sospeso' ? 'Sospensione' : 'Annullamento'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
    marginTop: spacing[4],
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
    marginTop: spacing[2],
    textAlign: 'center',
    paddingHorizontal: spacing[6],
  },
  backButtonLarge: {
    marginTop: spacing[6],
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.md,
  },
  backButtonLargeText: {
    color: '#fff',
    fontWeight: fontWeights.medium as any,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: {
    padding: spacing[2],
    marginRight: spacing[2],
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  statoBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderWidth: 1,
  },
  statoBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
  },
  editButton: {
    padding: spacing[2],
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.muted,
  },
  editActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  saveButton: {
    backgroundColor: SEMPLISWITCH_COLORS.green,
  },
  saveButtonText: {
    fontSize: fontSizes.sm,
    color: '#fff',
    fontWeight: fontWeights.medium as any,
  },
  statoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  statoBarLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: '#1E40AF',
    marginRight: spacing[3],
  },
  statoButtonsScroll: {
    flex: 1,
  },
  statoButton: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginRight: spacing[2],
  },
  statoButtonCurrent: {
    borderWidth: 2,
  },
  statoButtonDisabled: {
    opacity: 0.4,
  },
  statoButtonText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
  },
  statoButtonTextDisabled: {
    color: colors.mutedForeground,
  },
  sbloccaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#FFEDD5',
    borderBottomWidth: 1,
    borderBottomColor: '#FDBA74',
  },
  sbloccaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  sbloccaBadge: {
    backgroundColor: '#FED7AA',
    borderColor: '#F97316',
  },
  sbloccaBadgeText: {
    fontSize: fontSizes.xs,
    color: '#9A3412',
  },
  sbloccaText: {
    fontSize: fontSizes.sm,
    color: '#9A3412',
    flex: 1,
  },
  sbloccaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: SEMPLISWITCH_COLORS.green,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
  },
  sbloccaButtonText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  card: {
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  sectionContent: {
    paddingTop: 0,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  field: {
    width: '47%',
    minWidth: 140,
  },
  fieldFull: {
    width: '100%',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  fieldValue: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  fieldValueLarge: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
  },
  fieldSubvalue: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  fieldMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSizes.base,
    backgroundColor: colors.background,
  },
  statoPagamentoBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing[1],
  },
  statoPagamentoText: {
    fontSize: fontSizes.sm,
    textTransform: 'capitalize',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    fontSize: fontSizes.base,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  noteText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
    lineHeight: 22,
  },
  allegatiPlaceholder: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  allegatiPlaceholderText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[2],
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
  },
  modalContent: {
    flex: 1,
    padding: spacing[4],
  },
  modalDescription: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[4],
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  motivoInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    fontSize: fontSizes.base,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    fontSize: fontSizes.base,
    color: '#fff',
    fontWeight: fontWeights.medium as any,
  },
});
