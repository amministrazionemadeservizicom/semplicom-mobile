/**
 * Admin Dashboard Screen
 * Collegata alle API reali di sempliswitch
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
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
import { DashboardAPI, AdminDashboardStats, formatImporto } from '../../lib/api';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setError(null);
      const data = await DashboardAPI.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading admin dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento dati');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Caricamento dashboard...</Text>
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
          <Text style={styles.welcomeText}>Dashboard Agenzia</Text>
          <Text style={styles.subtitle}>
            Bentornato, {user?.nomeCognome || 'Admin'}
          </Text>
        </View>
        <Badge variant="default">ADMIN</Badge>
      </View>

      {/* Error State */}
      {error && (
        <Card style={[styles.errorCard, { borderColor: colors.destructive }]}>
          <CardContent>
            <Text style={{ color: colors.destructive }}>{error}</Text>
            <Button variant="outline" size="sm" onPress={loadStats} style={styles.retryButton}>
              Riprova
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statLabel}>Contratti</Text>
            <Text style={styles.statValue}>{stats?.totaleContratti || 0}</Text>
          </CardContent>
        </Card>

        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statLabel}>Offerte</Text>
            <Text style={styles.statValue}>{stats?.totaleOfferte || 0}</Text>
          </CardContent>
        </Card>
      </View>

      {/* Contratti Dettaglio */}
      <Card style={styles.detailCard}>
        <CardHeader>
          <CardTitle>Contratti del Mese</CardTitle>
        </CardHeader>
        <CardContent style={styles.detailContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nuovi contratti</Text>
            <Text style={[styles.detailValue, { color: colors.success }]}>
              +{stats?.contrattiMese || 0}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>In verifica</Text>
            <Text style={[styles.detailValue, { color: colors.warning }]}>
              {stats?.contrattiInVerifica || 0}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Attivati</Text>
            <Text style={[styles.detailValue, { color: colors.success }]}>
              {stats?.contrattiAttivi || 0}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sospesi</Text>
            <Text style={[styles.detailValue, { color: colors.destructive }]}>
              {stats?.contrattiSospesi || 0}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Fatturato */}
      <Card style={styles.detailCard}>
        <CardHeader>
          <CardTitle>Fatturato</CardTitle>
        </CardHeader>
        <CardContent style={styles.detailContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Questo mese</Text>
            <Text style={[styles.detailValue, { color: colors.success }]}>
              {formatImporto(stats?.fatturatoMese || 0)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Totale</Text>
            <Text style={styles.detailValue}>
              {formatImporto(stats?.fatturato || 0)}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <CardHeader>
          <CardTitle>Gestione Agenzia</CardTitle>
        </CardHeader>
        <CardContent style={styles.actionsGrid}>
          <Button
            variant="outline"
            size="sm"
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/contratti')}
          >
            Tutti i Contratti
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/offerte')}
          >
            Gestione Offerte
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/nuova-pratica')}
          >
            Nuova Pratica
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/profilo')}
          >
            Profilo
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    marginBottom: 0,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  statValue: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  detailCard: {
    marginBottom: spacing[4],
  },
  detailContent: {
    gap: spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  detailValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  actionsCard: {
    marginBottom: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
});
