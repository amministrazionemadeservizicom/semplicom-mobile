/**
 * AdminContratti - Gestione Contratti Admin
 * Pagina per gestire tutti i contratti del sistema
 * Stile Sempliswitch
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AccessDenied } from '../../components/navigation/AccessDenied';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import { ContrattiAPI, ContrattoDto } from '../../lib/api';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#1d4ed8',
};

// Types
type StatoContratto = 'in lavorazione' | 'chiuso' | 'annullato';

interface Contratto {
  id: number;
  idUtente: number;
  idOfferta: number;
  idPianoCompenso: number;
  dataFirma: string;
  importo: number;
  stato: StatoContratto;
  utente?: {
    nomeCognome?: string;
    username?: string;
    email?: string;
  };
  offerta?: {
    brand?: string;
    categoria?: string;
  };
  pianoCompenso?: {
    nome?: string;
  };
}

interface CreateContrattoPayload {
  idUtente: number;
  idOfferta: number;
  idPianoCompenso: number;
  dataFirma: string;
  importo: number;
  stato: StatoContratto;
}

// Helpers
const getStatoColor = (stato: StatoContratto): string => {
  switch (stato) {
    case 'in lavorazione':
      return '#FEF3C7'; // yellow-100
    case 'chiuso':
      return '#DCFCE7'; // green-100
    case 'annullato':
      return '#FEE2E2'; // red-100
    default:
      return colors.muted;
  }
};

const getStatoTextColor = (stato: StatoContratto): string => {
  switch (stato) {
    case 'in lavorazione':
      return '#92400E'; // yellow-800
    case 'chiuso':
      return '#166534'; // green-800
    case 'annullato':
      return '#991B1B'; // red-800
    default:
      return colors.foreground;
  }
};

const getStatoLabel = (stato: StatoContratto): string => {
  switch (stato) {
    case 'in lavorazione':
      return 'In Lavorazione';
    case 'chiuso':
      return 'Chiuso';
    case 'annullato':
      return 'Annullato';
    default:
      return stato;
  }
};

const formatImporto = (importo: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(importo);
};

const STATO_OPTIONS: { value: StatoContratto | 'all'; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'in lavorazione', label: 'In Lavorazione' },
  { value: 'chiuso', label: 'Chiuso' },
  { value: 'annullato', label: 'Annullato' },
];

export default function AdminContratti() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contratti, setContratti] = useState<Contratto[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statoFilter, setStatoFilter] = useState<StatoContratto | 'all'>('all');
  const [showStatoPicker, setShowStatoPicker] = useState(false);

  // Modals
  const [detailsContratto, setDetailsContratto] = useState<Contratto | null>(null);
  const [editingContratto, setEditingContratto] = useState<Contratto | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateContrattoPayload>({
    idUtente: 0,
    idOfferta: 0,
    idPianoCompenso: 0,
    dataFirma: new Date().toISOString().split('T')[0],
    importo: 0,
    stato: 'in lavorazione',
  });
  const [saving, setSaving] = useState(false);

  // Map ContrattoDto to local Contratto interface
  const mapContrattoDto = (c: ContrattoDto): Contratto => {
    // Map API stato to local stato
    const mapStato = (stato: string): StatoContratto => {
      switch (stato) {
        case 'attivato':
        case 'ok_inserimento':
          return 'chiuso';
        case 'annullato':
        case 'stornato':
          return 'annullato';
        default:
          return 'in lavorazione';
      }
    };

    return {
      id: c.id,
      idUtente: c.agente?.id || 0,
      idOfferta: c.offerta?.id || 0,
      idPianoCompenso: 0,
      dataFirma: c.tsFirmato || c.tsCreazione || new Date().toISOString(),
      importo: c.importoNetto || c.importoLordo || 0,
      stato: mapStato(c.stato),
      utente: {
        nomeCognome: c.agente?.nomeCognome || `${c.nome || ''} ${c.cognome || ''}`.trim(),
        email: c.agente?.email || c.email,
      },
      offerta: {
        brand: c.offerta?.nomeGestore || c.offerta?.nome || '',
        categoria: c.commodity || c.offerta?.categoria,
      },
      pianoCompenso: { nome: 'Standard' },
    };
  };

  // Load contratti
  const loadContratti = useCallback(async () => {
    try {
      // Fetch real data from API
      const response = await ContrattiAPI.list({
        size: 100,
        stato: statoFilter === 'chiuso' ? 'attivato' :
               statoFilter === 'annullato' ? 'annullato' :
               statoFilter === 'in lavorazione' ? 'lavorazione' : undefined,
      });

      // Map API response to local interface
      const mappedContratti = response.content.map(mapContrattoDto);
      setContratti(mappedContratti);
    } catch (error) {
      console.error('Error loading contratti:', error);
      Alert.alert('Errore', 'Impossibile caricare i contratti');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statoFilter]);

  useEffect(() => {
    loadContratti();
  }, [loadContratti]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadContratti();
  }, [loadContratti]);

  // Filtered contratti
  const filteredContratti = useMemo(() => {
    let filtered = contratti;

    if (statoFilter !== 'all') {
      filtered = filtered.filter((c) => c.stato === statoFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.utente?.nomeCognome?.toLowerCase().includes(term) ||
          c.utente?.email?.toLowerCase().includes(term) ||
          c.offerta?.brand?.toLowerCase().includes(term) ||
          String(c.id).includes(term)
      );
    }

    return filtered;
  }, [contratti, statoFilter, searchTerm]);

  // Handlers
  const openNewModal = () => {
    setFormData({
      idUtente: 0,
      idOfferta: 0,
      idPianoCompenso: 0,
      dataFirma: new Date().toISOString().split('T')[0],
      importo: 0,
      stato: 'in lavorazione',
    });
    setEditingContratto(null);
    setIsNewModalOpen(true);
  };

  const openEditModal = (contratto: Contratto) => {
    setFormData({
      idUtente: contratto.idUtente,
      idOfferta: contratto.idOfferta,
      idPianoCompenso: contratto.idPianoCompenso,
      dataFirma: contratto.dataFirma,
      importo: contratto.importo,
      stato: contratto.stato,
    });
    setEditingContratto(contratto);
    setIsNewModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.idUtente || !formData.idOfferta || !formData.idPianoCompenso) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }

    setSaving(true);
    try {
      // TODO: Call API
      // if (editingContratto) {
      //   await ContrattiAPI.update(editingContratto.id, formData);
      // } else {
      //   await ContrattiAPI.create(formData);
      // }

      console.log('Saving contratto:', formData);
      setIsNewModalOpen(false);
      loadContratti();
      Alert.alert('Successo', 'Contratto salvato con successo');
    } catch (error: any) {
      Alert.alert('Errore', error.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Conferma', 'Sei sicuro di voler annullare questo contratto?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Annulla Contratto',
        style: 'destructive',
        onPress: async () => {
          try {
            // TODO: await ContrattiAPI.delete(id);
            console.log('Deleting contratto:', id);
            loadContratti();
          } catch (error) {
            Alert.alert('Errore', 'Errore durante l\'annullamento');
          }
        },
      },
    ]);
  };

  const handleChangeStato = async (id: number, newStato: StatoContratto) => {
    try {
      // TODO: Call appropriate API endpoint
      console.log('Changing stato:', id, newStato);
      loadContratti();
      setDetailsContratto(null);
      Alert.alert('Successo', `Stato aggiornato a: ${getStatoLabel(newStato)}`);
    } catch (error) {
      Alert.alert('Errore', 'Errore durante l\'aggiornamento dello stato');
    }
  };

  // Access guard
  if (userRole !== ROLES.ADMIN && userRole !== ROLES.SUPERADMIN) {
    return <AccessDenied message="Solo gli amministratori possono accedere a questa pagina." />;
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
        <Text style={styles.loadingText}>Caricamento contratti...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestione Contratti</Text>
        <TouchableOpacity onPress={openNewModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filters */}
        <Card style={styles.filterCard}>
          <CardContent style={styles.filterContent}>
            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.mutedForeground} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cerca per ID, utente, offerta..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor={colors.mutedForeground}
              />
              {searchTerm ? (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Stato Filter */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Stato:</Text>
              <TouchableOpacity
                style={styles.filterSelect}
                onPress={() => setShowStatoPicker(true)}
              >
                <Text style={styles.filterSelectText}>
                  {STATO_OPTIONS.find((o) => o.value === statoFilter)?.label || 'Tutti'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterCount}>
              {filteredContratti.length} contratti trovati
            </Text>
          </CardContent>
        </Card>

        {/* Contratti List */}
        {filteredContratti.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Nessun contratto trovato</Text>
              <Text style={styles.emptyText}>
                Non ci sono contratti che corrispondono ai criteri di ricerca.
              </Text>
            </CardContent>
          </Card>
        ) : (
          filteredContratti.map((contratto) => (
            <Card key={contratto.id} style={styles.contrattoCard}>
              <CardContent style={styles.contrattoContent}>
                {/* Header Row */}
                <View style={styles.contrattoHeader}>
                  <View style={styles.contrattoIdRow}>
                    <Ionicons name="document-text" size={20} color={SEMPLISWITCH_COLORS.blue} />
                    <Text style={styles.contrattoId}>#{contratto.id}</Text>
                  </View>
                  <View
                    style={[
                      styles.statoBadge,
                      { backgroundColor: getStatoColor(contratto.stato) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statoBadgeText,
                        { color: getStatoTextColor(contratto.stato) },
                      ]}
                    >
                      {getStatoLabel(contratto.stato)}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.contrattoDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color={colors.mutedForeground} />
                    <Text style={styles.detailText}>
                      {contratto.utente?.nomeCognome || `Utente #${contratto.idUtente}`}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="briefcase-outline" size={16} color={colors.mutedForeground} />
                    <Text style={styles.detailText}>
                      {contratto.offerta?.brand || `Offerta #${contratto.idOfferta}`}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.mutedForeground} />
                    <Text style={styles.detailText}>
                      {new Date(contratto.dataFirma).toLocaleDateString('it-IT')}
                    </Text>
                  </View>
                </View>

                {/* Importo */}
                <View style={styles.importoContainer}>
                  <Text style={styles.importoLabel}>Importo</Text>
                  <Text style={styles.importoValue}>{formatImporto(contratto.importo)}</Text>
                </View>

                {/* Actions */}
                <View style={styles.contrattoActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setDetailsContratto(contratto)}
                  >
                    <Ionicons name="eye-outline" size={18} color={SEMPLISWITCH_COLORS.blue} />
                    <Text style={[styles.actionButtonText, { color: SEMPLISWITCH_COLORS.blue }]}>
                      Dettagli
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(contratto)}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.foreground} />
                    <Text style={styles.actionButtonText}>Modifica</Text>
                  </TouchableOpacity>
                  {contratto.stato !== 'annullato' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(contratto.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                      <Text style={[styles.actionButtonText, { color: colors.destructive }]}>
                        Annulla
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={!!detailsContratto}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailsContratto(null)}
      >
        {detailsContratto && (
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDetailsContratto(null)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Contratto #{detailsContratto.id}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              {/* Status Badge */}
              <View style={styles.detailsStatusContainer}>
                <View
                  style={[
                    styles.statoBadgeLarge,
                    { backgroundColor: getStatoColor(detailsContratto.stato) },
                  ]}
                >
                  <Ionicons
                    name={
                      detailsContratto.stato === 'chiuso'
                        ? 'checkmark-circle'
                        : detailsContratto.stato === 'annullato'
                        ? 'close-circle'
                        : 'time'
                    }
                    size={20}
                    color={getStatoTextColor(detailsContratto.stato)}
                  />
                  <Text
                    style={[
                      styles.statoBadgeTextLarge,
                      { color: getStatoTextColor(detailsContratto.stato) },
                    ]}
                  >
                    {getStatoLabel(detailsContratto.stato)}
                  </Text>
                </View>
              </View>

              {/* Details Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Utente</Text>
                  <Text style={styles.detailsValue}>
                    {detailsContratto.utente?.nomeCognome || `ID: ${detailsContratto.idUtente}`}
                  </Text>
                  {detailsContratto.utente?.email && (
                    <Text style={styles.detailsSubtext}>{detailsContratto.utente.email}</Text>
                  )}
                </View>

                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Offerta</Text>
                  <Text style={styles.detailsValue}>
                    {detailsContratto.offerta?.brand || `ID: ${detailsContratto.idOfferta}`}
                  </Text>
                  {detailsContratto.offerta?.categoria && (
                    <Text style={styles.detailsSubtext}>{detailsContratto.offerta.categoria}</Text>
                  )}
                </View>

                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Piano Compenso</Text>
                  <Text style={styles.detailsValue}>
                    {detailsContratto.pianoCompenso?.nome || `ID: ${detailsContratto.idPianoCompenso}`}
                  </Text>
                </View>

                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Data Firma</Text>
                  <Text style={styles.detailsValue}>
                    {new Date(detailsContratto.dataFirma).toLocaleDateString('it-IT')}
                  </Text>
                </View>

                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Importo</Text>
                  <Text style={[styles.detailsValue, styles.importoHighlight]}>
                    {formatImporto(detailsContratto.importo)}
                  </Text>
                </View>
              </View>

              {/* Change Status Actions */}
              {detailsContratto.stato !== 'annullato' && (
                <View style={styles.statusActions}>
                  <Text style={styles.statusActionsTitle}>Cambia Stato</Text>
                  <View style={styles.statusButtonsRow}>
                    {detailsContratto.stato !== 'in lavorazione' && (
                      <TouchableOpacity
                        style={[styles.statusButton, styles.statusButtonOutline]}
                        onPress={() => handleChangeStato(detailsContratto.id, 'in lavorazione')}
                      >
                        <Ionicons name="time-outline" size={18} color={colors.foreground} />
                        <Text style={styles.statusButtonText}>In Lavorazione</Text>
                      </TouchableOpacity>
                    )}
                    {detailsContratto.stato !== 'chiuso' && (
                      <TouchableOpacity
                        style={[styles.statusButton, styles.statusButtonSuccess]}
                        onPress={() => handleChangeStato(detailsContratto.id, 'chiuso')}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
                        <Text style={[styles.statusButtonText, { color: colors.white }]}>Chiudi</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.statusButton, styles.statusButtonDanger]}
                      onPress={() => handleChangeStato(detailsContratto.id, 'annullato')}
                    >
                      <Ionicons name="close-circle-outline" size={18} color={colors.white} />
                      <Text style={[styles.statusButtonText, { color: colors.white }]}>Annulla</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        visible={isNewModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsNewModalOpen(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsNewModalOpen(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingContratto ? `Modifica #${editingContratto.id}` : 'Nuovo Contratto'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>ID Utente *</Text>
              <TextInput
                style={styles.formInput}
                value={String(formData.idUtente || '')}
                onChangeText={(v) => setFormData({ ...formData, idUtente: parseInt(v) || 0 })}
                keyboardType="numeric"
                placeholder="ID del consulente o cliente"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>ID Offerta *</Text>
              <TextInput
                style={styles.formInput}
                value={String(formData.idOfferta || '')}
                onChangeText={(v) => setFormData({ ...formData, idOfferta: parseInt(v) || 0 })}
                keyboardType="numeric"
                placeholder="ID dell'offerta"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>ID Piano Compenso *</Text>
              <TextInput
                style={styles.formInput}
                value={String(formData.idPianoCompenso || '')}
                onChangeText={(v) => setFormData({ ...formData, idPianoCompenso: parseInt(v) || 0 })}
                keyboardType="numeric"
                placeholder="ID del piano compenso"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Data Firma *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.dataFirma}
                onChangeText={(v) => setFormData({ ...formData, dataFirma: v })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Importo (€) *</Text>
              <TextInput
                style={styles.formInput}
                value={String(formData.importo || '')}
                onChangeText={(v) => setFormData({ ...formData, importo: parseFloat(v) || 0 })}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Stato *</Text>
              <View style={styles.statoButtons}>
                {STATO_OPTIONS.filter((o) => o.value !== 'all').map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.statoButton,
                      formData.stato === opt.value && styles.statoButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, stato: opt.value as StatoContratto })}
                  >
                    <Text
                      style={[
                        styles.statoButtonText,
                        formData.stato === opt.value && styles.statoButtonTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + spacing[4] }]}>
            <Button
              variant="outline"
              onPress={() => setIsNewModalOpen(false)}
              style={styles.modalButton}
            >
              Annulla
            </Button>
            <Button
              variant="default"
              onPress={handleSave}
              disabled={saving}
              style={[styles.modalButton, styles.modalButtonPrimary]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <View style={styles.saveButtonContent}>
                  <Ionicons name="save-outline" size={18} color={colors.white} />
                  <Text style={styles.saveButtonText}>Salva</Text>
                </View>
              )}
            </Button>
          </View>
        </View>
      </Modal>

      {/* Stato Picker Modal */}
      <Modal
        visible={showStatoPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowStatoPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowStatoPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Filtra per Stato</Text>
            {STATO_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.pickerItem}
                onPress={() => {
                  setStatoFilter(opt.value);
                  setShowStatoPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{opt.label}</Text>
                {statoFilter === opt.value && (
                  <Ionicons name="checkmark" size={20} color={SEMPLISWITCH_COLORS.magenta} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  addButton: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderRadius: borderRadius.full,
    padding: spacing[2],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  filterCard: {
    marginBottom: spacing[2],
  },
  filterContent: {
    gap: spacing[3],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  filterLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  filterSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  filterSelectText: {
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  filterCount: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  emptyCard: {},
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
    marginTop: spacing[4],
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  contrattoCard: {
    marginBottom: spacing[3],
  },
  contrattoContent: {
    gap: spacing[3],
  },
  contrattoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contrattoIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  contrattoId: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  statoBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  statoBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
  },
  contrattoDetails: {
    gap: spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  detailText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  importoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.muted,
    padding: spacing[3],
    borderRadius: borderRadius.md,
  },
  importoLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  importoValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.magenta,
  },
  contrattoActions: {
    flexDirection: 'row',
    gap: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  actionButtonText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  // Modal styles
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
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  detailsStatusContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  statoBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  statoBadgeTextLarge: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
  },
  detailsGrid: {
    gap: spacing[4],
  },
  detailsItem: {
    gap: spacing[1],
  },
  detailsLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  detailsValue: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  detailsSubtext: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  importoHighlight: {
    fontSize: fontSizes.xl,
    color: SEMPLISWITCH_COLORS.magenta,
    fontWeight: fontWeights.bold as any,
  },
  statusActions: {
    marginTop: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusActionsTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
    marginBottom: spacing[3],
  },
  statusButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  statusButtonOutline: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusButtonSuccess: {
    backgroundColor: '#16A34A',
  },
  statusButtonDanger: {
    backgroundColor: colors.destructive,
  },
  statusButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  formGroup: {
    gap: spacing[1],
  },
  formLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  formInput: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  statoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  statoButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  statoButtonSelected: {
    borderColor: SEMPLISWITCH_COLORS.magenta,
    backgroundColor: '#FDF2F8',
  },
  statoButtonText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  statoButtonTextSelected: {
    color: SEMPLISWITCH_COLORS.magenta,
    fontWeight: fontWeights.medium as any,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
  },
  modalButtonPrimary: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
  },
  // Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    width: '80%',
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
});
