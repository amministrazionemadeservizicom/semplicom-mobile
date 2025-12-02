/**
 * AdminDashboard - Dashboard Amministratore
 * Panoramica generale del sistema con KPI
 * Stile Sempliswitch - mirroring sempliswitch web
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { useAuth, ROLES } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AccessDenied } from '../../components/navigation/AccessDenied';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import { DashboardAPI, ContrattiAPI } from '../../lib/api';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#1d4ed8',
};

// Month names in Italian
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

interface KpiCardProps {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  loading?: boolean;
}

function KpiCard({ title, value, icon, iconColor, loading }: KpiCardProps) {
  return (
    <Card style={styles.kpiCard}>
      <CardContent style={styles.kpiContent}>
        <View style={styles.kpiTextContainer}>
          <Text style={styles.kpiTitle}>{title}</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Text style={styles.kpiValue}>{value}</Text>
          )}
        </View>
        <View style={[styles.kpiIconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon} size={28} color={iconColor} />
        </View>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole, user } = useAuth();

  const now = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState({
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // KPI values (matching web version)
  const [oggi, setOggi] = useState(0);
  const [ieri, setIeri] = useState(0);
  const [chiusi, setChiusi] = useState(0);
  const [daLavorare, setDaLavorare] = useState(0);
  const [consulentiAttivi, setConsulentiAttivi] = useState(0);

  const loadMetrics = useCallback(async () => {
    setError(null);
    try {
      // Fetch real data from API
      const contrattiResponse = await ContrattiAPI.list({ size: 200 });
      const contratti = contrattiResponse.content;

      // Date calculations
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);

      const ieri = new Date(oggi);
      ieri.setDate(ieri.getDate() - 1);

      // Filter by selected month/year
      const contrattiMese = contratti.filter(c => {
        const data = new Date(c.tsCreazione || c.tsInserimento || '');
        return data.getMonth() === selected.month && data.getFullYear() === selected.year;
      });

      // Contratti di oggi
      const contrattiOggi = contratti.filter(c => {
        const data = new Date(c.tsCreazione || c.tsInserimento || '');
        data.setHours(0, 0, 0, 0);
        return data.getTime() === oggi.getTime();
      });

      // Contratti di ieri
      const contrattiIeri = contratti.filter(c => {
        const data = new Date(c.tsCreazione || c.tsInserimento || '');
        data.setHours(0, 0, 0, 0);
        return data.getTime() === ieri.getTime();
      });

      // Contratti chiusi (attivati) nel mese selezionato
      const contrattiChiusi = contrattiMese.filter(c => c.stato === 'attivato' || c.stato === 'ok_inserimento');

      // Contratti da lavorare
      const contrattiDaLavorare = contratti.filter(c =>
        c.stato === 'inserito' || c.stato === 'in_verifica' || c.stato === 'lavorazione'
      );

      // Get unique agents count (from contratti)
      const agentiIds = new Set(contratti.map(c => c.agente?.id).filter(Boolean));

      setOggi(contrattiOggi.length);
      setIeri(contrattiIeri.length);
      setChiusi(contrattiChiusi.length);
      setDaLavorare(contrattiDaLavorare.length);
      setConsulentiAttivi(agentiIds.size);
    } catch (e: any) {
      console.error('AdminDashboard metrics error:', e);
      const msg = e?.message || String(e);
      // Handle permission errors gracefully
      if (msg.includes('Missing or insufficient permissions') || msg.includes('permission-denied')) {
        setOggi(0);
        setIeri(0);
        setChiusi(0);
        setDaLavorare(0);
        setConsulentiAttivi(0);
        setError(null);
      } else {
        setError(msg);
        setOggi(0);
        setIeri(0);
        setChiusi(0);
        setDaLavorare(0);
        setConsulentiAttivi(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selected.month, selected.year]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMetrics();
  }, [loadMetrics]);

  const handlePrevMonth = () => {
    setSelected((prev) => {
      if (prev.month === 0) {
        return { month: 11, year: prev.year - 1 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setSelected((prev) => {
      if (prev.month === 11) {
        return { month: 0, year: prev.year + 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  // Access guard - allow admin and superadmin
  const isAdmin = userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN;
  if (!isAdmin) {
    return <AccessDenied message="Accesso negato - sezione riservata agli amministratori." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard Amministratore</Text>
          <Text style={styles.headerSubtitle}>
            Bentornato, {user?.nomeCognome || 'Admin'}
          </Text>
        </View>
        <Badge variant="default">ADMIN</Badge>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.monthDisplay}>
            <Ionicons name="calendar-outline" size={18} color={SEMPLISWITCH_COLORS.magenta} />
            <Text style={styles.monthText}>
              {MONTHS[selected.month]} {selected.year}
            </Text>
          </View>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={colors.destructive} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadMetrics}>
              <Text style={styles.retryText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* KPI Cards Grid - matching web version */}
        <View style={styles.kpiGrid}>
          <KpiCard
            title="Oggi"
            value={oggi}
            icon="document-text-outline"
            iconColor="#3B82F6"
            loading={loading}
          />
          <KpiCard
            title="Ieri"
            value={ieri}
            icon="document-text-outline"
            iconColor="#6366F1"
            loading={loading}
          />
          <KpiCard
            title="Chiusi"
            value={chiusi}
            icon="checkmark-circle-outline"
            iconColor="#22C55E"
            loading={loading}
          />
          <KpiCard
            title="Da Lavorare"
            value={daLavorare}
            icon="time-outline"
            iconColor="#F59E0B"
            loading={loading}
          />
        </View>

        {/* Consulenti Attivi Card */}
        <Card style={styles.consulentiCard}>
          <CardContent style={styles.consulentiContent}>
            <View style={styles.consulentiTextContainer}>
              <Text style={styles.consulentiTitle}>Consulenti attivi</Text>
              {loading ? (
                <ActivityIndicator size="small" color={colors.mutedForeground} />
              ) : (
                <Text style={styles.consulentiValue}>
                  {consulentiAttivi === 0 ? 'Nessun consulente attivo' : consulentiAttivi}
                </Text>
              )}
            </View>
            <View style={[styles.kpiIconContainer, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="people-outline" size={28} color="#3B82F6" />
            </View>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <CardHeader>
            <CardTitle>Gestione Agenzia</CardTitle>
          </CardHeader>
          <CardContent style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/admin-contratti' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: SEMPLISWITCH_COLORS.magenta + '20' }]}>
                <Ionicons name="document-text" size={24} color={SEMPLISWITCH_COLORS.magenta} />
              </View>
              <Text style={styles.actionText}>Contratti</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/users' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: SEMPLISWITCH_COLORS.blue + '20' }]}>
                <Ionicons name="people" size={24} color={SEMPLISWITCH_COLORS.blue} />
              </View>
              <Text style={styles.actionText}>Utenti</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/admin-attendance' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#22C55E20' }]}>
                <Ionicons name="calendar" size={24} color="#22C55E" />
              </View>
              <Text style={styles.actionText}>Presenze</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/offerte' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: SEMPLISWITCH_COLORS.yellow + '40' }]}>
                <Ionicons name="pricetag" size={24} color="#B45309" />
              </View>
              <Text style={styles.actionText}>Offerte</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  monthButton: {
    padding: spacing[2],
  },
  monthDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.muted,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  monthText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  kpiCard: {
    width: '48%',
    flexGrow: 1,
  },
  kpiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiTextContainer: {
    flex: 1,
  },
  kpiTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
  },
  kpiValue: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
    marginTop: spacing[1],
  },
  kpiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consulentiCard: {
    marginTop: spacing[2],
  },
  consulentiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  consulentiTextContainer: {
    flex: 1,
  },
  consulentiTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
  },
  consulentiValue: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
    marginTop: spacing[1],
  },
  actionsCard: {
    marginTop: spacing[2],
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  actionText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
});
