/**
 * Offerte Screen - Catalogo offerte con dati reali
 * Adattata da sempliswitch/client/pages/Offerte.tsx
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { OffertaCard } from '../../components/offerte/OffertaCard';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import { OfferteAPI, OffertaCompleta, OffertaBase } from '../../lib/api/offerte';

type CategoriaFilter = 'tutti' | 'energia' | 'telco' | 'fotovoltaico';
type CommodityFilter = 'tutti' | 'luce' | 'gas';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
};

export default function OfferteScreen() {
  const router = useRouter();
  const { token } = useAuth();

  // State
  const [offerte, setOfferte] = useState<OffertaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtri
  const [searchText, setSearchText] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaFilter>('tutti');
  const [commodityFilter, setCommodityFilter] = useState<CommodityFilter>('tutti');

  // Carrello locale
  const [carrello, setCarrello] = useState<OffertaCompleta[]>([]);

  /**
   * Carica offerte complete dall'API
   */
  const loadOfferte = async () => {
    try {
      setError(null);
      console.log('📋 Caricamento offerte...');

      // 1. Carica lista offerte attive
      const response = await OfferteAPI.list({
        stato: 'attiva',
        size: 100,
        sortBy: 'nome',
        sortDir: 'asc'
      });

      console.log(`📦 Trovate ${response.content.length} offerte base`);

      // 2. Carica dettagli completi per ogni offerta
      const offerteComplete = await Promise.all(
        response.content.map(async (offertaBase) => {
          try {
            if (offertaBase.id) {
              const dettaglio = await OfferteAPI.get(offertaBase.id);
              return dettaglio;
            }
            // Fallback: usa offerta base se non ha id
            return { base: offertaBase } as OffertaCompleta;
          } catch (err) {
            console.warn(`⚠️ Errore caricamento dettaglio offerta ${offertaBase.id}:`, err);
            return { base: offertaBase } as OffertaCompleta;
          }
        })
      );

      console.log(`✅ Caricate ${offerteComplete.length} offerte complete`);

      // DEBUG: mostra struttura prima offerta
      if (offerteComplete.length > 0) {
        console.log('🔍 DEBUG - Struttura prima offerta:', JSON.stringify(offerteComplete[0], null, 2));
      }

      setOfferte(offerteComplete);
    } catch (err) {
      console.error('❌ Errore caricamento offerte:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento offerte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfferte();
  }, []);

  /**
   * Filtra offerte in base ai criteri selezionati
   */
  const filteredOfferte = useMemo(() => {
    let filtered = offerte;

    // Filtra per categoria
    if (categoriaFilter !== 'tutti') {
      filtered = filtered.filter((o) => {
        const cat = o.base?.categoria || (o as any).categoria;
        return cat === categoriaFilter;
      });
    }

    // Filtra per commodity (solo per energia)
    if (commodityFilter !== 'tutti' && categoriaFilter === 'energia') {
      filtered = filtered.filter((o) => {
        return o.energia?.commodity === commodityFilter;
      });
    }

    // Filtra per testo di ricerca
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((o) => {
        const nome = o.base?.nome || (o as any).nome || '';
        const gestore = o.base?.nomeGestore || o.gestore?.nome || (o as any).nomeGestore || '';
        const note = o.base?.note || o.note || '';
        return (
          nome.toLowerCase().includes(search) ||
          gestore.toLowerCase().includes(search) ||
          note.toLowerCase().includes(search)
        );
      });
    }

    return filtered;
  }, [offerte, categoriaFilter, commodityFilter, searchText]);

  /**
   * Refresh manuale
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOfferte();
    setRefreshing(false);
  };

  /**
   * Aggiungi offerta al carrello
   */
  const handleSelect = (offerta: OffertaCompleta) => {
    // Verifica se già nel carrello
    const exists = carrello.find((o) => o.id === offerta.id);
    if (exists) {
      Alert.alert('Attenzione', 'Questa offerta è già nel carrello');
      return;
    }

    setCarrello([...carrello, offerta]);
    Alert.alert(
      'Aggiunto al carrello',
      `${offerta.base?.nome || 'Offerta'} è stata aggiunta al carrello`,
      [
        { text: 'Continua', style: 'cancel' },
        {
          text: 'Vai al carrello',
          onPress: () => router.push('/(tabs)/nuova-pratica')
        }
      ]
    );
  };

  /**
   * Mostra dettagli offerta
   */
  const handleDetails = (offerta: OffertaCompleta) => {
    // TODO: Implementare pagina dettaglio offerta
    Alert.alert(
      offerta.base?.nome || 'Dettagli Offerta',
      [
        `Gestore: ${offerta.base?.nomeGestore || offerta.gestore?.nome || 'N/D'}`,
        `Categoria: ${offerta.base?.categoria || 'N/D'}`,
        offerta.energia ? `Commodity: ${offerta.energia.commodity}` : '',
        offerta.energia ? `Prezzo: ${offerta.energia.prezzo?.toFixed(3)} €/${offerta.energia.commodity === 'luce' ? 'kWh' : 'Smc'}` : '',
        offerta.base?.bonus ? `Bonus: ${offerta.base.bonus}` : '',
        offerta.base?.note ? `Note: ${offerta.base.note}` : '',
      ].filter(Boolean).join('\n')
    );
  };

  /**
   * Componente pulsante filtro
   */
  const FilterButton = ({
    label,
    value,
    active,
    onPress,
  }: {
    label: string;
    value: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
        <Text style={styles.loadingText}>Caricamento offerte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con carrello */}
      {carrello.length > 0 && (
        <TouchableOpacity
          style={styles.carrelloBar}
          onPress={() => router.push('/(tabs)/nuova-pratica')}
        >
          <View style={styles.carrelloContent}>
            <Ionicons name="cart" size={20} color="#000" />
            <Text style={styles.carrelloText}>
              {carrello.length} offert{carrello.length === 1 ? 'a' : 'e'} nel carrello
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
      )}

      {/* Filtri */}
      <View style={styles.filtersContainer}>
        {/* Ricerca */}
        <Input
          placeholder="Cerca per nome o gestore..."
          value={searchText}
          onChangeText={setSearchText}
          containerStyle={styles.searchInput}
        />

        {/* Filtro categoria */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterButtons}
        >
          <FilterButton
            label="Tutti"
            value="tutti"
            active={categoriaFilter === 'tutti'}
            onPress={() => setCategoriaFilter('tutti')}
          />
          <FilterButton
            label="Energia"
            value="energia"
            active={categoriaFilter === 'energia'}
            onPress={() => setCategoriaFilter('energia')}
          />
          <FilterButton
            label="Telco"
            value="telco"
            active={categoriaFilter === 'telco'}
            onPress={() => setCategoriaFilter('telco')}
          />
          <FilterButton
            label="Fotovoltaico"
            value="fotovoltaico"
            active={categoriaFilter === 'fotovoltaico'}
            onPress={() => setCategoriaFilter('fotovoltaico')}
          />
        </ScrollView>

        {/* Filtro commodity (solo per energia) */}
        {categoriaFilter === 'energia' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterButtons}
          >
            <FilterButton
              label="Luce + Gas"
              value="tutti"
              active={commodityFilter === 'tutti'}
              onPress={() => setCommodityFilter('tutti')}
            />
            <FilterButton
              label="Solo Luce"
              value="luce"
              active={commodityFilter === 'luce'}
              onPress={() => setCommodityFilter('luce')}
            />
            <FilterButton
              label="Solo Gas"
              value="gas"
              active={commodityFilter === 'gas'}
              onPress={() => setCommodityFilter('gas')}
            />
          </ScrollView>
        )}
      </View>

      {/* Errore */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
          <Button variant="outline" size="sm" onPress={loadOfferte}>
            Riprova
          </Button>
        </View>
      )}

      {/* Lista offerte */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[SEMPLISWITCH_COLORS.magenta]}
            tintColor={SEMPLISWITCH_COLORS.magenta}
          />
        }
      >
        {/* Contatore risultati */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredOfferte.length} offert{filteredOfferte.length === 1 ? 'a' : 'e'} disponibil{filteredOfferte.length === 1 ? 'e' : 'i'}
          </Text>
        </View>

        {filteredOfferte.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>Nessuna offerta trovata</Text>
            <Text style={styles.emptySubtext}>
              Prova a modificare i filtri di ricerca
            </Text>
          </View>
        ) : (
          filteredOfferte.map((offerta, index) => (
            <OffertaCard
              key={offerta.id || index}
              offerta={offerta}
              onSelect={handleSelect}
              onDetails={handleDetails}
              showActions={true}
            />
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
  carrelloBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SEMPLISWITCH_COLORS.yellow,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  carrelloContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  carrelloText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: '#000',
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
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
  },
  filterButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  errorContainer: {
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
  },
  errorText: {
    color: colors.destructive,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  resultsHeader: {
    marginBottom: spacing[3],
  },
  resultsCount: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  emptyContainer: {
    paddingVertical: spacing[12],
    alignItems: 'center',
    gap: spacing[2],
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
});
