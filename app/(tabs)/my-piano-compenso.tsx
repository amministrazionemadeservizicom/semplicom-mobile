/**
 * Il Mio Piano Compenso - Visualizzazione piano compenso agente (React Native)
 * Read-only view per consulenti/master del loro piano compenso assegnato
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import { PianiCompensoAPI, MyPianoCompenso as MyPianoCompensoType, LineItem } from '../../lib/api';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  green: '#22C55E',
  blue: '#3B82F6',
};

// Use types from API

// Componente per riga compenso
function CompensoRow({ item }: { item: LineItem }) {
  return (
    <View style={styles.compensoRow}>
      <View style={styles.compensoInfo}>
        <Text style={styles.compensoGestore}>{item.gestore}</Text>
        <View style={styles.compensoDetails}>
          <Badge variant="outline" style={styles.compensoBadge}>
            <Text style={styles.compensoBadgeText}>{item.tipoContratto}</Text>
          </Badge>
          <Badge
            variant="outline"
            style={[
              styles.compensoBadge,
              item.tipoCliente === 'Business' ? styles.badgeBusiness : styles.badgeDomestico,
            ]}
          >
            <Text
              style={[
                styles.compensoBadgeText,
                item.tipoCliente === 'Business' ? styles.badgeBusinessText : styles.badgeDomesticoText,
              ]}
            >
              {item.tipoCliente}
            </Text>
          </Badge>
        </View>
        {item.note && <Text style={styles.compensoNote}>{item.note}</Text>}
      </View>
      <View style={styles.compensoAmount}>
        <Text style={styles.compensoValue}>€{item.compensoLordo.toFixed(2)}</Text>
        <Text style={styles.compensoLabel}>lordo</Text>
      </View>
    </View>
  );
}

// Componente per sezione gestore
function GestoreSection({ gestore, items }: { gestore: string; items: LineItem[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card style={styles.gestoreCard}>
      <TouchableOpacity
        style={styles.gestoreHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.gestoreHeaderLeft}>
          <View style={styles.gestoreIcon}>
            <Ionicons name="business" size={20} color={SEMPLISWITCH_COLORS.magenta} />
          </View>
          <Text style={styles.gestoreName}>{gestore}</Text>
          <Badge variant="secondary" style={styles.gestoreCount}>
            <Text style={styles.gestoreCountText}>{items.length}</Text>
          </Badge>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
      {expanded && (
        <CardContent style={styles.gestoreContent}>
          {items.map((item, index) => (
            <CompensoRow key={`${item.tipoContratto}-${item.tipoCliente}-${index}`} item={item} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

export default function MyPianoCompenso() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole, isSuperAdmin } = useAuth();

  const [piano, setPiano] = useState<MyPianoCompensoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect SuperAdmin
  useEffect(() => {
    if (isSuperAdmin) {
      router.replace('/(tabs)/sa-dashboard' as any);
    }
  }, [isSuperAdmin, router]);

  // Load piano compenso
  const loadPiano = useCallback(async () => {
    try {
      // Fetch real data from API
      const response = await PianiCompensoAPI.getMyPiano();
      setPiano(response);
    } catch (error) {
      console.error('Error loading piano compenso:', error);
      setPiano(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPiano();
  }, [loadPiano]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPiano();
  };

  // Raggruppa per gestore
  const itemsByGestore = piano?.lineItems.reduce((acc, item) => {
    if (!acc[item.gestore]) {
      acc[item.gestore] = [];
    }
    acc[item.gestore].push(item);
    return acc;
  }, {} as Record<string, LineItem[]>) || {};

  const gestori = Object.keys(itemsByGestore).sort();

  if (isSuperAdmin) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Il Mio Piano Compenso</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
          <Text style={styles.loadingText}>Caricamento piano compenso...</Text>
        </View>
      ) : !piano ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.mutedForeground} />
          <Text style={styles.emptyText}>Nessun piano assegnato</Text>
          <Text style={styles.emptySubtext}>
            Non hai ancora un piano compenso attivo. Contatta l'amministratore.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Piano Info Card */}
          <Card style={styles.infoCard}>
            <CardContent style={styles.infoContent}>
              <View style={styles.infoHeader}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="document-text" size={28} color={SEMPLISWITCH_COLORS.magenta} />
                </View>
                <View style={styles.infoTitleContainer}>
                  <Text style={styles.infoTitle}>{piano.nome}</Text>
                  <Badge
                    variant={piano.stato === 'attivo' ? 'default' : 'secondary'}
                    style={piano.stato === 'attivo' ? styles.badgeActive : styles.badgeInactive}
                  >
                    <Text
                      style={piano.stato === 'attivo' ? styles.badgeActiveText : styles.badgeInactiveText}
                    >
                      {piano.stato === 'attivo' ? 'ATTIVO' : piano.stato.toUpperCase()}
                    </Text>
                  </Badge>
                </View>
              </View>

              {piano.descrizione && (
                <Text style={styles.infoDescription}>{piano.descrizione}</Text>
              )}

              <View style={styles.infoDates}>
                {piano.dataInizio && (
                  <View style={styles.infoDate}>
                    <Ionicons name="calendar-outline" size={16} color={colors.mutedForeground} />
                    <Text style={styles.infoDateText}>
                      Dal: {new Date(piano.dataInizio).toLocaleDateString('it-IT')}
                    </Text>
                  </View>
                )}
                {piano.dataFine && (
                  <View style={styles.infoDate}>
                    <Ionicons name="calendar" size={16} color={colors.mutedForeground} />
                    <Text style={styles.infoDateText}>
                      Al: {new Date(piano.dataFine).toLocaleDateString('it-IT')}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.infoStats}>
                <View style={styles.infoStat}>
                  <Text style={styles.infoStatValue}>{piano.lineItems.length}</Text>
                  <Text style={styles.infoStatLabel}>Voci</Text>
                </View>
                <View style={styles.infoStat}>
                  <Text style={styles.infoStatValue}>{gestori.length}</Text>
                  <Text style={styles.infoStatLabel}>Gestori</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Gestori Sections */}
          <Text style={styles.sectionTitle}>Dettaglio Compensi</Text>
          {gestori.map(gestore => (
            <GestoreSection
              key={gestore}
              gestore={gestore}
              items={itemsByGestore[gestore]}
            />
          ))}
        </ScrollView>
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
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  loadingText: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
    marginTop: spacing[4],
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  infoCard: {
    marginBottom: spacing[6],
  },
  infoContent: {
    padding: spacing[4],
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${SEMPLISWITCH_COLORS.magenta}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitleContainer: {
    flex: 1,
    gap: spacing[2],
  },
  infoTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  badgeActive: {
    backgroundColor: `${SEMPLISWITCH_COLORS.green}15`,
    alignSelf: 'flex-start',
  },
  badgeActiveText: {
    color: SEMPLISWITCH_COLORS.green,
    fontSize: 10,
    fontWeight: fontWeights.bold as any,
  },
  badgeInactive: {
    backgroundColor: colors.muted,
    alignSelf: 'flex-start',
  },
  badgeInactiveText: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: fontWeights.bold as any,
  },
  infoDescription: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  infoDates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  infoDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  infoDateText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  infoStats: {
    flexDirection: 'row',
    gap: spacing[6],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoStat: {
    alignItems: 'center',
  },
  infoStatValue: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.magenta,
  },
  infoStatLabel: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
    marginBottom: spacing[3],
  },
  gestoreCard: {
    marginBottom: spacing[3],
  },
  gestoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gestoreHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  gestoreIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${SEMPLISWITCH_COLORS.magenta}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gestoreName: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  gestoreCount: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  gestoreCountText: {
    fontSize: 10,
    fontWeight: fontWeights.bold as any,
    color: colors.mutedForeground,
  },
  gestoreContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  compensoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  compensoInfo: {
    flex: 1,
    gap: spacing[1],
  },
  compensoGestore: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  compensoDetails: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  compensoBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  compensoBadgeText: {
    fontSize: 10,
    color: colors.mutedForeground,
  },
  badgeBusiness: {
    backgroundColor: `${SEMPLISWITCH_COLORS.blue}15`,
    borderColor: SEMPLISWITCH_COLORS.blue,
  },
  badgeBusinessText: {
    color: SEMPLISWITCH_COLORS.blue,
  },
  badgeDomestico: {
    backgroundColor: `${SEMPLISWITCH_COLORS.green}15`,
    borderColor: SEMPLISWITCH_COLORS.green,
  },
  badgeDomesticoText: {
    color: SEMPLISWITCH_COLORS.green,
  },
  compensoNote: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    fontStyle: 'italic',
  },
  compensoAmount: {
    alignItems: 'flex-end',
  },
  compensoValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.magenta,
  },
  compensoLabel: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
});
