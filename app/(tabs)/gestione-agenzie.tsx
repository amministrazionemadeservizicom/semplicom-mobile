/**
 * GestioneAgenzie - Gestione Agenzie/Tenant (React Native)
 * Solo per SuperAdmin - CRUD agenzie e loro admin
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, CardContent } from '../../components/ui/Card';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#1d4ed8',
};

// Tipi
interface Agenzia {
  id: number;
  ragioneSociale: string;
  piva: string;
  mail: string;
  telefono?: string;
  indirizzo?: string;
  stato: number; // 1 = attiva, 0 = sospesa, -1 = eliminata
  adminName?: string;
  numUtenti: number;
  numContratti: number;
  dataCreazione: string;
}

// Mock data
const MOCK_AGENZIE: Agenzia[] = [
  {
    id: 1,
    ragioneSociale: 'Agenzia Milano Energia',
    piva: '12345678901',
    mail: 'info@agenziamilano.it',
    telefono: '+39 02 1234567',
    indirizzo: 'Via Roma 123, 20121 Milano',
    stato: 1,
    adminName: 'Mario Rossi',
    numUtenti: 15,
    numContratti: 234,
    dataCreazione: '2023-01-15',
  },
  {
    id: 2,
    ragioneSociale: 'Agenzia Roma Power',
    piva: '98765432109',
    mail: 'info@agenziaroma.it',
    telefono: '+39 06 9876543',
    indirizzo: 'Via Nazionale 45, 00184 Roma',
    stato: 1,
    adminName: 'Lucia Bianchi',
    numUtenti: 8,
    numContratti: 156,
    dataCreazione: '2023-03-20',
  },
  {
    id: 3,
    ragioneSociale: 'Agenzia Napoli Gas',
    piva: '11122233344',
    mail: 'info@agenzianapoli.it',
    stato: 0,
    adminName: 'Giuseppe Verdi',
    numUtenti: 5,
    numContratti: 78,
    dataCreazione: '2023-06-10',
  },
  {
    id: 4,
    ragioneSociale: 'Agenzia Torino Luce',
    piva: '55566677788',
    mail: 'info@agenziatorino.it',
    stato: -1,
    numUtenti: 0,
    numContratti: 12,
    dataCreazione: '2022-11-05',
  },
];

type TabFilter = 'active' | 'deleted';

// Configurazione stati
const STATUS_CONFIG: Record<number, { label: string; color: string; bgColor: string }> = {
  1: { label: 'Attiva', color: '#059669', bgColor: '#05966915' },
  0: { label: 'Sospesa', color: '#D97706', bgColor: '#D9770615' },
  [-1]: { label: 'Eliminata', color: '#DC2626', bgColor: '#DC262615' },
};

// Badge stato
function StatusBadge({ stato }: { stato: number }) {
  const config = STATUS_CONFIG[stato] || { label: 'N/D', color: colors.mutedForeground, bgColor: colors.muted };
  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <View style={[styles.statusDot, { backgroundColor: config.color }]} />
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// Stat box
function StatBox({ icon, value, label, color }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Card agenzia
function AgenziaCard({
  agenzia,
  onEdit,
  onToggleStatus,
  onRestore
}: {
  agenzia: Agenzia;
  onEdit: () => void;
  onToggleStatus: () => void;
  onRestore: () => void;
}) {
  const isDeleted = agenzia.stato === -1;

  return (
    <Card style={[styles.agenziaCard, isDeleted && styles.agenziaCardDeleted]}>
      <CardContent style={styles.agenziaCardContent}>
        {/* Header */}
        <View style={styles.agenziaHeader}>
          <View style={styles.agenziaIcon}>
            <Ionicons name="business" size={24} color={isDeleted ? colors.mutedForeground : SEMPLISWITCH_COLORS.blue} />
          </View>
          <View style={styles.agenziaInfo}>
            <Text style={[styles.agenziaName, isDeleted && styles.textMuted]} numberOfLines={1}>
              {agenzia.ragioneSociale}
            </Text>
            <Text style={styles.agenziaPiva}>P.IVA: {agenzia.piva}</Text>
          </View>
          <StatusBadge stato={agenzia.stato} />
        </View>

        {/* Dettagli */}
        <View style={styles.agenziaDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={14} color={colors.mutedForeground} />
            <Text style={styles.detailText}>{agenzia.mail}</Text>
          </View>
          {agenzia.telefono && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={14} color={colors.mutedForeground} />
              <Text style={styles.detailText}>{agenzia.telefono}</Text>
            </View>
          )}
          {agenzia.adminName && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={14} color={colors.mutedForeground} />
              <Text style={styles.detailText}>Admin: {agenzia.adminName}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox icon="people-outline" value={agenzia.numUtenti} label="Utenti" color={SEMPLISWITCH_COLORS.blue} />
          <StatBox icon="document-text-outline" value={agenzia.numContratti} label="Contratti" color={SEMPLISWITCH_COLORS.magenta} />
          <View style={styles.statBox}>
            <Ionicons name="calendar-outline" size={16} color={colors.mutedForeground} />
            <Text style={styles.statDate}>
              {new Date(agenzia.dataCreazione).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}
            </Text>
            <Text style={styles.statLabel}>Creata</Text>
          </View>
        </View>

        {/* Azioni */}
        <View style={styles.agenziaFooter}>
          {isDeleted ? (
            <TouchableOpacity style={styles.restoreButton} onPress={onRestore}>
              <Ionicons name="refresh-outline" size={18} color="#059669" />
              <Text style={styles.restoreButtonText}>Ripristina</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                <Ionicons name="pencil-outline" size={18} color={SEMPLISWITCH_COLORS.blue} />
                <Text style={styles.actionButtonText}>Modifica</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, agenzia.stato === 1 ? styles.suspendButton : styles.activateButton]}
                onPress={onToggleStatus}
              >
                <Ionicons
                  name={agenzia.stato === 1 ? 'pause-outline' : 'play-outline'}
                  size={18}
                  color={agenzia.stato === 1 ? '#D97706' : '#059669'}
                />
                <Text style={[styles.actionButtonText, { color: agenzia.stato === 1 ? '#D97706' : '#059669' }]}>
                  {agenzia.stato === 1 ? 'Sospendi' : 'Attiva'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </CardContent>
    </Card>
  );
}

