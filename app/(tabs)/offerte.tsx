/**
 * Offerte Screen - Collegata alle API reali
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
import { OfferteAPI, OffertaBase, getCategoriaColor, getCategoriaLabel } from '../../lib/api';

type CategoriaFilter = 'tutti' | 'energia' | 'telco' | 'fotovoltaico';

export default function OfferteScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [offerte, setOfferte] = useState<OffertaBase[]>([]);
  const [filteredOfferte, setFilteredOfferte] = useState<OffertaBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaFilter>('tutti');
  const [error, setError] = useState<string | null>(null);

  const loadOfferte = async () => {
    try {
      setError(null);
      const response = await OfferteAPI.list({ size: 50, stato: 'attiva' });
      setOfferte(response.content);
      setFilteredOfferte(response.content);
    } catch (err) {
      console.error('Error loading offerte:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento offerte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfferte();
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = offerte;

    // Filter by categoria
    if (categoriaFilter !== 'tutti') {
      filtered = filtered.filter((o) => o.categoria === categoriaFilter);
    }

    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.nome.toLowerCase().includes(search) ||
          o.nomeGestore?.toLowerCase().includes(search) ||
          o.note?.toLowerCase().includes(search)
      );
    }

    setFilteredOfferte(filtered);
  }, [offerte, categoriaFilter, searchText]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOfferte();
    setRefreshing(false);
  };

  const FilterButton = ({
    label,
    value,
    active,
  }: {
    label: string;
    value: CategoriaFilter;
    active: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={() => setCategoriaFilter(value)}
    >
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Caricamento offerte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <Input
          placeholder="Cerca offerte..."
          value={searchText}
          onChangeText={setSearchText}
          containerStyle={styles.searchInput}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterButtons}
        >
          <FilterButton label="Tutti" value="tutti" active={categoriaFilter === 'tutti'} />
          <FilterButton label="Energia" value="energia" active={categoriaFilter === 'energia'} />
          <FilterButton label="Telco" value="telco" active={categoriaFilter === 'telco'} />
          <FilterButton
            label="Fotovoltaico"
            value="fotovoltaico"
            active={categoriaFilter === 'fotovoltaico'}
          />
        </ScrollView>
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button variant="outline" size="sm" onPress={loadOfferte}>
            Riprova
          </Button>
        </View>
      )}

      {/* Offerte List */}
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
        {filteredOfferte.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nessuna offerta trovata</Text>
          </View>
        ) : (
          filteredOfferte.map((offerta) => (
            <Card key={offerta.id} style={styles.offertaCard}>
              <CardContent style={styles.offertaContent}>
                <View style={styles.offertaHeader}>
                  <View style={styles.offertaTitleRow}>
                    <Text style={styles.offertaNome}>{offerta.nome}</Text>
                    <View
                      style={[
                        styles.categoriaIndicator,
                        { backgroundColor: getCategoriaColor(offerta.categoria) },
                      ]}
                    />
                  </View>
                  <Badge variant="secondary">{offerta.nomeGestore || 'N/A'}</Badge>
                </View>

                <View style={styles.offertaMeta}>
                  <Badge variant="outline">{getCategoriaLabel(offerta.categoria)}</Badge>
                  {offerta.customer && (
                    <Badge variant="outline">{offerta.customer}</Badge>
                  )}
                </View>

                {offerta.note && (
                  <Text style={styles.offertaDescrizione} numberOfLines={2}>
                    {offerta.note}
                  </Text>
                )}

                {offerta.bonus && (
                  <Text style={styles.offertaBonus}>{offerta.bonus}</Text>
                )}

                <View style={styles.offertaFooter}>
                  {offerta.prodotto && (
                    <Text style={styles.offertaProdotto}>{offerta.prodotto}</Text>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onPress={() => router.push(`/offerta/${offerta.id}`)}
                  >
                    Dettagli
                  </Button>
                </View>
              </CardContent>
            </Card>
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
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.muted,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
  },
  filterButtonTextActive: {
    color: colors.primaryForeground,
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
  offertaCard: {
    marginBottom: spacing[3],
  },
  offertaContent: {
    gap: spacing[3],
  },
  offertaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  offertaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  offertaNome: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
    flex: 1,
  },
  categoriaIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  offertaMeta: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  offertaDescrizione: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  offertaBonus: {
    fontSize: fontSizes.sm,
    color: colors.success,
    fontWeight: fontWeights.medium as any,
  },
  offertaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offertaProdotto: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    flex: 1,
  },
});
