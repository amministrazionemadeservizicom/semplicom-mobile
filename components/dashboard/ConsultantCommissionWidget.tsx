/**
 * ConsultantCommissionWidget - Widget provvigioni consulente
 * Mostra le provvigioni maturate per il mese selezionato
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
  importo_provvigione: number;
  cliente: string;
  servizio: string;
}

interface ConsultantCommissionWidgetProps {
  selectedMonth: number;
  selectedYear: number;
  currentUserId: string;
  contracts?: Contract[];
}

const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export function ConsultantCommissionWidget({
  selectedMonth,
  selectedYear,
  currentUserId = 'user1',
  contracts = [],
}: ConsultantCommissionWidgetProps) {
  const commissionData = useMemo(() => {
    // Filter contracts for current consultant and selected month/year
    const provvigioni = contracts.filter((c) => {
      const date = new Date(c.data_inserimento);
      return (
        c.agente_id === currentUserId &&
        date.getMonth() === selectedMonth &&
        date.getFullYear() === selectedYear
      );
    });

    // Calculate total commission amount
    const totaleProvvigioni = provvigioni.reduce(
      (acc, c) => acc + c.importo_provvigione,
      0
    );

    return {
      totaleProvvigioni,
      numeroContratti: provvigioni.length,
      selectedMonthName: MONTHS[selectedMonth],
    };
  }, [selectedMonth, selectedYear, currentUserId, contracts]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card style={styles.card}>
      <CardHeader style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name="cash-outline"
            size={20}
            color={SEMPLISWITCH_COLORS.yellow}
          />
          <CardTitle style={styles.title}>
            Provvigioni maturate – {commissionData.selectedMonthName} {selectedYear}
          </CardTitle>
        </View>
      </CardHeader>

      <CardContent style={styles.content}>
        {/* Main total */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalAmount}>
            {formatCurrency(commissionData.totaleProvvigioni)}
          </Text>
          <Text style={styles.totalLabel}>Totale maturato questo mese</Text>
        </View>

        {/* Additional context */}
        <View style={styles.contextContainer}>
          <Text style={styles.contextText}>
            {commissionData.numeroContratti === 0
              ? 'Nessun contratto inserito questo mese'
              : `Calcolato su ${commissionData.numeroContratti} contratt${
                  commissionData.numeroContratti !== 1 ? 'i' : 'o'
                } inserit${commissionData.numeroContratti !== 1 ? 'i' : 'o'}`}
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[4],
  },
  header: {
    paddingBottom: spacing[2],
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
    alignItems: 'center',
  },
  totalContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.magenta,
    marginBottom: spacing[2],
  },
  totalLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  contextContainer: {
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: SEMPLISWITCH_COLORS.yellow + '4D', // 30% opacity
    width: '100%',
    alignItems: 'center',
  },
  contextText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});

export default ConsultantCommissionWidget;
