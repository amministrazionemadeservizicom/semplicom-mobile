/**
 * GlobalUsers - Gestione Utenti Globale (React Native)
 * Solo per SuperAdmin - CRUD completo utenti di tutte le agenzie
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
  Modal,
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
interface User {
  id: number;
  username: string;
  nomeCognome: string;
  email: string;
  ruolo: 's' | 'a' | 'm' | 'b' | 'c';
  agenzia: string;
  stato: 'ATTIVO' | 'SOSPESO' | 'DISABILITATO';
  dataCreazione: string;
}

// Mock data
const MOCK_USERS: User[] = [
  { id: 1, username: 'mario.rossi', nomeCognome: 'Mario Rossi', email: 'mario@agenzia1.it', ruolo: 'a', agenzia: 'Agenzia Milano', stato: 'ATTIVO', dataCreazione: '2024-01-15' },
  { id: 2, username: 'lucia.bianchi', nomeCognome: 'Lucia Bianchi', email: 'lucia@agenzia1.it', ruolo: 'm', agenzia: 'Agenzia Milano', stato: 'ATTIVO', dataCreazione: '2024-02-20' },
  { id: 3, username: 'giuseppe.verdi', nomeCognome: 'Giuseppe Verdi', email: 'giuseppe@agenzia2.it', ruolo: 'c', agenzia: 'Agenzia Roma', stato: 'ATTIVO', dataCreazione: '2024-03-10' },
  { id: 4, username: 'anna.neri', nomeCognome: 'Anna Neri', email: 'anna@agenzia2.it', ruolo: 'b', agenzia: 'Agenzia Roma', stato: 'SOSPESO', dataCreazione: '2024-01-05' },
  { id: 5, username: 'paolo.gialli', nomeCognome: 'Paolo Gialli', email: 'paolo@agenzia3.it', ruolo: 'c', agenzia: 'Agenzia Napoli', stato: 'ATTIVO', dataCreazione: '2024-04-01' },
  { id: 6, username: 'sara.viola', nomeCognome: 'Sara Viola', email: 'sara@agenzia1.it', ruolo: 'c', agenzia: 'Agenzia Milano', stato: 'DISABILITATO', dataCreazione: '2023-11-20' },
];

// Configurazione ruoli
const ROLE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  s: { label: 'SuperAdmin', color: '#7C3AED', bgColor: '#7C3AED15' },
  a: { label: 'Admin', color: '#4F46E5', bgColor: '#4F46E515' },
  m: { label: 'Master', color: '#2563EB', bgColor: '#2563EB15' },
  b: { label: 'BackOffice', color: '#0891B2', bgColor: '#0891B215' },
  c: { label: 'Consulente', color: '#059669', bgColor: '#05966915' },
};

// Configurazione stati
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  ATTIVO: { label: 'Attivo', color: '#059669', bgColor: '#05966915' },
  SOSPESO: { label: 'Sospeso', color: '#D97706', bgColor: '#D9770615' },
  DISABILITATO: { label: 'Disabilitato', color: '#DC2626', bgColor: '#DC262615' },
};

// Filtro ruoli
type RoleFilter = 'all' | 's' | 'a' | 'm' | 'b' | 'c';
type StatusFilter = 'all' | 'ATTIVO' | 'SOSPESO' | 'DISABILITATO';

// Badge ruolo
function RoleBadge({ ruolo }: { ruolo: string }) {
  const config = ROLE_CONFIG[ruolo] || { label: ruolo, color: colors.mutedForeground, bgColor: colors.muted };
  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// Badge stato
function StatusBadge({ stato }: { stato: string }) {
  const config = STATUS_CONFIG[stato] || { label: stato, color: colors.mutedForeground, bgColor: colors.muted };
  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <View style={[styles.statusDot, { backgroundColor: config.color }]} />
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// Riga utente
function UserRow({ user, onEdit, onToggleStatus }: { user: User; onEdit: () => void; onToggleStatus: () => void }) {
  return (
    <Card style={styles.userCard}>
      <CardContent style={styles.userCardContent}>
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {user.nomeCognome.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.nomeCognome}</Text>
            <Text style={styles.userUsername}>@{user.username}</Text>
          </View>
          <RoleBadge ruolo={user.ruolo} />
        </View>

        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={14} color={colors.mutedForeground} />
            <Text style={styles.detailText}>{user.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={14} color={colors.mutedForeground} />
            <Text style={styles.detailText}>{user.agenzia}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
            <Text style={styles.detailText}>Creato: {new Date(user.dataCreazione).toLocaleDateString('it-IT')}</Text>
          </View>
        </View>

        <View style={styles.userFooter}>
          <StatusBadge stato={user.stato} />
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Ionicons name="pencil-outline" size={18} color={SEMPLISWITCH_COLORS.blue} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onToggleStatus}>
              <Ionicons
                name={user.stato === 'ATTIVO' ? 'pause-outline' : 'play-outline'}
                size={18}
                color={user.stato === 'ATTIVO' ? '#D97706' : '#059669'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

// Chip filtro
function FilterChip({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, selected && styles.filterChipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function GlobalUsers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simula caricamento
    setTimeout(() => {
      setUsers(MOCK_USERS);
      setRefreshing(false);
    }, 1000);
  }, []);

  // Filtra utenti
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filtro ricerca
      const matchesSearch = searchQuery === '' ||
        user.nomeCognome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.agenzia.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro ruolo
      const matchesRole = roleFilter === 'all' || user.ruolo === roleFilter;

      // Filtro stato
      const matchesStatus = statusFilter === 'all' || user.stato === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Toggle stato utente
  const handleToggleStatus = (userId: number) => {
    Alert.alert(
      'Conferma',
      'Vuoi modificare lo stato di questo utente?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Conferma',
          onPress: () => {
            setUsers(prev => prev.map(u => {
              if (u.id === userId) {
                const newStato = u.stato === 'ATTIVO' ? 'SOSPESO' : 'ATTIVO';
                return { ...u, stato: newStato };
              }
              return u;
            }));
          }
        }
      ]
    );
  };

  // Modifica utente
  const handleEdit = (userId: number) => {
    Alert.alert('Modifica', `Modifica utente ID: ${userId}`);
  };

  // Nuovo utente
  const handleNewUser = () => {
    Alert.alert('Nuovo Utente', 'Funzione di creazione utente');
  };

  // Conteggi per statistiche
  const stats = useMemo(() => ({
    totale: users.length,
    attivi: users.filter(u => u.stato === 'ATTIVO').length,
    sospesi: users.filter(u => u.stato === 'SOSPESO').length,
    disabilitati: users.filter(u => u.stato === 'DISABILITATO').length,
  }), [users]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gestione Utenti</Text>
          <Text style={styles.headerSubtitle}>SuperAdmin</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleNewUser}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#2563EB15' }]}>
          <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.totale}</Text>
          <Text style={styles.statLabel}>Totale</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#05966915' }]}>
          <Text style={[styles.statValue, { color: '#059669' }]}>{stats.attivi}</Text>
          <Text style={styles.statLabel}>Attivi</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D9770615' }]}>
          <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.sospesi}</Text>
          <Text style={styles.statLabel}>Sospesi</Text>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca utenti..."
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
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color={showFilters ? '#FFFFFF' : SEMPLISWITCH_COLORS.magenta} />
        </TouchableOpacity>
      </View>

      {/* Filtri espandibili */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Ruolo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <FilterChip label="Tutti" selected={roleFilter === 'all'} onPress={() => setRoleFilter('all')} />
            <FilterChip label="Admin" selected={roleFilter === 'a'} onPress={() => setRoleFilter('a')} />
            <FilterChip label="Master" selected={roleFilter === 'm'} onPress={() => setRoleFilter('m')} />
            <FilterChip label="Consulente" selected={roleFilter === 'c'} onPress={() => setRoleFilter('c')} />
            <FilterChip label="BackOffice" selected={roleFilter === 'b'} onPress={() => setRoleFilter('b')} />
          </ScrollView>

          <Text style={[styles.filterLabel, { marginTop: spacing[3] }]}>Stato</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <FilterChip label="Tutti" selected={statusFilter === 'all'} onPress={() => setStatusFilter('all')} />
            <FilterChip label="Attivi" selected={statusFilter === 'ATTIVO'} onPress={() => setStatusFilter('ATTIVO')} />
            <FilterChip label="Sospesi" selected={statusFilter === 'SOSPESO'} onPress={() => setStatusFilter('SOSPESO')} />
            <FilterChip label="Disabilitati" selected={statusFilter === 'DISABILITATO'} onPress={() => setStatusFilter('DISABILITATO')} />
          </ScrollView>
        </View>
      )}

      {/* Lista utenti */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <UserRow
            user={item}
            onEdit={() => handleEdit(item.id)}
            onToggleStatus={() => handleToggleStatus(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SEMPLISWITCH_COLORS.magenta]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>Nessun utente trovato</Text>
            <Text style={styles.emptySubtext}>Prova a modificare i filtri di ricerca</Text>
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[2],
  },
  searchContainer: {
    flex: 1,
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
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: SEMPLISWITCH_COLORS.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
  },
  filtersContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.muted,
    marginRight: spacing[2],
  },
  filterChipSelected: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
  },
  filterChipText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: fontWeights.medium as any,
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  userCard: {
    marginBottom: spacing[3],
  },
  userCardContent: {
    padding: spacing[4],
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SEMPLISWITCH_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold as any,
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  userName: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  userUsername: {
    fontSize: fontSizes.sm,
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
  userDetails: {
    gap: spacing[2],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  detailText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
});
