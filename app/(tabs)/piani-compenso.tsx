/**
 * PianiCompenso - Gestione Piani Compenso (ADMIN) - React Native
 * Lista piani con editor modale per create/update
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AccessDenied } from '../../components/navigation/AccessDenied';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import { PianiCompensoAPI, PianoCompensoDto } from '../../lib/api';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#1d4ed8',
  green: '#22C55E',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
};

// Tipi
interface PianoCompenso {
  id: number;
  nome: string;
  descrizione?: string;
  attivo: boolean;
  dataInizio?: string;
  dataFine?: string;
  gestore?: string;
  gestoreId?: number;
  categoria?: string;
  dettagli?: DettaglioPiano[];
  createdAt?: string;
  updatedAt?: string;
}

interface DettaglioPiano {
  id?: number;
  tipoOperazione: string;
  commodity?: string;
  importoFisso?: number;
  percentuale?: number;
  bonusQualita?: number;
  note?: string;
}

interface Gestore {
  id: number;
  nome: string;
  categoria?: string;
  attivo?: boolean;
}

// Default gestori list (will be loaded from API in future)
const DEFAULT_GESTORI: Gestore[] = [
  { id: 1, nome: 'Enel', categoria: 'energia', attivo: true },
  { id: 2, nome: 'Eni', categoria: 'energia', attivo: true },
  { id: 3, nome: 'Tim', categoria: 'telco', attivo: true },
  { id: 4, nome: 'Edison', categoria: 'energia', attivo: true },
  { id: 5, nome: 'Vodafone', categoria: 'telco', attivo: true },
  { id: 6, nome: 'A2A', categoria: 'energia', attivo: true },
  { id: 7, nome: 'Illumia', categoria: 'energia', attivo: true },
];

// Componente Card Piano
function PianoCard({
  piano,
  onEdit,
  onToggleAttivo,
}: {
  piano: PianoCompenso;
  onEdit: () => void;
  onToggleAttivo: () => void;
}) {
  return (
    <Card style={[styles.pianoCard, !piano.attivo && styles.pianoCardInactive]}>
      <CardContent style={styles.pianoContent}>
        <View style={styles.pianoHeader}>
          <View style={styles.pianoTitleContainer}>
            <Text style={styles.pianoNome}>{piano.nome}</Text>
            <Badge
              variant={piano.attivo ? 'default' : 'secondary'}
              style={piano.attivo ? styles.badgeAttivo : styles.badgeInattivo}
            >
              <Text style={styles.badgeText}>
                {piano.attivo ? 'Attivo' : 'Disattivato'}
              </Text>
            </Badge>
          </View>
          {piano.gestore && (
            <Text style={styles.pianoGestore}>{piano.gestore}</Text>
          )}
        </View>

        {piano.descrizione && (
          <Text style={styles.pianoDescrizione} numberOfLines={2}>
            {piano.descrizione}
          </Text>
        )}

        {/* Dettagli compensi */}
        {piano.dettagli && piano.dettagli.length > 0 && (
          <View style={styles.dettagliContainer}>
            {piano.dettagli.slice(0, 3).map((det, index) => (
              <View key={index} style={styles.dettaglioItem}>
                <Text style={styles.dettaglioOperazione}>
                  {formatOperazione(det.tipoOperazione)}
                  {det.commodity && ` (${det.commodity})`}
                </Text>
                <Text style={styles.dettaglioImporto}>
                  {det.importoFisso ? `€${det.importoFisso}` : ''}
                  {det.importoFisso && det.percentuale ? ' + ' : ''}
                  {det.percentuale ? `${det.percentuale}%` : ''}
                </Text>
              </View>
            ))}
            {piano.dettagli.length > 3 && (
              <Text style={styles.dettagliMore}>
                +{piano.dettagli.length - 3} altri...
              </Text>
            )}
          </View>
        )}

        {/* Azioni */}
        <View style={styles.pianoActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onToggleAttivo}
          >
            <Ionicons
              name={piano.attivo ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20}
              color={piano.attivo ? SEMPLISWITCH_COLORS.orange : SEMPLISWITCH_COLORS.green}
            />
            <Text style={[styles.actionText, { color: piano.attivo ? SEMPLISWITCH_COLORS.orange : SEMPLISWITCH_COLORS.green }]}>
              {piano.attivo ? 'Disattiva' : 'Attiva'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
          >
            <Ionicons name="create-outline" size={20} color={SEMPLISWITCH_COLORS.blue} />
            <Text style={[styles.actionText, { color: SEMPLISWITCH_COLORS.blue }]}>Modifica</Text>
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );
}

