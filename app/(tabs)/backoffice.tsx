/**
 * BackOfficeDashboard - Dashboard Back Office
 * Coda lavorazione con filtri, KPI cliccabili e lock contratti
 * Stile Sempliswitch - mirroring sempliswitch web
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
};

interface FilterState {
  status?: string;
  gestore?: string;
  tipologia?: string;
  onlyMine?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  agente?: string;
}

interface ContractLock {
  lockedBy: {
    id: string;
    nome: string;
    cognome: string;
    ruolo: string;
  };
  dataLock: string;
  inScadenza: boolean;
}

interface Contract {
  id: string;
  statoOfferta: string;
  contatto?: {
    nome?: string;
    cognome?: string;
    codiceFiscale?: string;
  };
  creatoDa?: {
    nome?: string;
    cognome?: string;
    ruolo?: string;
  };
  gestore?: string;
  tipologiaContratto?: string;
  dataCreazione: string;
  lock?: ContractLock;
  noteStatoOfferta?: string;
  dataUltimaIntegrazione?: string;
  cronologiaStati?: Array<{ stato: string; dataModifica: string }>;
}

interface KpiCardProps {
  title: string;
  value: number;
  color: string;
  isActive: boolean;
  onPress: () => void;
}

function KpiCard({ title, value, color, isActive, onPress }: KpiCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.kpiCard,
        isActive && { borderColor: color, borderWidth: 2, backgroundColor: color + '10' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    </TouchableOpacity>
  );
}

export default function BackOfficeDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole, user } = useAuth();

  const [filters, setFilters] = useState<FilterState>({});
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);
  const [lockingId, setLockingId] = useState<string | null>(null);

  // Filter modal
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Contract detail modal
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Status update modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const PAGE_SIZE = 25;

  // Access guard - only backoffice
  const isBackOffice = userRole === ROLES.BACK_OFFICE;

  // Load contracts
  const loadContracts = useCallback(async () => {
    if (!isBackOffice) return;

    try {
      setError(null);
      // TODO: Replace with actual API call
      // const data = await adminApi.getContractsFiltered({
      //   status: filters.status,
      //   gestore: filters.gestore,
      //   tipologia: filters.tipologia,
      //   onlyMine: filters.onlyMine,
      //   dateFrom: filters.dateFrom,
      //   dateTo: filters.dateTo,
      //   search: filters.search,
      //   agente: filters.agente,
      //   userId: user?.id,
      // });

      // Mock data
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockContracts: Contract[] = [
        {
          id: '1',
          statoOfferta: 'Caricato',
          contatto: { nome: 'Mario', cognome: 'Rossi', codiceFiscale: 'RSSMRA80A01H501Z' },
          creatoDa: { nome: 'Giuseppe', cognome: 'Verdi', ruolo: 'consulente' },
          gestore: 'A2A',
          tipologiaContratto: 'energia',
          dataCreazione: new Date().toISOString().split('T')[0],
          noteStatoOfferta: 'Attesa documenti',
        },
        {
          id: '2',
          statoOfferta: 'In Lavorazione',
          contatto: { nome: 'Laura', cognome: 'Bianchi', codiceFiscale: 'BNCLRA85B41F205X' },
          creatoDa: { nome: 'Anna', cognome: 'Neri', ruolo: 'consulente' },
          gestore: 'EDISON',
          tipologiaContratto: 'telefonia',
          dataCreazione: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          lock: {
            lockedBy: { id: user?.id?.toString() || '1', nome: user?.nomeCognome?.split(' ')[0] || 'Operatore', cognome: user?.nomeCognome?.split(' ')[1] || '', ruolo: 'backoffice' },
            dataLock: new Date().toISOString(),
            inScadenza: false,
          },
        },
        {
          id: '3',
          statoOfferta: 'Documenti KO',
          contatto: { nome: 'Paolo', cognome: 'Verdi', codiceFiscale: 'VRDPLA90C15L219K' },
          creatoDa: { nome: 'Marco', cognome: 'Russo', ruolo: 'master' },
          gestore: 'A2A',
          tipologiaContratto: 'energia',
          dataCreazione: new Date(Date.now() - 172800000).toISOString().split('T')[0],
          noteStatoOfferta: 'Manca bolletta',
        },
        {
          id: '4',
          statoOfferta: 'Documenti OK',
          contatto: { nome: 'Giulia', cognome: 'Ferrari', codiceFiscale: 'FRRGLI88D55A944P' },
          creatoDa: { nome: 'Luca', cognome: 'Baldi', ruolo: 'consulente' },
          gestore: 'EDISON',
          tipologiaContratto: 'energia',
          dataCreazione: new Date(Date.now() - 259200000).toISOString().split('T')[0],
          cronologiaStati: [{ stato: 'Documenti OK', dataModifica: new Date().toISOString() }],
        },
      ];

      setContracts(mockContracts);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento contratti');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isBackOffice, filters, user?.id]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadContracts();
  }, [loadContracts]);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const nuoveOggi = contracts.filter((c) => new Date(c.dataCreazione).toDateString() === today).length;
    const mieInLavorazione = contracts.filter((c) => c.lock?.lockedBy?.id === user?.id?.toString()).length;
    const teamInLavorazione = contracts.filter((c) => c.lock).length;
    const inAttesaDoc = contracts.filter((c) => c.statoOfferta === 'Documenti KO').length;
    const completateMese = contracts.filter((c) =>
      c.cronologiaStati?.some(
        (s) => s.stato === 'Documenti OK' && new Date(s.dataModifica).getMonth() === new Date().getMonth()
      )
    ).length;
    const scadute = contracts.filter(
      (c) => c.dataUltimaIntegrazione && new Date(c.dataUltimaIntegrazione) < new Date()
    ).length;

    return { nuoveOggi, mieInLavorazione, teamInLavorazione, inAttesaDoc, completateMese, scadute };
  }, [contracts, user?.id]);

  // Handle KPI click
  const handleKpiClick = (filterType: string) => {
    setActiveKpiFilter(filterType === activeKpiFilter ? null : filterType);
    const now = new Date();

    switch (filterType) {
      case 'nuoveOggi':
        setFilters((prev) => ({
          ...prev,
          dateFrom: now.toISOString().split('T')[0],
          dateTo: now.toISOString().split('T')[0],
          status: 'Caricato',
        }));
        break;
      case 'mieInLavorazione':
        setFilters((prev) => ({
          ...prev,
          onlyMine: true,
          status: 'In Lavorazione',
        }));
        break;
      case 'teamInLavorazione':
        setFilters((prev) => ({
          ...prev,
          status: 'In Lavorazione',
        }));
        break;
      case 'inAttesaDoc':
        setFilters((prev) => ({
          ...prev,
          status: 'Documenti KO',
        }));
        break;
      case 'completateMese':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        setFilters((prev) => ({
          ...prev,
          status: 'Documenti OK',
          dateFrom: startOfMonth.toISOString().split('T')[0],
          dateTo: now.toISOString().split('T')[0],
        }));
        break;
      case 'scadute':
        setFilters((prev) => ({
          ...prev,
          status: undefined,
        }));
        break;
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setActiveKpiFilter(null);
  };

  // Lock contract
  const handleLock = async (contract: Contract) => {
    if (!user) return;
    try {
      setLockingId(contract.id);
      // TODO: Replace with actual API call
      // await adminApi.lockContract(contract.id, lockData);

      await new Promise((resolve) => setTimeout(resolve, 300));
      const lockData: ContractLock = {
        lockedBy: {
          id: user.id?.toString() || '',
          nome: user.nomeCognome?.split(' ')[0] || '',
          cognome: user.nomeCognome?.split(' ')[1] || '',
          ruolo: userRole || '',
        },
        dataLock: new Date().toISOString(),
        inScadenza: false,
      };

      setContracts((prev) =>
        prev.map((c) => (c.id === contract.id ? { ...c, lock: lockData, statoOfferta: 'In Lavorazione' } : c))
      );

      Alert.alert('Successo', 'Contratto preso in carico');
    } catch (err) {
      console.error('Lock error:', err);
      Alert.alert('Errore', 'Impossibile bloccare il contratto');
    } finally {
      setLockingId(null);
    }
  };

  // Unlock contract
  const handleUnlock = async (contract: Contract) => {
    try {
      // TODO: Replace with actual API call
      // await adminApi.unlockContract(contract.id);

      await new Promise((resolve) => setTimeout(resolve, 300));
      setContracts((prev) =>
        prev.map((c) => (c.id === contract.id ? { ...c, lock: undefined, statoOfferta: 'Caricato' } : c))
      );

      Alert.alert('Successo', 'Contratto rilasciato');
    } catch (err) {
      console.error('Unlock error:', err);
      Alert.alert('Errore', 'Impossibile rilasciare il contratto');
    }
  };

  // Update status
  const handleUpdateStatus = async () => {
    if (!selectedContract || !newStatus) return;
    try {
      // TODO: Replace with actual API call
      // await adminApi.updateContract(selectedContract.id, { statoOfferta: newStatus });

      await new Promise((resolve) => setTimeout(resolve, 300));
      setContracts((prev) =>
        prev.map((c) => (c.id === selectedContract.id ? { ...c, statoOfferta: newStatus } : c))
      );

      Alert.alert('Successo', 'Stato aggiornato');
      setStatusModalVisible(false);
      setSelectedContract(null);
    } catch (err) {
      console.error('Update status error:', err);
      Alert.alert('Errore', 'Impossibile aggiornare lo stato');
    }
  };

  // Open detail modal
  const openDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setDetailModalVisible(true);
  };

  // Open status modal
  const openStatusModal = (contract: Contract) => {
    setSelectedContract(contract);
    setNewStatus(contract.statoOfferta || '');
    setStatusModalVisible(true);
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(contracts.length / PAGE_SIZE));
  const visibleContracts = contracts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Caricato':
        return SEMPLISWITCH_COLORS.blue;
      case 'In Lavorazione':
        return SEMPLISWITCH_COLORS.yellow;
      case 'Documenti KO':
        return SEMPLISWITCH_COLORS.orange;
      case 'Documenti OK':
        return SEMPLISWITCH_COLORS.green;
      default:
        return colors.mutedForeground;
    }
  };

  if (!isBackOffice) {
    return <AccessDenied message="Accesso negato - sezione riservata al Back Office." />;
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
        <Text style={styles.loadingText}>Caricamento coda lavorazione...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Back Office</Text>
          <Text style={styles.headerSubtitle}>Coda Lavorazione</Text>
        </View>
        {activeKpiFilter && (
          <TouchableOpacity style={styles.filterBadge} onPress={resetFilters}>
            <Text style={styles.filterBadgeText}>{activeKpiFilter}</Text>
            <Ionicons name="close" size={14} color={SEMPLISWITCH_COLORS.blue} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Cerca nome/CF/POD/PDR"
              placeholderTextColor={colors.mutedForeground}
              value={filters.search || ''}
              onChangeText={(text) => setFilters((prev) => ({ ...prev, search: text }))}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="options-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={colors.destructive} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadContracts}>
              <Text style={styles.retryText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
          <View style={styles.kpiRow}>
            <KpiCard
              title="Nuove (oggi)"
              value={stats.nuoveOggi}
              color={SEMPLISWITCH_COLORS.blue}
              isActive={activeKpiFilter === 'nuoveOggi'}
              onPress={() => handleKpiClick('nuoveOggi')}
            />
            <KpiCard
              title="Mie in lavorazione"
              value={stats.mieInLavorazione}
              color={SEMPLISWITCH_COLORS.green}
              isActive={activeKpiFilter === 'mieInLavorazione'}
              onPress={() => handleKpiClick('mieInLavorazione')}
            />
            <KpiCard
              title="Team in lavorazione"
              value={stats.teamInLavorazione}
              color={SEMPLISWITCH_COLORS.yellow}
              isActive={activeKpiFilter === 'teamInLavorazione'}
              onPress={() => handleKpiClick('teamInLavorazione')}
            />
            <KpiCard
              title="In attesa doc"
              value={stats.inAttesaDoc}
              color={SEMPLISWITCH_COLORS.orange}
              isActive={activeKpiFilter === 'inAttesaDoc'}
              onPress={() => handleKpiClick('inAttesaDoc')}
            />
            <KpiCard
              title="Completate (mese)"
              value={stats.completateMese}
              color={SEMPLISWITCH_COLORS.purple}
              isActive={activeKpiFilter === 'completateMese'}
              onPress={() => handleKpiClick('completateMese')}
            />
            <KpiCard
              title="Scadute / SLA"
              value={stats.scadute}
              color={SEMPLISWITCH_COLORS.red}
              isActive={activeKpiFilter === 'scadute'}
              onPress={() => handleKpiClick('scadute')}
            />
          </View>
        </ScrollView>

        {/* Contracts List */}
        <Card style={styles.contractsCard}>
          <CardHeader>
            <CardTitle>Contratti Filtrati ({contracts.length})</CardTitle>
          </CardHeader>
          <CardContent style={styles.contractsList}>
            {visibleContracts.length === 0 ? (
              <Text style={styles.emptyText}>Nessun contratto trovato</Text>
            ) : (
              visibleContracts.map((contract) => (
                <View key={contract.id} style={styles.contractItem}>
                  <View style={styles.contractHeader}>
                    <Badge style={{ backgroundColor: getStatusColor(contract.statoOfferta) }}>
                      {contract.statoOfferta}
                    </Badge>
                    {contract.lock && (
                      <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={12} color={SEMPLISWITCH_COLORS.yellow} />
                        <Text style={styles.lockText}>
                          {contract.lock.lockedBy.nome} {contract.lock.lockedBy.cognome}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.contractBody}>
                    <Text style={styles.contractClient}>
                      {contract.contatto?.nome} {contract.contatto?.cognome}
                    </Text>
                    <Text style={styles.contractCf}>{contract.contatto?.codiceFiscale}</Text>

                    <View style={styles.contractMeta}>
                      <Text style={styles.contractMetaText}>
                        {contract.gestore} • {contract.tipologiaContratto}
                      </Text>
                      <Text style={styles.contractDate}>{formatDate(contract.dataCreazione)}</Text>
                    </View>

                    {contract.creatoDa && (
                      <Text style={styles.contractAgent}>
                        Agente: {contract.creatoDa.nome} {contract.creatoDa.cognome}
                      </Text>
                    )}

                    {contract.noteStatoOfferta && (
                      <Text style={styles.contractNote}>Note: {contract.noteStatoOfferta}</Text>
                    )}
                  </View>

                  <View style={styles.contractActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => openDetails(contract)}>
                      <Ionicons name="eye-outline" size={20} color={SEMPLISWITCH_COLORS.blue} />
                    </TouchableOpacity>

                    {!contract.lock ? (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleLock(contract)}
                        disabled={lockingId === contract.id}
                      >
                        {lockingId === contract.id ? (
                          <ActivityIndicator size="small" color={SEMPLISWITCH_COLORS.green} />
                        ) : (
                          <Ionicons name="lock-closed-outline" size={20} color={SEMPLISWITCH_COLORS.green} />
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.actionButton} onPress={() => handleUnlock(contract)}>
                        <Ionicons name="lock-open-outline" size={20} color={SEMPLISWITCH_COLORS.orange} />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.actionButton} onPress={() => openStatusModal(contract)}>
                      <Ionicons name="create-outline" size={20} color={SEMPLISWITCH_COLORS.purple} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Pagination */}
            {contracts.length > PAGE_SIZE && (
              <View style={styles.pagination}>
                <Text style={styles.paginationText}>
                  Mostrati {visibleContracts.length} di {contracts.length}
                </Text>
                <View style={styles.paginationButtons}>
                  <TouchableOpacity
                    style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <Ionicons name="chevron-back" size={18} color={page <= 1 ? colors.muted : colors.foreground} />
                  </TouchableOpacity>
                  <Text style={styles.pageText}>
                    {page} / {totalPages}
                  </Text>
                  <TouchableOpacity
                    style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={page >= totalPages ? colors.muted : colors.foreground}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} animationType="slide" transparent onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing[4] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtri</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.filterLabel}>Gestore</Text>
              <View style={styles.filterOptions}>
                {['Tutti', 'A2A', 'EDISON'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.filterOption,
                      filters.gestore === (opt === 'Tutti' ? undefined : opt) && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters((prev) => ({ ...prev, gestore: opt === 'Tutti' ? undefined : opt }))}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.gestore === (opt === 'Tutti' ? undefined : opt) && styles.filterOptionTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Tipologia</Text>
              <View style={styles.filterOptions}>
                {['Tutte', 'energia', 'telefonia'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.filterOption,
                      filters.tipologia === (opt === 'Tutte' ? undefined : opt) && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters((prev) => ({ ...prev, tipologia: opt === 'Tutte' ? undefined : opt }))}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.tipologia === (opt === 'Tutte' ? undefined : opt) && styles.filterOptionTextActive,
                      ]}
                    >
                      {opt === 'Tutte' ? 'Tutte' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Stato</Text>
              <View style={styles.filterOptions}>
                {['Tutti', 'Caricato', 'In Lavorazione', 'Documenti KO', 'Documenti OK'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.filterOption,
                      filters.status === (opt === 'Tutti' ? undefined : opt) && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters((prev) => ({ ...prev, status: opt === 'Tutti' ? undefined : opt }))}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.status === (opt === 'Tutti' ? undefined : opt) && styles.filterOptionTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button variant="outline" onPress={resetFilters} style={styles.modalButton}>
                Reset
              </Button>
              <Button onPress={() => setFilterModalVisible(false)} style={styles.modalButton}>
                Applica
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDetailModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing[4] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dettaglio Contratto</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {selectedContract && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.detailLabel}>Cliente</Text>
                <Text style={styles.detailValue}>
                  {selectedContract.contatto?.nome} {selectedContract.contatto?.cognome}
                </Text>

                <Text style={styles.detailLabel}>Codice Fiscale</Text>
                <Text style={styles.detailValue}>{selectedContract.contatto?.codiceFiscale || '-'}</Text>

                <Text style={styles.detailLabel}>Gestore</Text>
                <Text style={styles.detailValue}>{selectedContract.gestore || '-'}</Text>

                <Text style={styles.detailLabel}>Tipologia</Text>
                <Text style={styles.detailValue}>{selectedContract.tipologiaContratto || '-'}</Text>

                <Text style={styles.detailLabel}>Data Creazione</Text>
                <Text style={styles.detailValue}>{formatDate(selectedContract.dataCreazione)}</Text>

                <Text style={styles.detailLabel}>Stato</Text>
                <Text style={styles.detailValue}>{selectedContract.statoOfferta}</Text>

                {selectedContract.noteStatoOfferta && (
                  <>
                    <Text style={styles.detailLabel}>Note</Text>
                    <Text style={styles.detailValue}>{selectedContract.noteStatoOfferta}</Text>
                  </>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <Button onPress={() => setDetailModalVisible(false)} style={styles.modalButton}>
                Chiudi
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal visible={statusModalVisible} animationType="slide" transparent onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setStatusModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing[4] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aggiorna Stato</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.filterLabel}>Nuovo Stato</Text>
              <View style={styles.filterOptions}>
                {['Caricato', 'In Lavorazione', 'Documenti KO', 'Documenti OK'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.filterOption, newStatus === opt && styles.filterOptionActive]}
                    onPress={() => setNewStatus(opt)}
                  >
                    <Text style={[styles.filterOptionText, newStatus === opt && styles.filterOptionTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Button variant="outline" onPress={() => setStatusModalVisible(false)} style={styles.modalButton}>
                Annulla
              </Button>
              <Button onPress={handleUpdateStatus} style={styles.modalButton}>
                Salva
              </Button>
            </View>
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
    marginTop: spacing[1],
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: SEMPLISWITCH_COLORS.blue + '20',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  filterBadgeText: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.blue,
    fontWeight: fontWeights.medium as any,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  searchRow: {
    flexDirection: 'row',
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
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  errorText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.destructive,
  },
  retryText: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.blue,
    fontWeight: fontWeights.medium as any,
  },
  kpiScroll: {
    marginHorizontal: -spacing[4],
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  kpiCard: {
    width: 130,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiTitle: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  kpiValue: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold as any,
  },
  contractsCard: {
    marginTop: spacing[2],
  },
  contractsList: {
    gap: spacing[3],
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingVertical: spacing[4],
  },
  contractItem: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: SEMPLISWITCH_COLORS.yellow + '30',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  lockText: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.yellow,
    fontWeight: fontWeights.medium as any,
  },
  contractBody: {
    marginBottom: spacing[2],
  },
  contractClient: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  contractCf: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: spacing[0.5],
  },
  contractMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  contractMetaText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  contractDate: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  contractAgent: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
  contractNote: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: spacing[1],
    fontStyle: 'italic',
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
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paginationText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  pageButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
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
    maxHeight: '80%',
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
  modalFooter: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
  },
  filterLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  filterOption: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta + '20',
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  filterOptionText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  filterOptionTextActive: {
    color: SEMPLISWITCH_COLORS.magenta,
    fontWeight: fontWeights.medium as any,
  },
  detailLabel: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: spacing[3],
  },
  detailValue: {
    fontSize: fontSizes.base,
    color: colors.foreground,
    marginTop: spacing[1],
  },
});