export default function GestioneAgenzie() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [agenzie, setAgenzie] = useState<Agenzia[]>(MOCK_AGENZIE);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('active');
  const [refreshing, setRefreshing] = useState(false);

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setAgenzie(MOCK_AGENZIE);
      setRefreshing(false);
    }, 1000);
  }, []);

  // Filtra agenzie
  const filteredAgenzie = useMemo(() => {
    return agenzie.filter(a => {
      // Filtro tab
      const matchesTab = activeTab === 'active' ? a.stato !== -1 : a.stato === -1;

      // Filtro ricerca
      const matchesSearch = searchQuery === '' ||
        a.ragioneSociale.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.piva.includes(searchQuery) ||
        a.mail.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [agenzie, activeTab, searchQuery]);

  // Conteggi
  const counts = useMemo(() => ({
    active: agenzie.filter(a => a.stato !== -1).length,
    deleted: agenzie.filter(a => a.stato === -1).length,
  }), [agenzie]);

  // Toggle stato
  const handleToggleStatus = (id: number) => {
    const agenzia = agenzie.find(a => a.id === id);
    if (!agenzia) return;

    const newStato = agenzia.stato === 1 ? 0 : 1;
    const action = agenzia.stato === 1 ? 'sospendere' : 'attivare';

    Alert.alert(
      'Conferma',
      `Vuoi ${action} l'agenzia "${agenzia.ragioneSociale}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Conferma',
          onPress: () => {
            setAgenzie(prev => prev.map(a =>
              a.id === id ? { ...a, stato: newStato } : a
            ));
          }
        }
      ]
    );
  };

  // Ripristina
  const handleRestore = (id: number) => {
    const agenzia = agenzie.find(a => a.id === id);
    if (!agenzia) return;

    Alert.alert(
      'Ripristina Agenzia',
      `Vuoi ripristinare l'agenzia "${agenzia.ragioneSociale}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Ripristina',
          onPress: () => {
            setAgenzie(prev => prev.map(a =>
              a.id === id ? { ...a, stato: 1 } : a
            ));
          }
        }
      ]
    );
  };

  // Modifica
  const handleEdit = (id: number) => {
    Alert.alert('Modifica', `Modifica agenzia ID: ${id}`);
  };

  // Nuova agenzia
  const handleNewAgenzia = () => {
    Alert.alert('Nuova Agenzia', 'Funzione di creazione agenzia con admin');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gestione Agenzie</Text>
          <Text style={styles.headerSubtitle}>SuperAdmin</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <View style={styles.quickActionsInfo}>
          <Ionicons name="business-outline" size={20} color={SEMPLISWITCH_COLORS.blue} />
          <View style={styles.quickActionsText}>
            <Text style={styles.quickActionsTitle}>Azioni Rapide</Text>
            <Text style={styles.quickActionsSubtitle}>Crea nuove agenzie e assegna admin</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newAgenziaButton} onPress={handleNewAgenzia}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.newAgenziaButtonText}>Nuova Agenzia</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Attive ({counts.active})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deleted' && styles.tabActive]}
          onPress={() => setActiveTab('deleted')}
        >
          <Text style={[styles.tabText, activeTab === 'deleted' && styles.tabTextActive]}>
            Eliminate ({counts.deleted})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca agenzie..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredAgenzie}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AgenziaCard
            agenzia={item}
            onEdit={() => handleEdit(item.id)}
            onToggleStatus={() => handleToggleStatus(item.id)}
            onRestore={() => handleRestore(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SEMPLISWITCH_COLORS.magenta]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>
              {activeTab === 'active' ? 'Nessuna agenzia attiva' : 'Nessuna agenzia eliminata'}
            </Text>
          </View>
        }
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.magenta,
    fontWeight: fontWeights.medium as any,
  },
  refreshButton: {
    padding: spacing[2],
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: spacing[4],
    padding: spacing[4],
    backgroundColor: '#2563EB10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#2563EB30',
  },
  quickActionsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  quickActionsText: {
    flex: 1,
  },
  quickActionsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: '#1e40af',
  },
  quickActionsSubtitle: {
    fontSize: fontSizes.xs,
    color: '#3b82f6',
    marginTop: 2,
  },
  newAgenziaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: SEMPLISWITCH_COLORS.blue,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  newAgenziaButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
    padding: spacing[1],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.card,
  },
  tabText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  tabTextActive: {
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  searchSection: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  listContent: {
    padding: spacing[4],
    paddingTop: 0,
    gap: spacing[3],
  },
  agenziaCard: {
    marginBottom: spacing[3],
  },
  agenziaCardDeleted: {
    opacity: 0.7,
  },
  agenziaCardContent: {
    padding: spacing[4],
  },
  agenziaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  agenziaIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: '#2563EB10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agenziaInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  agenziaName: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  agenziaPiva: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  textMuted: {
    color: colors.mutedForeground,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    gap: spacing[1],
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  agenziaDetails: {
    gap: spacing[2],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  detailText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statBox: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
  },
  statDate: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  agenziaFooter: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.muted,
  },
  actionButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: SEMPLISWITCH_COLORS.blue,
  },
  suspendButton: {
    backgroundColor: '#D9770610',
  },
  activateButton: {
    backgroundColor: '#05966910',
  },
  restoreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: '#05966915',
    borderWidth: 1,
    borderColor: '#05966930',
  },
  restoreButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: '#059669',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginTop: spacing[4],
  },
});
