/**
 * ContractStatsWidget - Widget statistiche contratti
 * Mostra i contratti inseriti per il mese selezionato, oggi e ieri
 * Stile Sempliswitch
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
};

interface Contract {
  id: string;
  agente_id: string;
  data_inserimento: string;
  cliente: string;
  servizio: string;
  stato: string;
}

interface ContractStatsWidgetProps {
  selectedMonth: number;
  selectedYear: number;
  currentUserRole: string;
  currentUserId: string;
  contracts?: Contract[];
}

const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export function ContractStatsWidget({
  selectedMonth,
  selectedYear,
  currentUserRole = 'consulente',
  currentUserId = 'user1',
  contracts = [],
}: ContractStatsWidgetProps) {
  const stats = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Filter contracts based on user role
    const contrattiFiltrati = contracts.filter(
      (c) => currentUserRole === 'admin' || c.agente_id === currentUserId
    );

    // Total contracts for selected month
    const totalContrattiMese = contrattiFiltrati.filter((c) => {
      const contractDate = new Date(c.data_inserimento);
      return (
        contractDate.getMonth() === selectedMonth &&
        contractDate.getFullYear() === selectedYear
      );
    }).length;

    // Contracts inserted today
    const totalContrattiOggi = contrattiFiltrati.filter((c) => {
      const contractDate = new Date(c.data_inserimento);
      return contractDate.toDateString() === today.toDateString();
    }).length;

    // Contracts inserted yesterday
    const totalContrattiIeri = contrattiFiltrati.filter((c) => {
      const contractDate = new Date(c.data_inserimento);
      return contractDate.toDateString() === yesterday.toDateString();
    }).length;

    return {
      totalContrattiMese,
      totalContrattiOggi,
      totalContrattiIeri,
      selectedMonthName: MONTHS[selectedMonth],
    };
  }, [selectedMonth, selectedYear, currentUserRole, currentUserId, contracts]);

  return (
    <Card style={styles.card}>
      <CardHeader style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={SEMPLISWITCH_COLORS.yellow}
          />
          <CardTitle style={styles.title}>
            Contratti inseriti – {stats.selectedMonthName} {selectedYear}
          </CardTitle>
        </View>
      </CardHeader>

      <CardContent style={styles.content}>
        {/* Main monthly total */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalAmount}>{stats.totalContrattiMese}</Text>
          <Text style={styles.totalLabel}>Contratti totali del mese</Text>
        </View>

        {/* Today and Yesterday stats */}
        <View style={styles.statsGrid}>
          {/* Today */}
          <View style={[styles.statCard, styles.statCardToday]}>
            <View style={styles.statHeader}>
              <Ionicons
                name="sunny-outline"
                size={16}
                color={SEMPLISWITCH_COLORS.yellow}
              />
              <Text style={styles.statLabel}>Totale oggi</Text>
            </View>
            <Text style={styles.statValue}>{stats.totalContrattiOggi}</Text>
          </View>

          {/* Yesterday */}
          <View style={[styles.statCard, styles.statCardYesterday]}>
            <View style={styles.statHeader}>
              <Ionicons
                name="moon-outline"
                size={16}
                color={SEMPLISWITCH_COLORS.yellow}
              />
              <Text style={styles.statLabel}>Totale ieri</Text>
            </View>
            <Text style={styles.statValue}>{stats.totalContrattiIeri}</Text>
          </View>
        </View>

        {/* Additional context info */}
        <View style={styles.contextContainer}>
          <Text style={styles.contextText}>
            {currentUserRole === 'admin'
              ? 'Visualizzando tutti i contratti del sistema'
              : 'Visualizzando solo i tuoi contratti'}
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: SEMPLISWITCH_COLORS.yellow,
  },
  header: {
    paddingBottom: spacing[4],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
    flex: 1,
  },
  content: {
    gap: spacing[6],
  },
  totalContainer: {
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.magenta,
    marginBottom: spacing[2],
  },
  totalLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  statCard: {
    flex: 1,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: SEMPLISWITCH_COLORS.yellow,
    alignItems: 'center',
  },
  statCardToday: {
    backgroundColor: '#FFFBEB', // yellow-50 equivalent
  },
  statCardYesterday: {
    backgroundColor: '#F5F3FF', // purple-50 equivalent
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  statLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
  },
  statValue: {
    fontSize: 28,
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.magenta,
  },
  contextContainer: {
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  contextText: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});

export default ContractStatsWidget;
