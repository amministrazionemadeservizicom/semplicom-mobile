/**
 * StatoPagamenti - Gestione stato pagamenti contratti (React Native)
 * Filtri avanzati e operazioni bulk su contratti
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  green: '#22C55E',
  red: '#EF4444',
  blue: '#3B82F6',
  orange: '#F59E0B',
};

const STATUS_WORK = ['inserimento_ok', 'verifica', 'attivato', 'rigettato'];
const STATUS_PAY = ['in_attesa', 'pagato', 'stornato'];

// Tipi
interface ContractItem {
  id: string;
  code?: string;
  customerName?: string;
  customerSurname?: string;
  cf?: string;
  pod?: string;
  pdr?: string;
  brand?: string;
  consultantName?: string;
  masterName?: string;
  statusWork?: string;
  statusPay?: string;
  payAmount?: number;
  createdAt?: number;
}

// Mock data
const MOCK_CONTRACTS: ContractItem[] = [
  {
    id: '1',
    code: 'CON-2024-001',
    customerName: 'Mario',
    customerSurname: 'Rossi',
    cf: 'RSSMRA80A01H501Z',
    pod: 'IT001E12345678',
    brand: 'Enel',
    consultantName: 'Giuseppe Verdi',
    masterName: 'Paolo Bianchi',
    statusWork: 'attivato',
    statusPay: 'pagato',
    payAmount: 35.00,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: '2',
    code: 'CON-2024-002',
    customerName: 'Anna',
    customerSurname: 'Bianchi',
    cf: 'BNCNNA85B42F205X',
    pdr: '12345678901234',
    brand: 'Eni',
    consultantName: 'Giuseppe Verdi',
    statusWork: 'verifica',
    statusPay: 'in_attesa',
    payAmount: 45.00,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: '3',
    code: 'CON-2024-003',
    customerName: 'Luigi',
    customerSurname: 'Neri',
    cf: 'NRILGU75C03L219Y',
    pod: 'IT001E98765432',
    brand: 'A2A',
    consultantName: 'Maria Rosa',
    masterName: 'Paolo Bianchi',
    statusWork: 'inserimento_ok',
    statusPay: 'in_attesa',
    payAmount: 30.00,
    createdAt: Date.now() - 86400000,
  },
];

// Helper per colore status
function getStatusWorkColor(status?: string): string {
  switch (status) {
    case 'attivato': return SEMPLISWITCH_COLORS.green;
    case 'verifica': return SEMPLISWITCH_COLORS.orange;
    case 'rigettato': return SEMPLISWITCH_COLORS.red;
    default: return SEMPLISWITCH_COLORS.blue;
  }
}

function getStatusPayColor(status?: string): string {
  switch (status) {
    case 'pagato': return SEMPLISWITCH_COLORS.green;
    case 'stornato': return SEMPLISWITCH_COLORS.red;
    default: return SEMPLISWITCH_COLORS.orange;
  }
}

// Componente riga contratto
function ContractRow({
  item,
  selected,
  onSelect,
}: {
  item: ContractItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.contractRow, selected && styles.contractRowSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {/* Checkbox */}
      <TouchableOpacity style={styles.checkbox} onPress={onSelect}>
        <Ionicons
          name={selected ? 'checkbox' : 'square-outline'}
          size={22}
          color={selected ? SEMPLISWITCH_COLORS.magenta : colors.mutedForeground}
        />
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.contractInfo}>
        <Text style={styles.contractCode}>{item.code}</Text>
        <Text style={styles.contractCustomer}>
          {item.customerSurname} {item.customerName}
        </Text>
        <Text style={styles.contractDetail} numberOfLines={1}>
          {item.cf} • {item.brand}
        </Text>
        <Text style={styles.contractDetail} numberOfLines={1}>
          {item.pod || item.pdr || '-'}
        </Text>
      </View>

      {/* Status */}
      <View style={styles.contractStatus}>
        <Badge
          variant="outline"
          style={[styles.statusBadge, { borderColor: getStatusWorkColor(item.statusWork) }]}
        >
          <Text style={[styles.statusText, { color: getStatusWorkColor(item.statusWork) }]}>
            {item.statusWork || '-'}
          </Text>
        </Badge>
        <Badge
          variant="outline"
          style={[styles.statusBadge, { borderColor: getStatusPayColor(item.statusPay) }]}
        >
          <Text style={[styles.statusText, { color: getStatusPayColor(item.statusPay) }]}>
            {item.statusPay || '-'}
          </Text>
        </Badge>
        <Text style={styles.contractAmount}>
          €{item.payAmount?.toFixed(2) || '0.00'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function StatoPagamenti() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Filters
  const [brand, setBrand] = useState('');
  const [surname, setSurname] = useState('');
  const [statusWork, setStatusWork] = useState('');
  const [statusPay, setStatusPay] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [contracts, setContracts] = useState<ContractItem[]>(MOCK_CONTRACTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Load data
  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      // In produzione: chiamata API con filtri
      await new Promise(resolve => setTimeout(resolve, 500));
      setContracts(MOCK_CONTRACTS);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [brand, surname, statusWork, statusPay]);

  const onRefresh = () => {
    setRefreshing(true);
    loadContracts();
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === contracts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contracts.map(c => c.id)));
    }
  };

  // Bulk actions
  const handleBulkAction = (action: string) => {
    if (selected.size === 0) {
      Alert.alert('Attenzione', 'Seleziona almeno un contratto');
      return;
    }

    Alert.alert(
      'Conferma',
      `Vuoi applicare "${action}" a ${selected.size} contratti?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Conferma',
          onPress: () => {
            Alert.alert('Fatto', `Azione "${action}" applicata a ${selected.size} contratti`);
            setSelected(new Set());
          },
        },
      ]
    );
  };

  const resetFilters = () => {
    setBrand('');
    setSurname('');
    setStatusWork('');
    setStatusPay('');
  };

  // Filter contratti
  const filteredContracts = contracts.filter(c => {
    if (brand && !c.brand?.toLowerCase().includes(brand.toLowerCase())) return false;
    if (surname && !c.customerSurname?.toLowerCase().includes(surname.toLowerCase())) return false;
    if (statusWork && c.statusWork !== statusWork) return false;
    if (statusPay && c.statusPay !== statusPay) return false;
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stato Pagamenti</Text>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name={showFilters ? 'filter' : 'filter-outline'}
            size={22}
            color={showFilters ? SEMPLISWITCH_COLORS.magenta : colors.foreground}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <Card style={styles.filtersCard}>
          <CardContent style={styles.filtersContent}>
            <View style={styles.filterRow}>
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Gestore</Text>
                <TextInput
                  style={styles.filterInput}
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="Brand"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Cognome</Text>
                <TextInput
                  style={styles.filterInput}
                  value={surname}
                  onChangeText={setSurname}
                  placeholder="Cognome"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Stato Lavorazione</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterChips}>
                    {STATUS_WORK.map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.filterChip, statusWork === s && styles.filterChipActive]}
                        onPress={() => setStatusWork(statusWork === s ? '' : s)}
                      >
                        <Text style={[styles.filterChipText, statusWork === s && styles.filterChipTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Stato Pagamento</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterChips}>
                    {STATUS_PAY.map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.filterChip, statusPay === s && styles.filterChipActive]}
                        onPress={() => setStatusPay(statusPay === s ? '' : s)}
                      >
                        <Text style={[styles.filterChipText, statusPay === s && styles.filterChipTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.filterButton} onPress={loadContracts}>
                <Ionicons name="search" size={18} color="#FFFFFF" />
                <Text style={styles.filterButtonText}>Cerca</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterResetButton} onPress={resetFilters}>
                <Text style={styles.filterResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <View style={styles.bulkBar}>
          <Badge variant="secondary" style={styles.bulkBadge}>
            <Text style={styles.bulkBadgeText}>{selected.size} selezionati</Text>
          </Badge>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.bulkActions}>
              <TouchableOpacity
                style={styles.bulkButton}
                onPress={() => handleBulkAction('pagato')}
              >
                <Ionicons name="checkmark-circle" size={16} color={SEMPLISWITCH_COLORS.green} />
                <Text style={styles.bulkButtonText}>Pagato</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bulkButton}
                onPress={() => handleBulkAction('stornato')}
              >
                <Ionicons name="close-circle" size={16} color={SEMPLISWITCH_COLORS.red} />
                <Text style={styles.bulkButtonText}>Stornato</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bulkButton}
                onPress={() => handleBulkAction('export')}
              >
                <Ionicons name="download" size={16} color={SEMPLISWITCH_COLORS.blue} />
                <Text style={styles.bulkButtonText}>Export CSV</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* List Header */}
      <View style={styles.listHeader}>
        <TouchableOpacity style={styles.selectAllButton} onPress={selectAll}>
          <Ionicons
            name={selected.size === contracts.length && contracts.length > 0 ? 'checkbox' : 'square-outline'}
            size={22}
            color={SEMPLISWITCH_COLORS.magenta}
          />
          <Text style={styles.selectAllText}>Seleziona tutti</Text>
        </TouchableOpacity>
        <Text style={styles.resultsCount}>{filteredContracts.length} risultati</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
        </View>
      ) : (
        <FlatList
          data={filteredContracts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContractRow
              item={item}
              selected={selected.has(item.id)}
              onSelect={() => toggleSelect(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>Nessun contratto trovato</Text>
            </View>
          }
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  filterToggle: {
    padding: spacing[2],
  },
  filtersCard: {
    margin: spacing[4],
    marginBottom: spacing[2],
  },
  filtersContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  filterCol: {
    flex: 1,
    gap: spacing[2],
  },
  filterLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSizes.sm,
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterChipActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  filterChipText: {
    fontSize: fontSizes.xs,
    color: colors.foreground,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
  },
  filterButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: '#FFFFFF',
  },
  filterResetButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterResetText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: `${SEMPLISWITCH_COLORS.magenta}10`,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bulkBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  bulkBadgeText: {
    fontSize: fontSizes.xs,
    color: colors.foreground,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bulkButtonText: {
    fontSize: fontSizes.xs,
    color: colors.foreground,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  selectAllText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  resultsCount: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: spacing[8],
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  contractRowSelected: {
    backgroundColor: `${SEMPLISWITCH_COLORS.magenta}10`,
  },
  checkbox: {
    marginRight: spacing[3],
  },
  contractInfo: {
    flex: 1,
    gap: 2,
  },
  contractCode: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  contractCustomer: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  contractDetail: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  contractStatus: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: fontWeights.bold as any,
  },
  contractAmount: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.magenta,
    marginTop: spacing[1],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
    marginTop: spacing[3],
  },
});
