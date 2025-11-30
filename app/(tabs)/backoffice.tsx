/**
 * Back Office Dashboard Screen
 * Collegata alle API reali di sempliswitch
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
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import {
  DashboardAPI,
  BackofficeDashboardStats,
  ContrattiAPI,
  ContrattoDto,
  getStatoColor,
  getStatoLabel,
} from '../../lib/api';

export default function BackofficeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<BackofficeDashboardStats | null>(null);
  const [coda, setCoda] = useState<ContrattoDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);

      // Carica stats e contratti in parallelo
      const [statsData, contrattiResponse] = await Promise.all([
        DashboardAPI.getBackofficeStats(),
        ContrattiAPI.list({ size: 10, stato: 'in_verifica' }),
      ]);

      setStats(statsData);
      setCoda(contrattiResponse.content);
    } catch (err) {
      console.error('Error loading backoffice data:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento dati');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

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
        <Text style={styles.loadingText}>Caricamento backoffice...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Back Office</Text>
          <Text style={styles.subtitle}>
            {user?.nomeCognome || 'Operatore'}
          </Text>
        </View>
        <Badge variant="outline">BACKOFFICE</Badge>
      </View>

      {/* Error State */}
      {error && (
        <Card style={[styles.errorCard, { borderColor: colors.destructive }]}>
          <CardContent>
            <Text style={{ color: colors.destructive }}>{error}</Text>
            <Button variant="outline" size="sm" onPress={loadData} style={styles.retryButton}>
              Riprova
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statLabel}>Da Verificare</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {stats?.contrattiDaVerificare || 0}
            </Text>
          </CardContent>
        </Card>

        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statLabel}>In Lavorazione</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats?.contrattiInLavorazione || 0}
            </Text>
          </CardContent>
        </Card>

        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statLabel}>OK Inserimento</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {stats?.contrattiOkInserimento || 0}
            </Text>
          </CardContent>
        </Card>

        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statLabel}>Sospesi</Text>
            <Text style={[styles.statValue, { color: colors.destructive }]}>
              {stats?.contrattiSospesi || 0}
            </Text>
          </CardContent>
        </Card>
      </View>

      {/* Attivita */}
      <Card style={styles.activityCard}>
        <CardHeader>
          <CardTitle>Attivita</CardTitle>
        </CardHeader>
        <CardContent style={styles.activityContent}>
          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>Contratti oggi</Text>
            <Text style={[styles.activityValue, { color: colors.success }]}>
              +{stats?.contrattiOggi || 0}
            </Text>
          </View>
          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>Contratti settimana</Text>
            <Text style={styles.activityValue}>
              {stats?.contrattiSettimana || 0}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Coda Lavoro */}
      <Card style={styles.queueCard}>
        <CardHeader>
          <CardTitle>Coda di Lavoro</CardTitle>
        </CardHeader>
        <CardContent style={styles.queueContent}>
          {coda.length === 0 ? (
            <Text style={styles.emptyText}>Nessun contratto in coda</Text>
          ) : (
            coda.map((contratto) => (
              <TouchableOpacity
                key={contratto.id}
                style={styles.queueItem}
                onPress={() => router.push(`/contratto/${contratto.id}`)}
              >
                <View style={styles.queueItemLeft}>
                  <Text style={styles.queueClientName}>{getClienteNome(contratto)}</Text>
                  <View style={styles.queueItemMeta}>
                    {contratto.commodity && (
                      <Badge variant="secondary" style={styles.queueBadge}>
                        {contratto.commodity.toUpperCase()}
                      </Badge>
                    )}
                    <Text style={styles.queueDate}>
                      {formatData(contratto.tsCreazione || contratto.tsInserimento)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statoBadge, { backgroundColor: getStatoColor(contratto.stato) }]}>
                  <Text style={styles.statoBadgeText}>{getStatoLabel(contratto.stato)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <Button
            variant="outline"
            size="sm"
            style={styles.viewAllButton}
            onPress={() => router.push('/(tabs)/contratti')}
          >
            Vedi Tutti i Contratti
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
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
  errorCard: {
    marginBottom: spacing[4],
    borderWidth: 1,
  },
  retryButton: {
    marginTop: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[6],
  },
  welcomeText: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  statCard: {
    width: '47%',
    marginBottom: 0,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  statValue: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  activityCard: {
    marginBottom: spacing[4],
  },
  activityContent: {
    gap: spacing[3],
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityLabel: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  activityValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  queueCard: {
    marginBottom: 0,
  },
  queueContent: {
    gap: spacing[3],
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingVertical: spacing[4],
  },
  queueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  queueItemLeft: {
    flex: 1,
  },
  queueClientName: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  queueItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  queueBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing['0.5'],
  },
  queueDate: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  statoBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 4,
  },
  statoBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
    color: colors.white,
  },
  viewAllButton: {
    marginTop: spacing[2],
  },
});
