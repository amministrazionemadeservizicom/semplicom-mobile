/**
 * AdminOffers - Gestione Offerte (Energia, Telco, Fotovoltaico)
 * Pagina admin per gestire le offerte
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
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AccessDenied } from '../../components/navigation/AccessDenied';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import { OfferteAPI, OffertaCompleta } from '../../lib/api';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#1d4ed8',
  green: '#22C55E',
};

// Types
type CategoriaOfferta = 'energia' | 'telco' | 'fotovoltaico';
type StatoOfferta = 'attiva' | 'bozza' | 'disattiva' | 'scaduta';
type TipoCliente = 'privato' | 'business' | 'condominio';

interface Offerta {
  id: number;
  nome: string;
  categoria: CategoriaOfferta;
  stato: StatoOfferta;
  customer: TipoCliente;
  gestore?: {
    id: number;
    nome: string;
  };
  base?: {
    id?: number;
    nome?: string;
    stato?: StatoOfferta;
    dal?: string;
    al?: string;
    idGestore?: number;
  };
  energia?: {
    commodity?: string;
    acquisition?: string;
    prezzoTipo?: boolean | string;
  };
}

// Filter options
const CATEGORIA_OPTIONS = [
  { value: 'all', label: 'Tutte le categorie' },
  { value: 'energia', label: 'Energia' },
  { value: 'telco', label: 'Telco' },
  { value: 'fotovoltaico', label: 'Fotovoltaico' },
];

const STATO_OPTIONS = [
  { value: 'all', label: 'Tutti gli stati' },
  { value: 'attiva', label: 'Attiva' },
  { value: 'bozza', label: 'Bozza' },
  { value: 'disattiva', label: 'Disattiva' },
  { value: 'scaduta', label: 'Scaduta' },
];

const CLIENTE_OPTIONS = [
  { value: 'all', label: 'Tutti i clienti' },
  { value: 'privato', label: 'Privato' },
  { value: 'business', label: 'Business' },
  { value: 'condominio', label: 'Condominio' },
];

// Helpers
const getStatoColor = (stato: StatoOfferta): string => {
  switch (stato) {
    case 'attiva':
      return '#DCFCE7'; // green-100
    case 'bozza':
      return '#FEF3C7'; // yellow-100
    case 'disattiva':
      return '#E5E7EB'; // gray-200
    case 'scaduta':
      return '#FEE2E2'; // red-100
    default:
      return colors.muted;
  }
};

const getStatoTextColor = (stato: StatoOfferta): string => {
  switch (stato) {
    case 'attiva':
      return '#166534'; // green-800
    case 'bozza':
      return '#92400E'; // yellow-800
    case 'disattiva':
      return '#374151'; // gray-700
    case 'scaduta':
      return '#991B1B'; // red-800
    default:
      return colors.foreground;
  }
};

const getCategoriaIcon = (categoria: CategoriaOfferta): keyof typeof Ionicons.glyphMap => {
  switch (categoria) {
    case 'energia':
      return 'flash-outline';
    case 'telco':
      return 'phone-portrait-outline';
    case 'fotovoltaico':
      return 'sunny-outline';
    default:
      return 'help-outline';
  }
};

const PAGE_SIZE = 20;

export default function AdminOffers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offerte, setOfferte] = useState<Offerta[]>([]);
  const [gestori, setGestori] = useState<{ id: number; nome: string }[]>([]);

  // Filters
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterStato, setFilterStato] = useState<string>('all');
  const [filterCliente, setFilterCliente] = useState<string>('all');
  const [searchNome, setSearchNome] = useState('');

  // Picker states
  const [showCategoriaPicker, setShowCategoriaPicker] = useState(false);
  const [showStatoPicker, setShowStatoPicker] = useState(false);
  const [showClientePicker, setShowClientePicker] = useState(false);

  // Selection
  const [selectedOfferte, setSelectedOfferte] = useState<Set<number>>(new Set());

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const isAdmin = userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN || userRole === ROLES.MASTER;

  // Map API response to local Offerta interface
  const mapOffertaApi = (o: OffertaCompleta): Offerta => ({
    id: o.base?.id || 0,
    nome: o.base?.nome || '',
    categoria: (o.base?.categoria || 'energia') as CategoriaOfferta,
    stato: (o.base?.stato || 'attiva') as StatoOfferta,
    customer: (o.base?.customer || 'privato') as TipoCliente,
    gestore: o.base?.idGestore ? { id: o.base.idGestore, nome: o.base.nomeGestore || '' } : undefined,
    base: o.base,
    energia: o.energia,
  });

  // Load data
  const loadOfferte = useCallback(async () => {
    try {
      // Fetch real data from API
      const response = await OfferteAPI.list({
        page,
        size: PAGE_SIZE,
        categoria: filterCategoria !== 'all' ? filterCategoria as any : undefined,
        stato: filterStato !== 'all' ? filterStato as any : undefined,
        customer: filterCliente !== 'all' ? filterCliente as any : undefined,
      });

      // Map API response to local interface
      const mapped = response.content.map(mapOffertaApi);
      setOfferte(mapped);

      // Extract unique gestori
      const uniqueGestori = new Map<number, { id: number; nome: string }>();
      mapped.forEach(o => {
        if (o.gestore) {
          uniqueGestori.set(o.gestore.id, o.gestore);
        }
      });
      setGestori(Array.from(uniqueGestori.values()));

      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error loading offerte:', error);
      Alert.alert('Errore', 'Impossibile caricare le offerte');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterCategoria, filterStato, filterCliente, page]);

  useEffect(() => {
    loadOfferte();
  }, [loadOfferte]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOfferte();
  }, [loadOfferte]);

  // Filtered offerte
  const filteredOfferte = useMemo(() => {
    let filtered = offerte;

    if (filterCategoria !== 'all') {
      filtered = filtered.filter((o) => o.categoria === filterCategoria);
    }
    if (filterStato !== 'all') {
      filtered = filtered.filter((o) => o.stato === filterStato);
    }
    if (filterCliente !== 'all') {
      filtered = filtered.filter((o) => o.customer === filterCliente);
    }
    if (searchNome) {
      const term = searchNome.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.nome.toLowerCase().includes(term) ||
          o.gestore?.nome?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [offerte, filterCategoria, filterStato, filterCliente, searchNome]);

  // Selection handlers
  const toggleSelectOfferta = (id: number) => {
    setSelectedOfferte((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedOfferte(new Set());
  };

  // Actions
  const handleCreate = () => {
    // TODO: Navigate to create offer screen or open modal
    Alert.alert('Info', 'Funzionalità di creazione offerta in arrivo');
  };

  const handleEdit = (offerta: Offerta) => {
    // TODO: Navigate to edit screen or open modal
    Alert.alert('Info', `Modifica offerta: ${offerta.nome}`);
  };

  const handleDelete = (id: number, nome: string) => {
    Alert.alert('Conferma', `Eliminare "${nome}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          try {
            // TODO: await offerteApi.deleteOfferta(id);
            console.log('Deleting offerta:', id);
            loadOfferte();
          } catch (error) {
            Alert.alert('Errore', 'Errore durante l\'eliminazione');
          }
        },
      },
    ]);
  };

  const handleBulkDelete = () => {
    if (selectedOfferte.size === 0) return;
    Alert.alert(
      'Conferma',
      `Eliminare ${selectedOfferte.size} offerte selezionate?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            // TODO: Bulk delete
            console.log('Bulk deleting:', Array.from(selectedOfferte));
            clearSelection();
            loadOfferte();
          },
        },
      ]
    );
  };

  // Access guard
  if (!isAdmin) {
    return <AccessDenied message="Solo gli amministratori possono accedere a questa pagina." />;
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
        <Text style={styles.loadingText}>Caricamento offerte...</Text>
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Gestione Offerte</Text>
          <Text style={styles.headerSubtitle}>Energia, Telco, Fotovoltaico</Text>
        </View>
        <TouchableOpacity onPress={handleCreate} style={styles.addButton}>
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
        {/* Gestori Info */}
        {gestori.length > 0 && (
          <View style={styles.gestoriInfo}>
            <Ionicons name="checkmark-circle" size={16} color={SEMPLISWITCH_COLORS.green} />
            <Text style={styles.gestoriInfoText}>{gestori.length} gestori disponibili</Text>
          </View>
        )}

        {/* Filters */}
        <Card style={styles.filterCard}>
          <CardContent style={styles.filterContent}>
            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.mutedForeground} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cerca per nome gestore..."
                value={searchNome}
                onChangeText={setSearchNome}
                placeholderTextColor={colors.mutedForeground}
              />
              {searchNome ? (
                <TouchableOpacity onPress={() => setSearchNome('')}>
                  <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowCategoriaPicker(true)}
              >
                <Text style={styles.filterButtonLabel}>Categoria</Text>
                <Text style={styles.filterButtonValue}>
                  {CATEGORIA_OPTIONS.find((o) => o.value === filterCategoria)?.label || 'Tutte'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowStatoPicker(true)}
              >
                <Text style={styles.filterButtonLabel}>Stato</Text>
                <Text style={styles.filterButtonValue}>
                  {STATO_OPTIONS.find((o) => o.value === filterStato)?.label || 'Tutti'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowClientePicker(true)}
              >
                <Text style={styles.filterButtonLabel}>Cliente</Text>
                <Text style={styles.filterButtonValue}>
                  {CLIENTE_OPTIONS.find((o) => o.value === filterCliente)?.label || 'Tutti'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterCount}>{filteredOfferte.length} offerte trovate</Text>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedOfferte.size > 0 && (
          <View style={styles.bulkActions}>
            <Text style={styles.bulkActionsText}>
              {selectedOfferte.size} selezionate
            </Text>
            <View style={styles.bulkActionsButtons}>
              <TouchableOpacity
                style={styles.bulkActionButton}
                onPress={clearSelection}
              >
                <Text style={styles.bulkActionButtonText}>Deseleziona</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.bulkActionButtonDanger]}
                onPress={handleBulkDelete}
              >
                <Ionicons name="trash-outline" size={16} color={colors.white} />
                <Text style={[styles.bulkActionButtonText, { color: colors.white }]}>
                  Elimina
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Offerte List */}
        {filteredOfferte.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Ionicons name="pricetag-outline" size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Nessuna offerta trovata</Text>
              <Text style={styles.emptyText}>
                Clicca "+" per creare una nuova offerta.
              </Text>
            </CardContent>
          </Card>
        ) : (
          filteredOfferte.map((offerta) => (
            <TouchableOpacity
              key={offerta.id}
              style={[
                styles.offertaCard,
                selectedOfferte.has(offerta.id) && styles.offertaCardSelected,
              ]}
              onPress={() => handleEdit(offerta)}
              onLongPress={() => toggleSelectOfferta(offerta.id)}
            >
              {/* Selection indicator */}
              {isAdmin && (
                <TouchableOpacity
                  style={styles.selectCheckbox}
                  onPress={() => toggleSelectOfferta(offerta.id)}
                >
                  <Ionicons
                    name={selectedOfferte.has(offerta.id) ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={selectedOfferte.has(offerta.id) ? SEMPLISWITCH_COLORS.blue : colors.mutedForeground}
                  />
                </TouchableOpacity>
              )}

              <View style={styles.offertaContent}>
                {/* Header */}
                <View style={styles.offertaHeader}>
                  <View style={styles.offertaCategory}>
                    <Ionicons
                      name={getCategoriaIcon(offerta.categoria)}
                      size={20}
                      color={SEMPLISWITCH_COLORS.magenta}
                    />
                    <Text style={styles.offertaCategoryText}>
                      {offerta.categoria.charAt(0).toUpperCase() + offerta.categoria.slice(1)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statoBadge,
                      { backgroundColor: getStatoColor(offerta.stato) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statoBadgeText,
                        { color: getStatoTextColor(offerta.stato) },
                      ]}
                    >
                      {offerta.stato.charAt(0).toUpperCase() + offerta.stato.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Name */}
                <Text style={styles.offertaNome}>{offerta.nome}</Text>

                {/* Gestore */}
                {offerta.gestore && (
                  <Text style={styles.offertaGestore}>{offerta.gestore.nome}</Text>
                )}

                {/* Customer type */}
                <View style={styles.offertaCustomer}>
                  <Ionicons name="person-outline" size={14} color={colors.mutedForeground} />
                  <Text style={styles.offertaCustomerText}>
                    {offerta.customer.charAt(0).toUpperCase() + offerta.customer.slice(1)}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.offertaActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEdit(offerta)}
                  >
                    <Ionicons name="pencil-outline" size={18} color={SEMPLISWITCH_COLORS.blue} />
                    <Text style={[styles.actionButtonText, { color: SEMPLISWITCH_COLORS.blue }]}>
                      Modifica
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(offerta.id, offerta.nome)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                    <Text style={[styles.actionButtonText, { color: colors.destructive }]}>
                      Elimina
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}
              onPress={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <Text style={styles.pageButtonText}>Precedente</Text>
            </TouchableOpacity>
            <Text style={styles.pageText}>
              {page + 1} / {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.pageButton, page >= totalPages - 1 && styles.pageButtonDisabled]}
              onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <Text style={styles.pageButtonText}>Successiva</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Categoria Picker Modal */}
      <Modal
        visible={showCategoriaPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCategoriaPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoriaPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Categoria</Text>
            {CATEGORIA_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.pickerItem}
                onPress={() => {
                  setFilterCategoria(opt.value);
                  setShowCategoriaPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{opt.label}</Text>
                {filterCategoria === opt.value && (
                  <Ionicons name="checkmark" size={20} color={SEMPLISWITCH_COLORS.magenta} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
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
            <Text style={styles.pickerTitle}>Stato</Text>
            {STATO_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.pickerItem}
                onPress={() => {
                  setFilterStato(opt.value);
                  setShowStatoPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{opt.label}</Text>
                {filterStato === opt.value && (
                  <Ionicons name="checkmark" size={20} color={SEMPLISWITCH_COLORS.magenta} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Cliente Picker Modal */}
      <Modal
        visible={showClientePicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowClientePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowClientePicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Tipo Cliente</Text>
            {CLIENTE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.pickerItem}
                onPress={() => {
                  setFilterCliente(opt.value);
                  setShowClientePicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{opt.label}</Text>
                {filterCliente === opt.value && (
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
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing[2],
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
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
  gestoriInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#DCFCE7',
    padding: spacing[3],
    borderRadius: borderRadius.md,
  },
  gestoriInfoText: {
    fontSize: fontSizes.sm,
    color: '#166534',
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
  filterButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  filterButton: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    padding: spacing[2],
  },
  filterButtonLabel: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  filterButtonValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  filterCount: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bulkActionsText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: '#1E40AF',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  bulkActionButtonDanger: {
    backgroundColor: colors.destructive,
  },
  bulkActionButtonText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
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
  offertaCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  offertaCardSelected: {
    borderColor: SEMPLISWITCH_COLORS.blue,
    borderWidth: 2,
  },
  selectCheckbox: {
    padding: spacing[3],
    justifyContent: 'center',
  },
  offertaContent: {
    flex: 1,
    padding: spacing[4],
    gap: spacing[2],
  },
  offertaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offertaCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  offertaCategoryText: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.magenta,
    fontWeight: fontWeights.medium as any,
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
  offertaNome: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  offertaGestore: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  offertaCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  offertaCustomerText: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  offertaActions: {
    flexDirection: 'row',
    gap: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing[2],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  actionButtonText: {
    fontSize: fontSizes.sm,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    paddingVertical: spacing[4],
  },
  pageButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  pageText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
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