// Componente Editor Piano (Modal)
function PianoEditor({
  visible,
  onClose,
  onSave,
  piano,
  gestori,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (piano: Partial<PianoCompenso>) => void;
  piano: PianoCompenso | null;
  gestori: Gestore[];
}) {
  const [nome, setNome] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [gestoreId, setGestoreId] = useState<number | null>(null);
  const [attivo, setAttivo] = useState(true);
  const [dettagli, setDettagli] = useState<DettaglioPiano[]>([]);
  const [showGestoreSelect, setShowGestoreSelect] = useState(false);
  const [saving, setSaving] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (piano) {
      setNome(piano.nome || '');
      setDescrizione(piano.descrizione || '');
      setGestoreId(piano.gestoreId || null);
      setAttivo(piano.attivo ?? true);
      setDettagli(piano.dettagli || []);
    } else {
      setNome('');
      setDescrizione('');
      setGestoreId(null);
      setAttivo(true);
      setDettagli([]);
    }
  }, [piano, visible]);

  const selectedGestore = gestori.find(g => g.id === gestoreId);

  const addDettaglio = () => {
    setDettagli([...dettagli, {
      tipoOperazione: 'switch',
      commodity: 'luce',
      importoFisso: 0,
      percentuale: 0,
    }]);
  };

  const updateDettaglio = (index: number, field: keyof DettaglioPiano, value: any) => {
    const updated = [...dettagli];
    updated[index] = { ...updated[index], [field]: value };
    setDettagli(updated);
  };

  const removeDettaglio = (index: number) => {
    setDettagli(dettagli.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Errore', 'Il nome del piano è obbligatorio');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: piano?.id,
        nome,
        descrizione,
        gestoreId: gestoreId || undefined,
        gestore: selectedGestore?.nome,
        attivo,
        dettagli,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalHeader, { paddingTop: insets.top + spacing[2] }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {piano ? 'Modifica Piano' : 'Nuovo Piano'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={SEMPLISWITCH_COLORS.magenta} />
            ) : (
              <Text style={styles.modalSaveText}>Salva</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          {/* Nome */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nome Piano *</Text>
            <TextInput
              style={styles.formInput}
              value={nome}
              onChangeText={setNome}
              placeholder="Es. Piano Standard Luce"
            />
          </View>

          {/* Descrizione */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Descrizione</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea]}
              value={descrizione}
              onChangeText={setDescrizione}
              placeholder="Descrizione del piano compenso"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Gestore */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Gestore</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowGestoreSelect(true)}
            >
              <Text style={selectedGestore ? styles.selectValue : styles.selectPlaceholder}>
                {selectedGestore?.nome || 'Seleziona gestore...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Stato Attivo */}
          <View style={styles.formGroup}>
            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => setAttivo(!attivo)}
            >
              <Text style={styles.formLabel}>Piano Attivo</Text>
              <View style={[styles.switch, attivo && styles.switchActive]}>
                <View style={[styles.switchThumb, attivo && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Dettagli Compensi */}
          <View style={styles.formGroup}>
            <View style={styles.dettagliHeader}>
              <Text style={styles.formLabel}>Dettagli Compensi</Text>
              <TouchableOpacity style={styles.addDettaglioButton} onPress={addDettaglio}>
                <Ionicons name="add-circle" size={24} color={SEMPLISWITCH_COLORS.magenta} />
              </TouchableOpacity>
            </View>

            {dettagli.map((det, index) => (
              <View key={index} style={styles.dettaglioForm}>
                <View style={styles.dettaglioFormHeader}>
                  <Text style={styles.dettaglioFormTitle}>Dettaglio #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeDettaglio(index)}>
                    <Ionicons name="trash-outline" size={20} color={SEMPLISWITCH_COLORS.red} />
                  </TouchableOpacity>
                </View>

                {/* Tipo Operazione */}
                <View style={styles.formRow}>
                  <View style={styles.formRowHalf}>
                    <Text style={styles.formLabelSmall}>Operazione</Text>
                    <View style={styles.operazioneButtons}>
                      {['switch', 'subentro', 'voltura'].map(op => (
                        <TouchableOpacity
                          key={op}
                          style={[
                            styles.operazioneButton,
                            det.tipoOperazione === op && styles.operazioneButtonActive
                          ]}
                          onPress={() => updateDettaglio(index, 'tipoOperazione', op)}
                        >
                          <Text style={[
                            styles.operazioneButtonText,
                            det.tipoOperazione === op && styles.operazioneButtonTextActive
                          ]}>
                            {op.charAt(0).toUpperCase() + op.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Importi */}
                <View style={styles.formRow}>
                  <View style={styles.formRowHalf}>
                    <Text style={styles.formLabelSmall}>Importo Fisso (€)</Text>
                    <TextInput
                      style={styles.formInputSmall}
                      value={det.importoFisso?.toString() || ''}
                      onChangeText={(v) => updateDettaglio(index, 'importoFisso', parseFloat(v) || 0)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.formRowHalf}>
                    <Text style={styles.formLabelSmall}>Percentuale (%)</Text>
                    <TextInput
                      style={styles.formInputSmall}
                      value={det.percentuale?.toString() || ''}
                      onChangeText={(v) => updateDettaglio(index, 'percentuale', parseFloat(v) || 0)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                </View>
              </View>
            ))}

            {dettagli.length === 0 && (
              <View style={styles.emptyDettagli}>
                <Text style={styles.emptyDettagliText}>
                  Nessun dettaglio compenso. Premi + per aggiungerne uno.
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Modal selezione gestore */}
        <Modal
          visible={showGestoreSelect}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowGestoreSelect(false)}
        >
          <View style={[styles.selectModal, { paddingTop: insets.top }]}>
            <View style={styles.selectModalHeader}>
              <Text style={styles.selectModalTitle}>Seleziona Gestore</Text>
              <TouchableOpacity onPress={() => setShowGestoreSelect(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={gestori}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectOption,
                    gestoreId === item.id && styles.selectOptionActive
                  ]}
                  onPress={() => {
                    setGestoreId(item.id);
                    setShowGestoreSelect(false);
                  }}
                >
                  <Text style={[
                    styles.selectOptionText,
                    gestoreId === item.id && styles.selectOptionTextActive
                  ]}>
                    {item.nome}
                  </Text>
                  {item.categoria && (
                    <Badge variant="outline" style={styles.gestoreBadge}>
                      <Text style={styles.gestoreBadgeText}>{item.categoria}</Text>
                    </Badge>
                  )}
                  {gestoreId === item.id && (
                    <Ionicons name="checkmark" size={20} color={SEMPLISWITCH_COLORS.magenta} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Helper function
function formatOperazione(op: string): string {
  const map: Record<string, string> = {
    switch: 'Switch',
    subentro: 'Subentro',
    voltura: 'Voltura',
    switch_con_voltura: 'Switch+Voltura',
    prima_attivazione: 'Prima Att.',
    nuova_linea: 'Nuova Linea',
    portabilita: 'Portabilità',
  };
  return map[op] || op;
}

// Map PianoCompensoDto to local PianoCompenso interface
const mapPianoDto = (dto: PianoCompensoDto): PianoCompenso => ({
  id: dto.id,
  nome: dto.nome,
  descrizione: undefined,
  attivo: dto.attivo,
  dataInizio: dto.dal,
  dataFine: dto.al,
  dettagli: (dto.dettagli || []).map(d => ({
    tipoOperazione: d.prodotto || 'switch',
    importoFisso: d.importo,
    percentuale: 0,
    note: d.descr || undefined,
  })),
});

// Main component
export default function PianiCompenso() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole, user } = useAuth();

  const [piani, setPiani] = useState<PianoCompenso[]>([]);
  const [gestori, setGestori] = useState<Gestore[]>(DEFAULT_GESTORI);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterAttivi, setFilterAttivi] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedPiano, setSelectedPiano] = useState<PianoCompenso | null>(null);

  const [showFilterModal, setShowFilterModal] = useState(false);

  // Access guard - solo admin/superadmin
  const isAdmin = userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN;
  if (!isAdmin) {
    return <AccessDenied message="Accesso negato - sezione riservata agli amministratori." />;
  }

  // Filter piani
  const pianiFiltrati = piani.filter(p => {
    // Filtro stato
    if (filterAttivi === 'active' && !p.attivo) return false;
    if (filterAttivi === 'inactive' && p.attivo) return false;

    // Filtro ricerca
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      if (!p.nome.toLowerCase().includes(search) &&
          !p.gestore?.toLowerCase().includes(search)) {
        return false;
      }
    }

    return true;
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch real data from API
      const attivi = filterAttivi === 'active' ? true :
                     filterAttivi === 'inactive' ? false : undefined;
      const data = await PianiCompensoAPI.list(attivi);
      setPiani(data.map(mapPianoDto));
    } catch (error) {
      console.error('Error loading piani compenso:', error);
      Alert.alert('Errore', 'Impossibile caricare i piani compenso');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterAttivi]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handlers
  const handleCreate = () => {
    setSelectedPiano(null);
    setEditorVisible(true);
  };

  const handleEdit = (piano: PianoCompenso) => {
    setSelectedPiano(piano);
    setEditorVisible(true);
  };

  const handleSave = async (pianoData: Partial<PianoCompenso>) => {
    // In produzione: chiamata API
    if (pianoData.id) {
      // Update
      setPiani(prev => prev.map(p => p.id === pianoData.id ? { ...p, ...pianoData } as PianoCompenso : p));
    } else {
      // Create
      const newPiano: PianoCompenso = {
        ...pianoData,
        id: Date.now(),
        attivo: pianoData.attivo ?? true,
      } as PianoCompenso;
      setPiani(prev => [newPiano, ...prev]);
    }

    setEditorVisible(false);
    setSelectedPiano(null);
    Alert.alert('Successo', pianoData.id ? 'Piano aggiornato' : 'Piano creato');
  };

  const handleToggleAttivo = (piano: PianoCompenso) => {
    Alert.alert(
      piano.attivo ? 'Disattiva Piano' : 'Attiva Piano',
      `Vuoi ${piano.attivo ? 'disattivare' : 'attivare'} il piano "${piano.nome}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: piano.attivo ? 'Disattiva' : 'Attiva',
          style: piano.attivo ? 'destructive' : 'default',
          onPress: () => {
            setPiani(prev => prev.map(p =>
              p.id === piano.id ? { ...p, attivo: !p.attivo } : p
            ));
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Piani Compenso</Text>
          <Text style={styles.headerSubtitle}>
            Gestisci i piani compenso per i tuoi agenti
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search & Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca piano o gestore..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filterAttivi === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterAttivi('all')}
          >
            <Text style={[styles.filterButtonText, filterAttivi === 'all' && styles.filterButtonTextActive]}>
              Tutti
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterAttivi === 'active' && styles.filterButtonActive]}
            onPress={() => setFilterAttivi('active')}
          >
            <Text style={[styles.filterButtonText, filterAttivi === 'active' && styles.filterButtonTextActive]}>
              Attivi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterAttivi === 'inactive' && styles.filterButtonActive]}
            onPress={() => setFilterAttivi('inactive')}
          >
            <Text style={[styles.filterButtonText, filterAttivi === 'inactive' && styles.filterButtonTextActive]}>
              Disattivati
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.resultCount}>{pianiFiltrati.length} piani trovati</Text>
      </View>

      {/* Lista Piani */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
        </View>
      ) : (
        <FlatList
          data={pianiFiltrati}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PianoCard
              piano={item}
              onEdit={() => handleEdit(item)}
              onToggleAttivo={() => handleToggleAttivo(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>Nessun piano trovato</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreate}>
                <Text style={styles.emptyButtonText}>Crea il primo piano</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Editor Modal */}
      <PianoEditor
        visible={editorVisible}
        onClose={() => {
          setEditorVisible(false);
          setSelectedPiano(null);
        }}
        onSave={handleSave}
        piano={selectedPiano}
        gestori={gestori}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    marginBottom: spacing[3],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: fontSizes.base,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  filterButton: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterButtonActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  filterButtonText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  resultCount: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing[4],
  },
  pianoCard: {
    marginBottom: spacing[3],
  },
  pianoCardInactive: {
    opacity: 0.7,
  },
  pianoContent: {
    padding: spacing[4],
  },
  pianoHeader: {
    marginBottom: spacing[2],
  },
  pianoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  pianoNome: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
    flex: 1,
  },
  badgeAttivo: {
    backgroundColor: `${SEMPLISWITCH_COLORS.green}20`,
  },
  badgeInattivo: {
    backgroundColor: colors.muted,
  },
  badgeText: {
    fontSize: 10,
  },
  pianoGestore: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  pianoDescrizione: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[3],
  },
  dettagliContainer: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  dettaglioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[1],
  },
  dettaglioOperazione: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  dettaglioImporto: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold as any,
    color: SEMPLISWITCH_COLORS.green,
  },
  dettagliMore: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
  pianoActions: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  actionText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
    marginTop: spacing[3],
    marginBottom: spacing[4],
  },
  emptyButton: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: fontWeights.medium as any,
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
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    padding: spacing[2],
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  modalSaveButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: SEMPLISWITCH_COLORS.magenta,
  },
  modalContent: {
    flex: 1,
    padding: spacing[4],
  },
  formGroup: {
    marginBottom: spacing[4],
  },
  formLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  formLabelSmall: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    backgroundColor: colors.background,
  },
  formInputSmall: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    fontSize: fontSizes.sm,
    backgroundColor: colors.background,
  },
  formTextarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.background,
  },
  selectValue: {
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  selectPlaceholder: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.muted,
    padding: 2,
  },
  switchActive: {
    backgroundColor: SEMPLISWITCH_COLORS.green,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  dettagliHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  addDettaglioButton: {
    padding: spacing[1],
  },
  dettaglioForm: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  dettaglioFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  dettaglioFormTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  formRowHalf: {
    flex: 1,
  },
  operazioneButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  operazioneButton: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  operazioneButtonActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  operazioneButtonText: {
    fontSize: fontSizes.xs,
    color: colors.foreground,
  },
  operazioneButtonTextActive: {
    color: '#fff',
  },
  emptyDettagli: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    alignItems: 'center',
  },
  emptyDettagliText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  // Select modal
  selectModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selectModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectModalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectOptionActive: {
    backgroundColor: `${SEMPLISWITCH_COLORS.magenta}10`,
  },
  selectOptionText: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  selectOptionTextActive: {
    color: SEMPLISWITCH_COLORS.magenta,
    fontWeight: fontWeights.medium as any,
  },
  gestoreBadge: {
    marginRight: spacing[2],
  },
  gestoreBadgeText: {
    fontSize: 10,
  },
});
