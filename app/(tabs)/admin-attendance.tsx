/**
 * AdminAttendance - Gestione presenze backoffice
 * Pagina admin per gestire le presenze del personale backoffice
 * Stile Sempliswitch
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#1d4ed8',
};

// Types
export type PresenzaTipo = 'presenza' | 'assenza' | 'permesso' | 'ferie' | 'malattia';

interface PresenzaDoc {
  id: string;
  userId: string;
  nome: string;
  ruoloUtente: string;
  data: string; // ISO date string
  checkIn: string | null;
  checkOut: string | null;
  checkIn2?: string | null;
  checkOut2?: string | null;
  note: string;
  tipo: PresenzaTipo;
  origine?: string;
}

interface UtenteDoc {
  id: string;
  uid: string;
  nome: string;
  cognome?: string;
  fullName?: string;
  ruolo: string;
  attivo?: boolean;
}

type RangeMode = 'month' | 'custom';

// Helpers
function toMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT');
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  const d = new Date(timeStr);
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function formatTimePair(a?: string | null, b?: string | null): string {
  const t1 = a ? formatTime(a) : '';
  const t2 = b ? formatTime(b) : '';
  if (t1 && t2) return `${t1} - ${t2}`;
  return t1 || t2 || '-';
}

function calcDurata(p: PresenzaDoc): number {
  if (p.tipo !== 'presenza') return 0;
  let hours = 0;
  if (p.checkIn && p.checkOut) {
    const diff = new Date(p.checkOut).getTime() - new Date(p.checkIn).getTime();
    hours += Math.max(0, diff / 3600000);
  }
  if (p.checkIn2 && p.checkOut2) {
    const diff2 = new Date(p.checkOut2).getTime() - new Date(p.checkIn2).getTime();
    hours += Math.max(0, diff2 / 3600000);
  }
  return Math.round(hours * 100) / 100;
}

const TIPO_OPTIONS: { value: PresenzaTipo; label: string }[] = [
  { value: 'presenza', label: 'Presenza' },
  { value: 'assenza', label: 'Assenza' },
  { value: 'permesso', label: 'Permesso' },
  { value: 'ferie', label: 'Ferie' },
  { value: 'malattia', label: 'Malattia' },
];

const PAGE_SIZE = 10;

export default function AdminAttendance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [presenze, setPresenze] = useState<PresenzaDoc[]>([]);
  const [utenti, setUtenti] = useState<UtenteDoc[]>([]);

  // Filters
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [rangeMode, setRangeMode] = useState<RangeMode>('month');
  const [monthValue, setMonthValue] = useState(defaultMonth);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formUserId, setFormUserId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTipo, setFormTipo] = useState<PresenzaTipo>('presenza');
  const [formCheckIn, setFormCheckIn] = useState('');
  const [formCheckOut, setFormCheckOut] = useState('');
  const [formCheckIn2, setFormCheckIn2] = useState('');
  const [formCheckOut2, setFormCheckOut2] = useState('');
  const [formNote, setFormNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter dropdown states
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showTipoPicker, setShowTipoPicker] = useState(false);

  // Calculate date range
  const { start, end } = useMemo(() => {
    if (rangeMode === 'month') {
      const parts = (monthValue || '').split('-');
      const y = Number(parts[0]) || now.getFullYear();
      const m = Number(parts[1]) || now.getMonth() + 1;
      const s = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const e = new Date(y, m, 1, 0, 0, 0, 0);
      return { start: s, end: e };
    }
    return { start: toMidnight(now), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  }, [rangeMode, monthValue]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      // TODO: Replace with actual API calls
      // const utentiRes = await PresenzeAPI.getUtentiBackoffice();
      // const presenzeRes = await PresenzeAPI.getPresenze({ start, end, userFilter });

      // Mock data for now
      setUtenti([
        { id: '1', uid: '1', nome: 'Mario Rossi', ruolo: 'backoffice', attivo: true },
        { id: '2', uid: '2', nome: 'Anna Verdi', ruolo: 'backoffice', attivo: true },
      ]);

      setPresenze([
        {
          id: '1',
          userId: '1',
          nome: 'Mario Rossi',
          ruoloUtente: 'backoffice',
          data: new Date().toISOString(),
          checkIn: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
          checkOut: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0).toISOString(),
          checkIn2: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString(),
          checkOut2: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0).toISOString(),
          note: '',
          tipo: 'presenza',
        },
      ]);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [start, end, userFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Calculate totals
  const totals = useMemo(() => {
    let ore = 0;
    const giorni = new Set<string>();
    let assenze = 0,
      permessi = 0,
      ferie = 0,
      malattia = 0;

    for (const p of presenze) {
      if (p.tipo === 'presenza') {
        ore += calcDurata(p);
        giorni.add(new Date(p.data).toISOString().slice(0, 10));
      } else if (p.tipo === 'assenza') assenze++;
      else if (p.tipo === 'permesso') permessi++;
      else if (p.tipo === 'ferie') ferie++;
      else if (p.tipo === 'malattia') malattia++;
    }

    return {
      ore: Math.round(ore * 100) / 100,
      giorni: giorni.size,
      assenze,
      permessi,
      ferie,
      malattia,
    };
  }, [presenze]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(presenze.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const startIdx = (page - 1) * PAGE_SIZE;
    return presenze.slice(startIdx, startIdx + PAGE_SIZE);
  }, [presenze, page]);

  // Modal handlers
  const openCreate = () => {
    setEditId(null);
    setFormUserId('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTipo('presenza');
    setFormCheckIn('');
    setFormCheckOut('');
    setFormCheckIn2('');
    setFormCheckOut2('');
    setFormNote('');
    setModalVisible(true);
  };

  const openEdit = (p: PresenzaDoc) => {
    setEditId(p.id);
    setFormUserId(p.userId);
    setFormDate(new Date(p.data).toISOString().slice(0, 10));
    setFormTipo(p.tipo);
    setFormCheckIn(p.checkIn ? new Date(p.checkIn).toISOString().slice(11, 16) : '');
    setFormCheckOut(p.checkOut ? new Date(p.checkOut).toISOString().slice(11, 16) : '');
    setFormCheckIn2(p.checkIn2 ? new Date(p.checkIn2).toISOString().slice(11, 16) : '');
    setFormCheckOut2(p.checkOut2 ? new Date(p.checkOut2).toISOString().slice(11, 16) : '');
    setFormNote(p.note || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formUserId) {
      Alert.alert('Errore', 'Seleziona un utente');
      return;
    }
    if (!formDate) {
      Alert.alert('Errore', 'Inserisci una data');
      return;
    }

    setSaving(true);
    try {
      // TODO: Call API to save
      // await PresenzeAPI.save({ ... });
      console.log('Saving presence:', {
        editId,
        formUserId,
        formDate,
        formTipo,
        formCheckIn,
        formCheckOut,
        formNote,
      });

      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Errore', error.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Conferma', 'Eliminare questa presenza?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          try {
            // TODO: Call API to delete
            // await PresenzeAPI.delete(id);
            console.log('Deleting presence:', id);
            fetchData();
          } catch (error) {
            Alert.alert('Errore', 'Errore durante l\'eliminazione');
          }
        },
      },
    ]);
  };

  // Access guard
  if (userRole !== ROLES.ADMIN) {
    return <AccessDenied message="Solo gli amministratori possono accedere a questa pagina." />;
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
        <Text style={styles.loadingText}>Caricamento presenze...</Text>
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
        <Text style={styles.headerTitle}>Gestione Presenze</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addButton}>
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
            <View style={styles.filterRow}>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Mese</Text>
                <TextInput
                  style={styles.filterInput}
                  value={monthValue}
                  onChangeText={setMonthValue}
                  placeholder="YYYY-MM"
                />
              </View>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Utente</Text>
                <TouchableOpacity
                  style={styles.filterSelect}
                  onPress={() => setShowUserPicker(true)}
                >
                  <Text style={styles.filterSelectText}>
                    {userFilter === 'all'
                      ? 'Tutti'
                      : utenti.find((u) => u.id === userFilter)?.nome || 'Seleziona'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>
            <Button variant="default" onPress={fetchData} style={styles.filterButton}>
              <Text style={styles.filterButtonText}>Applica Filtri</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <CardContent style={styles.summaryContent}>
              <Ionicons name="time-outline" size={24} color={SEMPLISWITCH_COLORS.magenta} />
              <Text style={styles.summaryValue}>{totals.ore.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Ore totali</Text>
            </CardContent>
          </Card>
          <Card style={styles.summaryCard}>
            <CardContent style={styles.summaryContent}>
              <Ionicons name="calendar-outline" size={24} color={SEMPLISWITCH_COLORS.blue} />
              <Text style={styles.summaryValue}>{totals.giorni}</Text>
              <Text style={styles.summaryLabel}>Giorni lavorati</Text>
            </CardContent>
          </Card>
        </View>

        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCardSmall}>
            <CardContent style={styles.summaryContentSmall}>
              <Text style={styles.summaryLabelSmall}>Assenze</Text>
              <Text style={styles.summaryValueSmall}>{totals.assenze}</Text>
            </CardContent>
          </Card>
          <Card style={styles.summaryCardSmall}>
            <CardContent style={styles.summaryContentSmall}>
              <Text style={styles.summaryLabelSmall}>Permessi</Text>
              <Text style={styles.summaryValueSmall}>{totals.permessi}</Text>
            </CardContent>
          </Card>
          <Card style={styles.summaryCardSmall}>
            <CardContent style={styles.summaryContentSmall}>
              <Text style={styles.summaryLabelSmall}>Ferie</Text>
              <Text style={styles.summaryValueSmall}>{totals.ferie}</Text>
            </CardContent>
          </Card>
        </View>

        {/* Presenze List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Presenze ({presenze.length})</Text>

          {pageItems.length === 0 ? (
            <Card style={styles.emptyCard}>
              <CardContent style={styles.emptyContent}>
                <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
                <Text style={styles.emptyText}>Nessuna presenza trovata</Text>
              </CardContent>
            </Card>
          ) : (
            pageItems.map((p) => (
              <Card key={p.id} style={styles.presenzaCard}>
                <CardContent style={styles.presenzaContent}>
                  <View style={styles.presenzaHeader}>
                    <View>
                      <Text style={styles.presenzaNome}>{p.nome}</Text>
                      <Text style={styles.presenzaData}>{formatDate(p.data)}</Text>
                    </View>
                    <View
                      style={[
                        styles.tipoBadge,
                        p.tipo === 'presenza' && styles.tipoBadgePresenza,
                        p.tipo === 'assenza' && styles.tipoBadgeAssenza,
                        p.tipo === 'ferie' && styles.tipoBadgeFerie,
                      ]}
                    >
                      <Text style={styles.tipoBadgeText}>{p.tipo}</Text>
                    </View>
                  </View>

                  {p.tipo === 'presenza' && (
                    <View style={styles.presenzaDetails}>
                      <View style={styles.presenzaTimeRow}>
                        <Ionicons name="log-in-outline" size={16} color={colors.mutedForeground} />
                        <Text style={styles.presenzaTime}>
                          {formatTimePair(p.checkIn, p.checkOut)}
                        </Text>
                      </View>
                      {(p.checkIn2 || p.checkOut2) && (
                        <View style={styles.presenzaTimeRow}>
                          <Ionicons name="log-in-outline" size={16} color={colors.mutedForeground} />
                          <Text style={styles.presenzaTime}>
                            {formatTimePair(p.checkIn2, p.checkOut2)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.presenzaDurata}>
                        <Text style={styles.presenzaDurataLabel}>Durata:</Text>
                        <Text style={styles.presenzaDurataValue}>
                          {calcDurata(p).toFixed(2)} ore
                        </Text>
                      </View>
                    </View>
                  )}

                  {p.note ? <Text style={styles.presenzaNote}>{p.note}</Text> : null}

                  <View style={styles.presenzaActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openEdit(p)}
                    >
                      <Ionicons name="pencil-outline" size={18} color={SEMPLISWITCH_COLORS.blue} />
                      <Text style={styles.actionButtonText}>Modifica</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonDanger]}
                      onPress={() => handleDelete(p.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                      <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                        Elimina
                      </Text>
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <Ionicons name="chevron-back" size={20} color={page <= 1 ? colors.mutedForeground : colors.foreground} />
              </TouchableOpacity>
              <Text style={styles.pageText}>
                {page} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <Ionicons name="chevron-forward" size={20} color={page >= totalPages ? colors.mutedForeground : colors.foreground} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editId ? 'Modifica Presenza' : 'Nuova Presenza'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            {/* User Select */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Utente *</Text>
              <TouchableOpacity
                style={styles.formSelect}
                onPress={() => setShowUserPicker(true)}
              >
                <Text style={styles.formSelectText}>
                  {formUserId
                    ? utenti.find((u) => u.id === formUserId)?.nome || 'Seleziona'
                    : 'Seleziona utente'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Data *</Text>
              <TextInput
                style={styles.formInput}
                value={formDate}
                onChangeText={setFormDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* Tipo */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tipo *</Text>
              <View style={styles.tipoButtons}>
                {TIPO_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.tipoButton,
                      formTipo === opt.value && styles.tipoButtonSelected,
                    ]}
                    onPress={() => setFormTipo(opt.value)}
                  >
                    <Text
                      style={[
                        styles.tipoButtonText,
                        formTipo === opt.value && styles.tipoButtonTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Check-in/out times (only for presenza) */}
            {formTipo === 'presenza' && (
              <>
                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Check-in</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formCheckIn}
                      onChangeText={setFormCheckIn}
                      placeholder="HH:MM"
                    />
                  </View>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Check-out</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formCheckOut}
                      onChangeText={setFormCheckOut}
                      placeholder="HH:MM"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Check-in 2</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formCheckIn2}
                      onChangeText={setFormCheckIn2}
                      placeholder="HH:MM"
                    />
                  </View>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Check-out 2</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formCheckOut2}
                      onChangeText={setFormCheckOut2}
                      placeholder="HH:MM"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Note */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Note</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formNote}
                onChangeText={setFormNote}
                placeholder="Aggiungi note..."
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + spacing[4] }]}>
            <Button
              variant="outline"
              onPress={() => setModalVisible(false)}
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
                <Text style={styles.modalButtonText}>Salva</Text>
              )}
            </Button>
          </View>
        </View>
      </Modal>

      {/* User Picker Modal */}
      <Modal
        visible={showUserPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowUserPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowUserPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Seleziona Utente</Text>
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => {
                setUserFilter('all');
                setShowUserPicker(false);
              }}
            >
              <Text style={styles.pickerItemText}>Tutti</Text>
              {userFilter === 'all' && (
                <Ionicons name="checkmark" size={20} color={SEMPLISWITCH_COLORS.magenta} />
              )}
            </TouchableOpacity>
            {utenti.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={styles.pickerItem}
                onPress={() => {
                  if (modalVisible) {
                    setFormUserId(u.id);
                  } else {
                    setUserFilter(u.id);
                  }
                  setShowUserPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{u.nome}</Text>
                {(modalVisible ? formUserId : userFilter) === u.id && (
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
  filterRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  filterInput: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  filterSelect: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterSelectText: {
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  filterButton: {
    marginTop: spacing[2],
  },
  filterButtonText: {
    color: colors.white,
    fontWeight: fontWeights.medium as any,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  summaryCard: {
    flex: 1,
  },
  summaryContent: {
    alignItems: 'center',
    gap: spacing[2],
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  summaryLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  summaryCardSmall: {
    flex: 1,
  },
  summaryContentSmall: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  summaryLabelSmall: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  summaryValueSmall: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  listSection: {
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  emptyCard: {},
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyText: {
    marginTop: spacing[3],
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  presenzaCard: {
    marginBottom: spacing[2],
  },
  presenzaContent: {
    gap: spacing[3],
  },
  presenzaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  presenzaNome: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  presenzaData: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  tipoBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
    backgroundColor: colors.muted,
  },
  tipoBadgePresenza: {
    backgroundColor: '#DCFCE7',
  },
  tipoBadgeAssenza: {
    backgroundColor: '#FEE2E2',
  },
  tipoBadgeFerie: {
    backgroundColor: '#FEF3C7',
  },
  tipoBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    textTransform: 'capitalize',
  },
  presenzaDetails: {
    gap: spacing[2],
  },
  presenzaTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  presenzaTime: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  presenzaDurata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  presenzaDurataLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  presenzaDurataValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold as any,
    color: SEMPLISWITCH_COLORS.magenta,
  },
  presenzaNote: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    fontStyle: 'italic',
  },
  presenzaActions: {
    flexDirection: 'row',
    gap: spacing[3],
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
    color: SEMPLISWITCH_COLORS.blue,
  },
  actionButtonDanger: {},
  actionButtonTextDanger: {
    color: colors.destructive,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    paddingVertical: spacing[4],
  },
  pageButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.muted,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
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
  formGroup: {
    gap: spacing[1],
  },
  formGroupHalf: {
    flex: 1,
    gap: spacing[1],
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing[3],
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
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formSelect: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formSelectText: {
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  tipoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  tipoButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tipoButtonSelected: {
    borderColor: SEMPLISWITCH_COLORS.magenta,
    backgroundColor: '#FDF2F8',
  },
  tipoButtonText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  tipoButtonTextSelected: {
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
  modalButtonText: {
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
