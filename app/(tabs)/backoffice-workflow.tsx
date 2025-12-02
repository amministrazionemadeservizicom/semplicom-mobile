/**
 * BackOfficeWorkflow - Pagina di lavorazione contratti
 * Gestione stato di lavorazione con cambio stato, filtri e priorità
 * Stile Sempliswitch - ottimizzato per smartphone
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AccessDenied } from '../../components/navigation/AccessDenied';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#3B82F6',
  green: '#22C55E',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
  emerald: '#10B981',
  gray: '#6B7280',
};

// Tipi di stato contratto
type StatoContratto =
  | 'inserito'
  | 'in_verifica'
  | 'lavorazione'
  | 'ok_inserimento'
  | 'attivato'
  | 'sospeso'
  | 'annullato'
  | 'stornato';

// Configurazione stati con colori e icone
const STATO_CONFIG: Record<StatoContratto, {
  label: string;
  color: string;
  bgColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  next: StatoContratto[];
}> = {
  inserito: {
    label: 'Inserito',
    color: SEMPLISWITCH_COLORS.gray,
    bgColor: '#F3F4F6',
    icon: 'document-text-outline',
    next: ['in_verifica', 'annullato'],
  },
  in_verifica: {
    label: 'In Verifica',
    color: SEMPLISWITCH_COLORS.yellow,
    bgColor: '#FEF3C7',
    icon: 'time-outline',
    next: ['lavorazione', 'inserito', 'annullato'],
  },
  lavorazione: {
    label: 'In Lavorazione',
    color: SEMPLISWITCH_COLORS.blue,
    bgColor: '#DBEAFE',
    icon: 'sync-outline',
    next: ['ok_inserimento', 'sospeso', 'annullato'],
  },
  ok_inserimento: {
    label: 'OK Inserimento',
    color: SEMPLISWITCH_COLORS.green,
    bgColor: '#D1FAE5',
    icon: 'checkmark-circle-outline',
    next: ['attivato', 'sospeso'],
  },
  attivato: {
    label: 'Attivato',
    color: SEMPLISWITCH_COLORS.emerald,
    bgColor: '#A7F3D0',
    icon: 'checkmark-done-outline',
    next: ['sospeso', 'stornato'],
  },
  sospeso: {
    label: 'Sospeso',
    color: SEMPLISWITCH_COLORS.orange,
    bgColor: '#FED7AA',
    icon: 'alert-circle-outline',
    next: ['lavorazione', 'annullato'],
  },
  annullato: {
    label: 'Annullato',
    color: SEMPLISWITCH_COLORS.red,
    bgColor: '#FECACA',
    icon: 'close-circle-outline',
    next: [],
  },
  stornato: {
    label: 'Stornato',
    color: SEMPLISWITCH_COLORS.purple,
    bgColor: '#E9D5FF',
    icon: 'remove-circle-outline',
    next: [],
  },
};

interface ContractRow {
  id: number;
  cliente: string;
  agente: string;
  gestore: string;
  gestitoDa: string | null;
  stato: StatoContratto;
  commodity: string;
  dataCreazione: string;
  priorita: number;
}

interface StatoCardProps {
  stato: StatoContratto;
  count: number;
  isActive: boolean;
  onPress: () => void;
}

function StatoCard({ stato, count, isActive, onPress }: StatoCardProps) {
  const config = STATO_CONFIG[stato];
  return (
    <TouchableOpacity
      style={[
        styles.statoCard,
        { backgroundColor: config.bgColor },
        isActive && styles.statoCardActive,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={config.icon} size={24} color={config.color} />
      <Text style={[styles.statoCardCount, { color: config.color }]}>{count}</Text>
      <Text style={styles.statoCardLabel} numberOfLines={1}>{config.label}</Text>
    </TouchableOpacity>
  );
}

export default function BackOfficeWorkflow() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole, user } = useAuth();

  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStato, setFilterStato] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('priority');

  // Modal cambio stato
  const [changeStatusModalVisible, setChangeStatusModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null);

  // Access guard - solo backoffice e admin
  const hasAccess = userRole === ROLES.BACK_OFFICE || userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN;

  // Calcola priorità
  const calculatePriority = (stato: StatoContratto, data: string): number => {
    if (!data) return 50;
    const dateObj = new Date(data);
    if (isNaN(dateObj.getTime())) return 50;

    const age = Date.now() - dateObj.getTime();
    const dayAge = age / (1000 * 60 * 60 * 24);

    if (stato === 'inserito' && dayAge > 2) return 100;
    if (stato === 'in_verifica' && dayAge > 1) return 90;
    if (stato === 'lavorazione' && dayAge > 3) return 80;
    if (stato === 'sospeso' && dayAge > 7) return 70;
    return Math.max(0, 50 - dayAge);
  };

  // Carica contratti
  const loadContracts = useCallback(async () => {
    if (!hasAccess) return;

    try {
      // TODO: Sostituire con chiamata API reale
      // const response = await ContrattiAPI.listContratti({ size: 100 });

      // Simula caricamento
      await new Promise((resolve) => setTimeout(resolve, 500));

      // I dati arriveranno dall'API
      const mockData: ContractRow[] = [];

      setContracts(mockData);
    } catch (error) {
      console.error('Errore caricamento contratti:', error);
      Alert.alert('Errore', 'Impossibile caricare i contratti');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hasAccess]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadContracts();
  }, [loadContracts]);

  // Cambia stato contratto
  const handleChangeStatus = async (newStato: StatoContratto) => {
    if (!selectedContract) return;

    try {
      // TODO: Sostituire con chiamata API reale
      // await ContrattiAPI.update(selectedContract.id, { stato: newStato });

      await new Promise((resolve) => setTimeout(resolve, 300));

      setContracts((prev) =>
        prev.map((c) =>
          c.id === selectedContract.id
            ? { ...c, stato: newStato, priorita: calculatePriority(newStato, c.dataCreazione) }
            : c
        )
      );

      Alert.alert('Successo', `Contratto #${selectedContract.id} → ${STATO_CONFIG[newStato].label}`);
      setChangeStatusModalVisible(false);
      setSelectedContract(null);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiornare lo stato');
    }
  };

  // Apri modal cambio stato
  const openChangeStatusModal = (contract: ContractRow) => {
    setSelectedContract(contract);
    setChangeStatusModalVisible(true);
  };

  // Filtra e ordina contratti
  const filteredContracts = useMemo(() => {
    return contracts
      .filter((c) => {
        const matchSearch =
          c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.agente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.id.toString().includes(searchTerm);
        const matchStato = filterStato === 'all' || c.stato === filterStato;
        return matchSearch && matchStato;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') return b.priorita - a.priorita;
        return new Date(b.dataCreazione).getTime() - new Date(a.dataCreazione).getTime();
      });
  }, [contracts, searchTerm, filterStato, sortBy]);

  // Calcola statistiche
  const stats = useMemo(() => {
    return (Object.keys(STATO_CONFIG) as StatoContratto[]).reduce((acc, stato) => {
      acc[stato] = contracts.filter((c) => c.stato === stato).length;
      return acc;
    }, {} as Record<StatoContratto, number>);
  }, [contracts]);

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    } catch {
      return '-';
    }
  };

  if (!hasAccess) {
    return <AccessDenied message="Accesso non autorizzato a questa sezione." />;
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
        <Text style={styles.loadingText}>Caricamento contratti...</Text>
      </View>
    );
  }

  const renderContractItem = ({ item }: { item: ContractRow }) => {
    const config = STATO_CONFIG[item.stato];
    if (!config) return null;

    return (
      <TouchableOpacity
        style={styles.contractCard}
        onPress={() => router.push(`/contratto/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.contractHeader}>
          <View style={styles.contractIdContainer}>
            <Text style={styles.contractId}>#{item.id}</Text>
            <Badge style={{ backgroundColor: config.bgColor }}>
              <Text style={{ color: config.color, fontSize: fontSizes.xs }}>{config.label}</Text>
            </Badge>
          </View>
          <Text style={styles.contractDate}>{formatDate(item.dataCreazione)}</Text>
        </View>

        <View style={styles.contractBody}>
          <Text style={styles.contractCliente} numberOfLines={1}>{item.cliente}</Text>
          <Text style={styles.contractAgente}>Agente: {item.agente}</Text>
          <View style={styles.contractMeta}>
            <Text style={styles.contractMetaText}>{item.gestore}</Text>
            <Badge variant="outline">{item.commodity}</Badge>
          </View>
          {item.gestitoDa && (
            <Text style={styles.contractGestitoDa}>Gestito da: {item.gestitoDa}</Text>
          )}
        </View>

        <View style={styles.contractActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/contratto/${item.id}` as any)}
          >
            <Ionicons name="eye-outline" size={20} color={SEMPLISWITCH_COLORS.blue} />
          </TouchableOpacity>
          {config.next.length > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: config.bgColor }]}
              onPress={() => openChangeStatusModal(item)}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color={config.color} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lavorazione Contratti</Text>
          <Text style={styles.headerSubtitle}>Gestisci lo stato di lavorazione</Text>
        </View>
      </View>

      {/* Stati Summary - Horizontal scroll */}
      <View style={styles.statiContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statiScroll}>
          {(Object.keys(STATO_CONFIG) as StatoContratto[]).map((stato) => (
            <StatoCard
              key={stato}
              stato={stato}
              count={stats[stato] || 0}
              isActive={filterStato === stato}
              onPress={() => setFilterStato(filterStato === stato ? 'all' : stato)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Search & Sort */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Cerca cliente, agente o ID..."
            placeholderTextColor={colors.mutedForeground}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'priority' && styles.sortButtonActive]}
            onPress={() => setSortBy('priority')}
          >
            <Ionicons name="arrow-up" size={16} color={sortBy === 'priority' ? SEMPLISWITCH_COLORS.magenta : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
            onPress={() => setSortBy('date')}
          >
            <Ionicons name="time-outline" size={16} color={sortBy === 'date' ? SEMPLISWITCH_COLORS.magenta : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contracts List */}
      <FlatList
        data={filteredContracts}
        renderItem={renderContractItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>Nessun contratto trovato</Text>
          </View>
        }
      />

      {/* Change Status Modal */}
      <Modal
        visible={changeStatusModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setChangeStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setChangeStatusModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing[4] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambia Stato</Text>
              <TouchableOpacity onPress={() => setChangeStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {selectedContract && (
              <View style={styles.modalBody}>
                <Text style={styles.modalContractInfo}>
                  Contratto #{selectedContract.id} - {selectedContract.cliente}
                </Text>
                <Text style={styles.modalCurrentState}>
                  Stato attuale: {STATO_CONFIG[selectedContract.stato].label}
                </Text>

                <Text style={styles.modalSectionTitle}>Seleziona nuovo stato:</Text>
                <View style={styles.statusOptions}>
                  {STATO_CONFIG[selectedContract.stato].next.map((nextStato) => {
                    const nextConfig = STATO_CONFIG[nextStato];
                    return (
                      <TouchableOpacity
                        key={nextStato}
                        style={[styles.statusOption, { backgroundColor: nextConfig.bgColor }]}
                        onPress={() => handleChangeStatus(nextStato)}
                      >
                        <Ionicons name={nextConfig.icon} size={24} color={nextConfig.color} />
                        <Text style={[styles.statusOptionText, { color: nextConfig.color }]}>
                          {nextConfig.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[0.5],
  },
  statiContainer: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statiScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  statoCard: {
    width: 80,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginRight: spacing[2],
  },
  statoCardActive: {
    borderWidth: 2,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  statoCardCount: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    marginTop: spacing[1],
  },
  statoCardLabel: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: spacing[0.5],
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  searchTextInput: {
    flex: 1,
    paddingVertical: spacing[2],
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  sortButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButtonActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta + '20',
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  contractCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  contractIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  contractId: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
    fontFamily: 'monospace',
  },
  contractDate: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  contractBody: {
    marginBottom: spacing[2],
  },
  contractCliente: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  contractAgente: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[0.5],
  },
  contractMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  contractMetaText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  contractGestitoDa: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.blue,
    marginTop: spacing[1],
  },
  contractActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[2],
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  modalBody: {
    padding: spacing[4],
  },
  modalContractInfo: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  modalCurrentState: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  modalSectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginBottom: spacing[3],
  },
  statusOptions: {
    gap: spacing[2],
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  statusOptionText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
  },
});
