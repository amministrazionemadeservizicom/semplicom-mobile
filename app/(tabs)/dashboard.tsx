/**
 * Dashboard Screen - Per Master e Consulente
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
import { useAuth } from '../../lib/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import { DashboardAPI, AgenteDashboardStats, formatImporto } from '../../lib/api';

export default function DashboardScreen() {
  const { user, userRole } = useAuth();
  const [stats, setStats] = useState<AgenteDashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setError(null);
      const data = await DashboardAPI.getAgenteStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
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

  // Loading state
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
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Bentornato, {user?.nomeCognome || 'Utente'}!
        </Text>
        <Badge variant="secondary">{userRole}</Badge>
      </View>

      {/* Error State */}
      {error && (
        <Card style={[styles.statCard, { borderColor: colors.destructive }]}>
          <CardContent>
            <Text style={{ color: colors.destructive }}>{error}</Text>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Contratti Totali */}
        <Card style={styles.statCard}>
          <CardHeader style={styles.statHeader}>
            <CardTitle style={styles.statTitle}>Contratti Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.statValue}>{stats?.totaleContratti || 0}</Text>
            <Text style={styles.statSubtext}>
              +{stats?.contrattiMese || 0} questo mese
            </Text>
          </CardContent>
        </Card>

        {/* In Verifica */}
        <Card style={styles.statCard}>
          <CardHeader style={styles.statHeader}>
            <CardTitle style={styles.statTitle}>In Verifica</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {stats?.contrattiInVerifica || 0}
            </Text>
            <Text style={styles.statSubtext}>da verificare</Text>
          </CardContent>
        </Card>

        {/* Attivi */}
        <Card style={styles.statCard}>
          <CardHeader style={styles.statHeader}>
            <CardTitle style={styles.statTitle}>Attivi</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {stats?.contrattiAttivi || 0}
            </Text>
            <Text style={styles.statSubtext}>contratti attivati</Text>
          </CardContent>
        </Card>

        {/* Provvigioni */}
        <Card style={styles.statCard}>
          <CardHeader style={styles.statHeader}>
            <CardTitle style={styles.statTitle}>Provvigioni Anno</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {formatImporto(stats?.provvigioniAnno || 0)}
            </Text>
            <Text style={styles.statSubtext}>
              +{formatImporto(stats?.provvigioniMese || 0)} questo mese
            </Text>
          </CardContent>
        </Card>
      </View>

      {/* Azioni Rapide */}
      <Card style={styles.actionsCard}>
        <CardHeader>
          <CardTitle>Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent style={styles.actionsContent}>
          <Text style={styles.actionHint}>
            Usa la barra di navigazione in basso per accedere rapidamente a:
          </Text>
          <View style={styles.actionsList}>
            <Text style={styles.actionItem}>• Offerte - Visualizza le offerte disponibili</Text>
            <Text style={styles.actionItem}>• Contratti - Gestisci i tuoi contratti</Text>
            <Text style={styles.actionItem}>• Nuova Pratica - Crea un nuovo contratto</Text>
            <Text style={styles.actionItem}>• Profilo - Impostazioni account</Text>
          </View>
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
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  welcomeText: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.foreground,
    flex: 1,
  },
  statsGrid: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  statCard: {
    marginBottom: 0,
  },
  statHeader: {
    paddingBottom: spacing[2],
  },
  statTitle: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  statValue: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.foreground,
  },
  statSubtext: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
  actionsCard: {
    marginBottom: 0,
  },
  actionsContent: {
    gap: spacing[3],
  },
  actionHint: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  actionsList: {
    gap: spacing[2],
  },
  actionItem: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
});
