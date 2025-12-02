/**
 * Simulation - Simulatore Luce/Gas avanzato (React Native)
 * Calcola costo annuale/mensile forniture energia
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  green: '#22C55E',
  red: '#EF4444',
  blue: '#3B82F6',
};

type TipoSimulazione = 'luce' | 'gas';
type PrezzoTipo = 'fisso' | 'variabile';
type Fatturazione = 'mensile' | 'bimestrale';

interface CalculationResult {
  quotaEnergia: number;
  trasportoTot: number;
  acciseTot: number;
  quotaFissaTot: number;
  quotaPotenzaTot: number;
  ivaImporto: number;
  totaleAnnuale: number;
  totaleMensile: number;
}

// Componente per input numerico
function NumericInput({
  label,
  value,
  onChangeValue,
  placeholder,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChangeValue: (v: number) => void;
  placeholder?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value ? value.toString() : ''}
          onChangeText={(text) => {
            const num = parseFloat(text.replace(',', '.')) || 0;
            onChangeValue(num);
          }}
          placeholder={placeholder}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.mutedForeground}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

// Componente per selettore
function OptionSelector<T extends string>({
  label,
  options,
  value,
  onSelect,
  icons,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
  icons?: Record<T, string>;
}) {
  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.optionsRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionButton, value === opt.value && styles.optionButtonActive]}
            onPress={() => onSelect(opt.value)}
          >
            {icons && icons[opt.value] && (
              <Ionicons
                name={icons[opt.value] as any}
                size={16}
                color={value === opt.value ? '#FFFFFF' : colors.foreground}
              />
            )}
            <Text style={[styles.optionText, value === opt.value && styles.optionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function Simulation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Tipo di simulazione
  const [tipo, setTipo] = useState<TipoSimulazione>('luce');
  const [prezzoTipo, setPrezzoTipo] = useState<PrezzoTipo>('fisso');
  const [fatturazione, setFatturazione] = useState<Fatturazione>('mensile');

  // Parametri di consumo
  const [consumo, setConsumo] = useState<number>(2700);
  const [potenza, setPotenza] = useState<number>(3);

  // Parametri di prezzo
  const [prezzo, setPrezzo] = useState<number>(0.08);
  const [punPsv, setPunPsv] = useState<number>(0.11);
  const [spread, setSpread] = useState<number>(0.02);

  // Quote e costi fissi
  const [quotaFissa, setQuotaFissa] = useState<number>(10);
  const [quotaPotenza, setQuotaPotenza] = useState<number>(2.1);

  // Trasporto e oneri
  const [trasporto, setTrasporto] = useState<number>(0.011);
  const [accise, setAccise] = useState<number>(0.0227);
  const [iva, setIva] = useState<number>(10);

  // Gas specifico
  const [adeguamentoPcs, setAdeguamentoPcs] = useState<number>(0.019);

  // Confronto bolletta attuale
  const [bollettaAttuale, setBollettaAttuale] = useState<number>(0);
  const [periodicitaAttuale, setPeriodicitaAttuale] = useState<Fatturazione>('mensile');

  // Mostra dettagli
  const [showDetails, setShowDetails] = useState(false);

  // Calcola risultato
  const risultato = useMemo((): CalculationResult => {
    const fasce = fatturazione === 'mensile' ? 12 : 6;
    const quotaFissaTot = quotaFissa * fasce;
    const quotaPotenzaTot = tipo === 'luce' ? quotaPotenza * potenza * fasce : 0;

    const prezzoFinale = prezzoTipo === 'variabile' ? punPsv + spread : prezzo;

    let quotaEnergia = consumo * prezzoFinale;
    let trasportoTot = consumo * trasporto;
    let acciseTot = consumo * accise;

    if (tipo === 'gas') {
      quotaEnergia += consumo * adeguamentoPcs;
    }

    const imponibile = quotaEnergia + quotaFissaTot + trasportoTot + acciseTot + quotaPotenzaTot;
    const ivaImporto = (imponibile * iva) / 100;
    const totaleAnnuale = imponibile + ivaImporto;
    const totaleMensile = totaleAnnuale / 12;

    return {
      quotaEnergia,
      trasportoTot,
      acciseTot,
      quotaFissaTot,
      quotaPotenzaTot,
      ivaImporto,
      totaleAnnuale,
      totaleMensile,
    };
  }, [tipo, prezzoTipo, fatturazione, consumo, potenza, prezzo, punPsv, spread, quotaFissa, quotaPotenza, trasporto, accise, iva, adeguamentoPcs]);

  // Confronto con bolletta attuale
  const attualeAnnua = bollettaAttuale * (periodicitaAttuale === 'mensile' ? 12 : 6);
  const differenza = attualeAnnua - risultato.totaleAnnuale;
  const isRisparmio = differenza > 0;

  const salvaInCarrello = () => {
    // In produzione: salvare in AsyncStorage o API
    Alert.alert('Salvato', 'Dati simulazione salvati nel carrello!');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Ionicons name="calculator" size={24} color={SEMPLISWITCH_COLORS.yellow} />
          <Text style={styles.headerTitle}>
            Simulatore {tipo === 'luce' ? 'Luce' : 'Gas'}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Configurazione */}
        <Card style={styles.configCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <Ionicons name="settings-outline" size={18} color={colors.foreground} />
              <Text style={styles.cardTitleText}>Configurazione</Text>
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {/* Tipo fornitura */}
            <OptionSelector
              label="Tipo Fornitura"
              options={[
                { value: 'luce', label: 'Luce' },
                { value: 'gas', label: 'Gas' },
              ]}
              value={tipo}
              onSelect={setTipo}
              icons={{ luce: 'flash', gas: 'flame' }}
            />

            {/* Tipo prezzo */}
            <OptionSelector
              label="Tipo Prezzo"
              options={[
                { value: 'fisso', label: 'Fisso' },
                { value: 'variabile', label: 'Variabile' },
              ]}
              value={prezzoTipo}
              onSelect={setPrezzoTipo}
            />

            {/* Fatturazione */}
            <OptionSelector
              label="Fatturazione"
              options={[
                { value: 'mensile', label: 'Mensile' },
                { value: 'bimestrale', label: 'Bimestrale' },
              ]}
              value={fatturazione}
              onSelect={setFatturazione}
            />

            {/* Consumo */}
            <NumericInput
              label={`Consumo Annuale (${tipo === 'luce' ? 'kWh' : 'Smc'})`}
              value={consumo}
              onChangeValue={setConsumo}
              placeholder="2700"
            />

            {/* Potenza (solo luce) */}
            {tipo === 'luce' && (
              <NumericInput
                label="Potenza Impegnata (kW)"
                value={potenza}
                onChangeValue={setPotenza}
                placeholder="3"
              />
            )}

            {/* Prezzo */}
            {prezzoTipo === 'fisso' ? (
              <NumericInput
                label={`Prezzo Energia (€/${tipo === 'luce' ? 'kWh' : 'Smc'})`}
                value={prezzo}
                onChangeValue={setPrezzo}
                placeholder="0.080"
              />
            ) : (
              <>
                <NumericInput
                  label={`${tipo === 'luce' ? 'PUN' : 'PSV'} (€/${tipo === 'luce' ? 'kWh' : 'Smc'})`}
                  value={punPsv}
                  onChangeValue={setPunPsv}
                  placeholder="0.110"
                />
                <NumericInput
                  label={`Spread (€/${tipo === 'luce' ? 'kWh' : 'Smc'})`}
                  value={spread}
                  onChangeValue={setSpread}
                  placeholder="0.020"
                />
              </>
            )}

            {/* Quote fisse */}
            <NumericInput
              label="Quota Fissa Mensile (€)"
              value={quotaFissa}
              onChangeValue={setQuotaFissa}
              placeholder="10"
            />

            {tipo === 'luce' && (
              <NumericInput
                label="Quota Potenza (€/kW/mese)"
                value={quotaPotenza}
                onChangeValue={setQuotaPotenza}
                placeholder="2.1"
              />
            )}

            {/* Oneri */}
            <NumericInput
              label={`Trasporto (€/${tipo === 'luce' ? 'kWh' : 'Smc'})`}
              value={trasporto}
              onChangeValue={setTrasporto}
              placeholder="0.011"
            />

            <NumericInput
              label={`Accise (€/${tipo === 'luce' ? 'kWh' : 'Smc'})`}
              value={accise}
              onChangeValue={setAccise}
              placeholder="0.0227"
            />

            <NumericInput
              label="IVA (%)"
              value={iva}
              onChangeValue={setIva}
              placeholder="10"
            />

            {tipo === 'gas' && (
              <NumericInput
                label="Adeguamento PCS (€/Smc)"
                value={adeguamentoPcs}
                onChangeValue={setAdeguamentoPcs}
                placeholder="0.019"
              />
            )}

            {/* Confronto bolletta */}
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionLabel}>Confronto con Bolletta Attuale</Text>

            <NumericInput
              label="Importo Bolletta Attuale (€)"
              value={bollettaAttuale}
              onChangeValue={setBollettaAttuale}
              placeholder="41.00"
            />

            <OptionSelector
              label="Periodicità Attuale"
              options={[
                { value: 'mensile', label: 'Mensile' },
                { value: 'bimestrale', label: 'Bimestrale' },
              ]}
              value={periodicitaAttuale}
              onSelect={setPeriodicitaAttuale}
            />
          </CardContent>
        </Card>

        {/* Risultati */}
        <Card style={styles.resultCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <Ionicons name="cash-outline" size={18} color={SEMPLISWITCH_COLORS.magenta} />
              <Text style={styles.cardTitleText}>Risultati Simulazione</Text>
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {/* Totali */}
            <View style={styles.totalsRow}>
              <View style={[styles.totalBox, styles.totalBoxAnnual]}>
                <Text style={styles.totalValue}>€{risultato.totaleAnnuale.toFixed(2)}</Text>
                <Text style={styles.totalLabel}>Totale Annuale</Text>
              </View>
              <View style={[styles.totalBox, styles.totalBoxMonthly]}>
                <Text style={styles.totalValue}>€{risultato.totaleMensile.toFixed(2)}</Text>
                <Text style={styles.totalLabel}>Totale Mensile</Text>
              </View>
            </View>

            {/* Confronto */}
            {bollettaAttuale > 0 && (
              <View style={[styles.confrontoBox, isRisparmio ? styles.confrontoRisparmio : styles.confrontoSpesa]}>
                <View style={styles.confrontoHeader}>
                  <Text style={styles.confrontoTitle}>
                    Confronto con bolletta attuale (€{attualeAnnua.toFixed(2)}/anno)
                  </Text>
                </View>
                <View style={styles.confrontoResult}>
                  <Ionicons
                    name={isRisparmio ? 'trending-down' : 'trending-up'}
                    size={24}
                    color={isRisparmio ? SEMPLISWITCH_COLORS.green : SEMPLISWITCH_COLORS.red}
                  />
                  <Text style={[styles.confrontoValue, isRisparmio ? styles.textGreen : styles.textRed]}>
                    {isRisparmio ? 'Risparmio' : 'Spesa aggiuntiva'}: €{Math.abs(differenza).toFixed(2)}/anno
                  </Text>
                </View>
              </View>
            )}

            {/* Dettagli */}
            <TouchableOpacity
              style={styles.detailsToggle}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Text style={styles.detailsToggleText}>
                {showDetails ? '▲ Nascondi dettagli' : '▼ Mostra dettagli calcolo'}
              </Text>
            </TouchableOpacity>

            {showDetails && (
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quota energia:</Text>
                  <Text style={styles.detailValue}>€{risultato.quotaEnergia.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trasporto:</Text>
                  <Text style={styles.detailValue}>€{risultato.trasportoTot.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Accise:</Text>
                  <Text style={styles.detailValue}>€{risultato.acciseTot.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quota fissa:</Text>
                  <Text style={styles.detailValue}>€{risultato.quotaFissaTot.toFixed(2)}</Text>
                </View>
                {tipo === 'luce' && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quota potenza:</Text>
                    <Text style={styles.detailValue}>€{risultato.quotaPotenzaTot.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>IVA:</Text>
                  <Text style={styles.detailValue}>€{risultato.ivaImporto.toFixed(2)}</Text>
                </View>
              </View>
            )}

            {/* Azioni */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButtonYellow} onPress={salvaInCarrello}>
                <Ionicons name="cart" size={18} color="#333333" />
                <Text style={styles.actionButtonTextDark}>Salva nel Carrello</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonMagenta}>
                <Ionicons name="document-text" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonTextLight}>Genera Report</Text>
              </TouchableOpacity>
            </View>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerTitle: {
    fontSize: fontSizes.lg,
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
  configCard: {
    marginBottom: spacing[4],
  },
  resultCard: {
    marginBottom: spacing[4],
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  cardTitleText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  cardContent: {
    padding: spacing[4],
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
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  inputSuffix: {
    marginLeft: spacing[2],
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  selectorContainer: {
    gap: spacing[2],
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
  },
  optionButtonActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  optionText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[2],
  },
  sectionLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  totalBox: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  totalBoxAnnual: {
    backgroundColor: `${SEMPLISWITCH_COLORS.blue}15`,
    borderWidth: 1,
    borderColor: `${SEMPLISWITCH_COLORS.blue}30`,
  },
  totalBoxMonthly: {
    backgroundColor: `${SEMPLISWITCH_COLORS.green}15`,
    borderWidth: 1,
    borderColor: `${SEMPLISWITCH_COLORS.green}30`,
  },
  totalValue: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.magenta,
    marginBottom: spacing[1],
  },
  totalLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  confrontoBox: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  confrontoRisparmio: {
    backgroundColor: `${SEMPLISWITCH_COLORS.green}10`,
    borderColor: SEMPLISWITCH_COLORS.green,
  },
  confrontoSpesa: {
    backgroundColor: `${SEMPLISWITCH_COLORS.red}10`,
    borderColor: SEMPLISWITCH_COLORS.red,
  },
  confrontoHeader: {
    marginBottom: spacing[2],
  },
  confrontoTitle: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
    textAlign: 'center',
  },
  confrontoResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  confrontoValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
  },
  textGreen: {
    color: SEMPLISWITCH_COLORS.green,
  },
  textRed: {
    color: SEMPLISWITCH_COLORS.red,
  },
  detailsToggle: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  detailsToggleText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    fontWeight: fontWeights.medium as any,
  },
  detailsContainer: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    gap: spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  detailValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  actionButtonYellow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: SEMPLISWITCH_COLORS.yellow,
  },
  actionButtonMagenta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
  },
  actionButtonTextDark: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: '#333333',
  },
  actionButtonTextLight: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: '#FFFFFF',
  },
});
