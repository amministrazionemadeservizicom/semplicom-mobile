/**
 * ProductFinder - Ricerca prodotto per confronto bollette (React Native)
 * Form per inserire dati bolletta e trovare offerte migliori
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#3B82F6',
};

type EnergySupply = 'luce' | 'gas';

interface BillSim {
  supplyType: EnergySupply;
  spesaMateriaEnergia: number;
  consumoPeriodo: number;
  periodoDal: string;
  periodoAl: string;
}

// Componente per input
function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  suffix?: string;
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

// Componente per date input
function DateInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.dateInputWrapper}>
        <Ionicons name="calendar-outline" size={20} color={colors.mutedForeground} />
        <TextInput
          style={styles.dateInput}
          value={value}
          onChangeText={onChangeText}
          placeholder="GG/MM/AAAA"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
        />
      </View>
    </View>
  );
}

// Form per tipo fornitura
function SupplyForm({
  type,
  form,
  updateField,
}: {
  type: EnergySupply;
  form: BillSim;
  updateField: (field: keyof BillSim, value: string) => void;
}) {
  const isLuce = type === 'luce';

  return (
    <View style={styles.formContent}>
      <FormInput
        label="Spesa per la materia energia (€)"
        value={form.spesaMateriaEnergia ? form.spesaMateriaEnergia.toString() : ''}
        onChangeText={(text) => updateField('spesaMateriaEnergia', text)}
        placeholder="0.00"
        keyboardType="decimal-pad"
        suffix="€"
      />

      <FormInput
        label={`Consumo nel periodo (${isLuce ? 'kWh' : 'Smc'})`}
        value={form.consumoPeriodo ? form.consumoPeriodo.toString() : ''}
        onChangeText={(text) => updateField('consumoPeriodo', text)}
        placeholder="0"
        keyboardType="number-pad"
        suffix={isLuce ? 'kWh' : 'Smc'}
      />

      <View style={styles.dateRow}>
        <View style={styles.dateCol}>
          <DateInput
            label="Periodo dal"
            value={form.periodoDal}
            onChangeText={(text) => updateField('periodoDal', text)}
          />
        </View>
        <View style={styles.dateCol}>
          <DateInput
            label="Periodo al"
            value={form.periodoAl}
            onChangeText={(text) => updateField('periodoAl', text)}
          />
        </View>
      </View>
    </View>
  );
}

export default function ProductFinder() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Determina quali tipi mostrare (per ora entrambi)
  const hasLuce = true;
  const hasGas = true;
  const showTabs = hasLuce && hasGas;

  const [activeTab, setActiveTab] = useState<EnergySupply>('luce');

  const [formLuce, setFormLuce] = useState<BillSim>({
    supplyType: 'luce',
    spesaMateriaEnergia: 0,
    consumoPeriodo: 0,
    periodoDal: '',
    periodoAl: '',
  });

  const [formGas, setFormGas] = useState<BillSim>({
    supplyType: 'gas',
    spesaMateriaEnergia: 0,
    consumoPeriodo: 0,
    periodoDal: '',
    periodoAl: '',
  });

  // Update field helper
  const updateLuceField = (field: keyof BillSim, value: string) => {
    setFormLuce((prev) => ({
      ...prev,
      [field]:
        field === 'spesaMateriaEnergia' || field === 'consumoPeriodo'
          ? Number(value.replace(',', '.')) || 0
          : value,
    }));
  };

  const updateGasField = (field: keyof BillSim, value: string) => {
    setFormGas((prev) => ({
      ...prev,
      [field]:
        field === 'spesaMateriaEnergia' || field === 'consumoPeriodo'
          ? Number(value.replace(',', '.')) || 0
          : value,
    }));
  };

  // Submit
  const handleSubmit = () => {
    // In produzione: salvare in AsyncStorage e navigare
    // await AsyncStorage.setItem('billSimulation_luce', JSON.stringify(formLuce));
    // await AsyncStorage.setItem('billSimulation_gas', JSON.stringify(formGas));
    router.push('/(tabs)/offerte' as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ricerca Prodotto</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Intro */}
        <View style={styles.introContainer}>
          <View style={styles.introIcon}>
            <Ionicons name="search" size={32} color={SEMPLISWITCH_COLORS.magenta} />
          </View>
          <Text style={styles.introTitle}>Trova l'offerta migliore</Text>
          <Text style={styles.introText}>
            Inserisci i dati della tua bolletta attuale per trovare le offerte più convenienti per te.
          </Text>
        </View>

        {/* Tabs */}
        {showTabs && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'luce' && styles.tabActive]}
              onPress={() => setActiveTab('luce')}
            >
              <Ionicons
                name="flash"
                size={18}
                color={activeTab === 'luce' ? '#FFFFFF' : colors.foreground}
              />
              <Text style={[styles.tabText, activeTab === 'luce' && styles.tabTextActive]}>
                Luce
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'gas' && styles.tabActive]}
              onPress={() => setActiveTab('gas')}
            >
              <Ionicons
                name="flame"
                size={18}
                color={activeTab === 'gas' ? '#FFFFFF' : colors.foreground}
              />
              <Text style={[styles.tabText, activeTab === 'gas' && styles.tabTextActive]}>
                Gas
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Form Card */}
        <Card style={styles.formCard}>
          <CardContent style={styles.formCardContent}>
            <View style={styles.formHeader}>
              <Ionicons
                name={activeTab === 'luce' ? 'flash' : 'flame'}
                size={24}
                color={SEMPLISWITCH_COLORS.magenta}
              />
              <Text style={styles.formTitle}>
                Dati bolletta {activeTab === 'luce' ? 'Luce' : 'Gas'}
              </Text>
            </View>

            {activeTab === 'luce' ? (
              <SupplyForm type="luce" form={formLuce} updateField={updateLuceField} />
            ) : (
              <SupplyForm type="gas" form={formGas} updateField={updateGasField} />
            )}
          </CardContent>
        </Card>

        {/* Azioni */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Annulla</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Continua alle offerte</Text>
            <Ionicons name="arrow-forward" size={18} color="#333333" />
          </TouchableOpacity>
        </View>
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
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  introContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${SEMPLISWITCH_COLORS.magenta}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  introTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  introText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
    padding: spacing[1],
    marginBottom: spacing[4],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
  },
  tabText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    marginBottom: spacing[4],
  },
  formCardContent: {
    padding: spacing[4],
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  formContent: {
    gap: spacing[4],
  },
  inputContainer: {
    gap: spacing[2],
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  inputSuffix: {
    paddingRight: spacing[3],
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  dateCol: {
    flex: 1,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing[3],
  },
  dateInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
  },
  cancelButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
    backgroundColor: SEMPLISWITCH_COLORS.yellow,
  },
  submitButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: '#333333',
  },
});
