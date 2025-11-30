/**
 * Contratti Screen - Collegata alle API reali
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import {
  ContrattiAPI,
  ContrattoDto,
  StatoContratto,
  getStatoColor,
  getStatoLabel,
  formatImporto,
} from '../../lib/api';

type StatoFilter = 'tutti' | 'in_verifica' | 'lavorazione' | 'attivato' | 'annullato';

export default function ContrattiScreen() {
  const { token, userRole } = useAuth();
  const router = useRouter();
  const [contratti, setContratti] = useState<ContrattoDto[]>([]);
  const [filteredContratti, setFilteredContratti] = useState<ContrattoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statoFilter, setStatoFilter] = useState<StatoFilter>('tutti');
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadContratti = async () => {
    try {
      setError(null);
      const response = await ContrattiAPI.list({ size: 50 });
      setContratti(response.content);
      setFilteredContratti(response.content);
      setTotalCount(response.totalElements);
    } catch (err) {
      console.error('Error loading contratti:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento contratti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContratti();
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = contratti;

    // Filter by stato
    if (statoFilter !== 'tutti') {
      filtered = filtered.filter((c) => c.stato === statoFilter);
    }

    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.nome?.toLowerCase().includes(search) ||
          c.cognome?.toLowerCase().includes(search) ||
          c.ragioneSociale?.toLowerCase().includes(search) ||
          c.offerta?.nome?.toLowerCase().includes(search) ||
          c.offerta?.nomeGestore?.toLowerCase().includes(search) ||
          c.codiceFiscale?.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search)
      );
    }

    setFilteredContratti(filtered);
  }, [contratti, statoFilter, searchText]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContratti();
    setRefreshing(false);
  };

  const FilterButton = ({
    label,
    value,
    active,
  }: {
    label: string;
    value: StatoFilter;
    active: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={() => setStatoFilter(value)}
    >
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getClienteNome = (contratto: ContrattoDto): string => {
    if (contratto.ragioneSociale) return contratto.ragioneSociale;
    if (contratto.nome && contratto.cognome) return `${contratto.nome} ${contratto.cognome}`;
    if (contratto.nome) return contratto.nome;
    if (contratto.cognome) return contratto.cognome;
    return 'Cliente N/A';
  };

  const formatData = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Caricamento contratti...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <Input
          placeholder="Cerca contratti..."
          value={searchText}
          onChangeText={setSearchText}
          containerStyle={styles.searchInput}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterButtons}
        >
          <FilterButton label="Tutti" value="tutti" active={statoFilter === 'tutti'} />
          <FilterButton
            label="In Verifica"
            value="in_verifica"
            active={statoFilter === 'in_verifica'}
          />
          <FilterButton
            label="Lavorazione"
            value="lavorazione"
            active={statoFilter === 'lavorazione'}
          />
          <FilterButton
            label="Attivato"
            value="attivato"
            active={statoFilter === 'attivato'}
          />
          <FilterButton
            label="Annullato"
            value="annullato"
            active={statoFilter === 'annullato'}
          />
        </ScrollView>

        {/* Counter */}
        <Text style={styles.counterText}>
          {filteredContratti.length} di {totalCount} contratti
        </Text>
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button variant="outline" size="sm" onPress={loadContratti}>
            Riprova
          </Button>
        </View>
      )}

      {/* Contratti List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {filteredContratti.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nessun contratto trovato</Text>
          </View>
        ) : (
          filteredContratti.map((contratto) => (
            <TouchableOpacity
              key={contratto.id}
              onPress={() => router.push(`/contratto/${contratto.id}`)}
            >
              <Card style={styles.contrattoCard}>
                <CardContent style={styles.contrattoContent}>
                  {/* Header */}
                  <View style={styles.contrattoHeader}>
                    <View style={styles.clienteRow}>
                      <Text style={styles.clienteNome}>{getClienteNome(contratto)}</Text>
                    </View>
                    <View style={[styles.statoBadge, { backgroundColor: getStatoColor(contratto.stato) }]}>
                      <Text style={styles.statoBadgeText}>{getStatoLabel(contratto.stato)}</Text>
                    </View>
                  </View>

                  {/* Offerta Info */}
                  <View style={styles.offertaInfo}>
                    <Text style={styles.offertaNome} numberOfLines={1}>
                      {contratto.offerta?.nome || 'Offerta N/A'}
                    </Text>
                    <Badge variant="outline">{contratto.offerta?.nomeGestore || 'N/A'}</Badge>
                  </View>

                  {/* Meta info */}
                  <View style={styles.metaRow}>
                    {contratto.tipoCliente && (
                      <Badge variant="secondary">{contratto.tipoCliente}</Badge>
                    )}
                    {contratto.commodity && (
                      <Badge variant="outline">{contratto.commodity.toUpperCase()}</Badge>
                    )}
                  </View>

                  {/* Footer */}
                  <View style={styles.contrattoFooter}>
                    <Text style={styles.dataCreazione}>
                      {formatData(contratto.tsCreazione || contratto.tsInserimento)}
                    </Text>
                    {contratto.importoNetto !== undefined && contratto.importoNetto > 0 && (
                      <Text style={styles.provvigione}>
                        {formatImporto(contratto.importoNetto)}
                      </Text>
                    )}
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  errorContainer: {
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
  },
  errorText: {
    color: colors.destructive,
    fontSize: fontSizes.sm,
  },
  filtersContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    marginBottom: spacing[3],
  },
  filterButtons: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingBottom: spacing[2],
  },
  filterButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing['1.5'],
    borderRadius: borderRadius.full,
    backgroundColor: colors.muted,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
  },
  filterButtonTextActive: {
    color: colors.primaryForeground,
  },
  counterText: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  emptyContainer: {
    paddingVertical: spacing[12],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  contrattoCard: {
    marginBottom: spacing[3],
  },
  contrattoContent: {
    gap: spacing[2],
  },
  contrattoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  clienteNome: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  statoBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  statoBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
    color: colors.white,
  },
  offertaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offertaNome: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    flex: 1,
    marginRight: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  contrattoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  dataCreazione: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  provvigione: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold as any,
    color: colors.success,
  },
});
