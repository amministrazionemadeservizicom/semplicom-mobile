/**
 * Nuova Pratica Screen - Form wizard multi-step
 * Collegato alle API reali
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import {
  OfferteAPI,
  OffertaBase,
  ContrattiAPI,
  CreateContrattoPayload,
  TipoCliente,
  getCategoriaColor,
  getCategoriaLabel,
} from '../../lib/api';

type Step = 'categoria' | 'offerta' | 'cliente' | 'fornitura' | 'riepilogo';
type CategoriaType = 'energia' | 'telco' | 'fotovoltaico';

interface FormData {
  // Offerta
  offertaId?: number;
  offertaNome?: string;
  offertaGestore?: string;
  categoria?: CategoriaType;

  // Cliente
  tipoCliente: TipoCliente;
  nome: string;
  cognome: string;
  ragioneSociale: string;
  codiceFiscale: string;
  partitaIva: string;
  email: string;
  telefono: string;

  // Fornitura
  indirizzoFornitura: string;
  indirizzoFatturazione: string;
  pod: string;
  pdr: string;
  telcoNumber: string;
  note: string;
}

const INITIAL_FORM: FormData = {
  tipoCliente: 'privato',
  nome: '',
  cognome: '',
  ragioneSociale: '',
  codiceFiscale: '',
  partitaIva: '',
  email: '',
  telefono: '',
  indirizzoFornitura: '',
  indirizzoFatturazione: '',
  pod: '',
  pdr: '',
  telcoNumber: '',
  note: '',
};

const CATEGORIE = [
  { id: 'energia' as CategoriaType, nome: 'Energia', descrizione: 'Luce e Gas', colore: colors.categoriaLuce },
  { id: 'telco' as CategoriaType, nome: 'Telco', descrizione: 'Fibra e Mobile', colore: colors.categoriaTelefonia },
  { id: 'fotovoltaico' as CategoriaType, nome: 'Fotovoltaico', descrizione: 'Impianti solari', colore: colors.categoriaGas },
];

const TIPI_CLIENTE: { id: TipoCliente; label: string }[] = [
  { id: 'privato', label: 'Privato' },
  { id: 'business', label: 'Business' },
  { id: 'condominio', label: 'Condominio' },
];

export default function NuovaPraticaScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('categoria');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaType | null>(null);

  // Offerte
  const [offerte, setOfferte] = useState<OffertaBase[]>([]);
  const [loadingOfferte, setLoadingOfferte] = useState(false);
  const [selectedOfferta, setSelectedOfferta] = useState<OffertaBase | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carica offerte quando si seleziona categoria
  useEffect(() => {
    if (selectedCategoria) {
      loadOfferte(selectedCategoria);
    }
  }, [selectedCategoria]);

  const loadOfferte = async (categoria: CategoriaType) => {
    setLoadingOfferte(true);
    setError(null);
    try {
      const response = await OfferteAPI.list({ categoria, stato: 'attiva', size: 50 });
      setOfferte(response.content);
    } catch (err) {
      console.error('Error loading offerte:', err);
      setError('Errore caricamento offerte');
    } finally {
      setLoadingOfferte(false);
    }
  };

  const updateForm = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoriaSelect = (categoria: CategoriaType) => {
    setSelectedCategoria(categoria);
    setFormData(prev => ({ ...prev, categoria }));
  };

  const handleOffertaSelect = (offerta: OffertaBase) => {
    setSelectedOfferta(offerta);
    setFormData(prev => ({
      ...prev,
      offertaId: offerta.id,
      offertaNome: offerta.nome,
      offertaGestore: offerta.nomeGestore,
    }));
  };

  const validateStep = (currentStep: Step): boolean => {
    switch (currentStep) {
      case 'categoria':
        return !!selectedCategoria;
      case 'offerta':
        return !!selectedOfferta;
      case 'cliente':
        if (formData.tipoCliente === 'privato') {
          return !!(formData.nome && formData.cognome && formData.codiceFiscale);
        } else {
          return !!(formData.ragioneSociale && formData.partitaIva);
        }
      case 'fornitura':
        return !!formData.indirizzoFornitura;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(step)) {
      Alert.alert('Attenzione', 'Compila tutti i campi obbligatori');
      return;
    }

    const steps: Step[] = ['categoria', 'offerta', 'cliente', 'fornitura', 'riepilogo'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['categoria', 'offerta', 'cliente', 'fornitura', 'riepilogo'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOfferta?.id) {
      Alert.alert('Errore', 'Nessuna offerta selezionata');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateContrattoPayload = {
        idOfferta: selectedOfferta.id,
        tipoCliente: formData.tipoCliente,
        nome: formData.nome || undefined,
        cognome: formData.cognome || undefined,
        ragioneSociale: formData.ragioneSociale || undefined,
        codiceFiscale: formData.codiceFiscale || undefined,
        partitaIva: formData.partitaIva || undefined,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        indirizzoFornitura: formData.indirizzoFornitura || undefined,
        indirizzoFatturazione: formData.indirizzoFatturazione || formData.indirizzoFornitura || undefined,
        pod: formData.pod || undefined,
        pdr: formData.pdr || undefined,
        telcoNumber: formData.telcoNumber || undefined,
        note: formData.note || undefined,
        stato: 'in_verifica',
      };

      await ContrattiAPI.create(payload);

      Alert.alert(
        'Pratica Creata',
        'La pratica è stata inviata correttamente e sarà verificata dal backoffice.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form e torna alla dashboard
              setFormData(INITIAL_FORM);
              setSelectedCategoria(null);
              setSelectedOfferta(null);
              setStep('categoria');
              router.push('/(tabs)/contratti');
            },
          },
        ]
      );
    } catch (err) {
      console.error('Error creating contratto:', err);
      setError(err instanceof Error ? err.message : 'Errore creazione pratica');
      Alert.alert('Errore', 'Impossibile creare la pratica. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepNumber = (): number => {
    const steps: Step[] = ['categoria', 'offerta', 'cliente', 'fornitura', 'riepilogo'];
    return steps.indexOf(step) + 1;
  };

  // Render Steps
  const renderCategoriaStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Seleziona Categoria</Text>
      <Text style={styles.stepSubtitle}>Scegli il tipo di contratto da compilare</Text>

      <View style={styles.categorieGrid}>
        {CATEGORIE.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoriaCard,
              selectedCategoria === cat.id && styles.categoriaCardSelected,
              { borderColor: selectedCategoria === cat.id ? cat.colore : colors.border },
            ]}
            onPress={() => handleCategoriaSelect(cat.id)}
          >
            <View style={[styles.categoriaIndicator, { backgroundColor: cat.colore }]} />
            <View style={styles.categoriaInfo}>
              <Text style={styles.categoriaNome}>{cat.nome}</Text>
              <Text style={styles.categoriaDescrizione}>{cat.descrizione}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderOffertaStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Seleziona Offerta</Text>
      <Text style={styles.stepSubtitle}>
        {offerte.length} offerte disponibili per {getCategoriaLabel(selectedCategoria || 'energia')}
      </Text>

      {loadingOfferte ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : offerte.length === 0 ? (
        <Text style={styles.emptyText}>Nessuna offerta disponibile</Text>
      ) : (
        <ScrollView style={styles.offerteList}>
          {offerte.map((offerta) => (
            <TouchableOpacity
              key={offerta.id}
              style={[
                styles.offertaCard,
                selectedOfferta?.id === offerta.id && styles.offertaCardSelected,
              ]}
              onPress={() => handleOffertaSelect(offerta)}
            >
              <View style={styles.offertaHeader}>
                <Text style={styles.offertaNome}>{offerta.nome}</Text>
                <Badge variant="secondary">{offerta.nomeGestore || 'N/A'}</Badge>
              </View>
              {offerta.note && (
                <Text style={styles.offertaNote} numberOfLines={2}>{offerta.note}</Text>
              )}
              {offerta.bonus && (
                <Text style={styles.offertaBonus}>{offerta.bonus}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderClienteStep = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepTitle}>Dati Cliente</Text>

        {/* Tipo Cliente */}
        <Text style={styles.fieldLabel}>Tipo Cliente *</Text>
        <View style={styles.tipoClienteRow}>
          {TIPI_CLIENTE.map((tipo) => (
            <TouchableOpacity
              key={tipo.id}
              style={[
                styles.tipoClienteBtn,
                formData.tipoCliente === tipo.id && styles.tipoClienteBtnActive,
              ]}
              onPress={() => updateForm('tipoCliente', tipo.id)}
            >
              <Text
                style={[
                  styles.tipoClienteText,
                  formData.tipoCliente === tipo.id && styles.tipoClienteTextActive,
                ]}
              >
                {tipo.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {formData.tipoCliente === 'privato' ? (
          <>
            <Input
              label="Nome *"
              placeholder="Mario"
              value={formData.nome}
              onChangeText={(v) => updateForm('nome', v)}
            />
            <Input
              label="Cognome *"
              placeholder="Rossi"
              value={formData.cognome}
              onChangeText={(v) => updateForm('cognome', v)}
            />
            <Input
              label="Codice Fiscale *"
              placeholder="RSSMRA80A01H501Z"
              value={formData.codiceFiscale}
              onChangeText={(v) => updateForm('codiceFiscale', v.toUpperCase())}
              autoCapitalize="characters"
            />
          </>
        ) : (
          <>
            <Input
              label="Ragione Sociale *"
              placeholder="Azienda S.r.l."
              value={formData.ragioneSociale}
              onChangeText={(v) => updateForm('ragioneSociale', v)}
            />
            <Input
              label="Partita IVA *"
              placeholder="12345678901"
              value={formData.partitaIva}
              onChangeText={(v) => updateForm('partitaIva', v)}
              keyboardType="numeric"
            />
            <Input
              label="Referente"
              placeholder="Nome referente"
              value={formData.nome}
              onChangeText={(v) => updateForm('nome', v)}
            />
          </>
        )}

        <Input
          label="Email"
          placeholder="email@esempio.it"
          value={formData.email}
          onChangeText={(v) => updateForm('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Telefono"
          placeholder="333 1234567"
          value={formData.telefono}
          onChangeText={(v) => updateForm('telefono', v)}
          keyboardType="phone-pad"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderFornituraStep = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepTitle}>Dati Fornitura</Text>

        <Input
          label="Indirizzo Fornitura *"
          placeholder="Via Roma 1, 00100 Roma (RM)"
          value={formData.indirizzoFornitura}
          onChangeText={(v) => updateForm('indirizzoFornitura', v)}
        />

        <Input
          label="Indirizzo Fatturazione"
          placeholder="Lascia vuoto se uguale alla fornitura"
          value={formData.indirizzoFatturazione}
          onChangeText={(v) => updateForm('indirizzoFatturazione', v)}
        />

        {selectedCategoria === 'energia' && (
          <>
            <Input
              label="POD (Luce)"
              placeholder="IT001E..."
              value={formData.pod}
              onChangeText={(v) => updateForm('pod', v.toUpperCase())}
              autoCapitalize="characters"
            />
            <Input
              label="PDR (Gas)"
              placeholder="Codice PDR"
              value={formData.pdr}
              onChangeText={(v) => updateForm('pdr', v)}
            />
          </>
        )}

        {selectedCategoria === 'telco' && (
          <Input
            label="Numero Telefonico"
            placeholder="Per portabilità"
            value={formData.telcoNumber}
            onChangeText={(v) => updateForm('telcoNumber', v)}
            keyboardType="phone-pad"
          />
        )}

        <Input
          label="Note"
          placeholder="Note aggiuntive..."
          value={formData.note}
          onChangeText={(v) => updateForm('note', v)}
          multiline
          numberOfLines={3}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderRiepilogoStep = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Riepilogo</Text>
      <Text style={styles.stepSubtitle}>Verifica i dati prima di inviare</Text>

      <Card style={styles.riepilogoCard}>
        <CardHeader>
          <CardTitle>Offerta</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.riepilogoValue}>{formData.offertaNome}</Text>
          <Text style={styles.riepilogoLabel}>{formData.offertaGestore}</Text>
        </CardContent>
      </Card>

      <Card style={styles.riepilogoCard}>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.riepilogoRow}>
            <Text style={styles.riepilogoLabel}>Tipo:</Text>
            <Text style={styles.riepilogoValue}>{formData.tipoCliente}</Text>
          </View>
          {formData.tipoCliente === 'privato' ? (
            <>
              <View style={styles.riepilogoRow}>
                <Text style={styles.riepilogoLabel}>Nome:</Text>
                <Text style={styles.riepilogoValue}>{formData.nome} {formData.cognome}</Text>
              </View>
              <View style={styles.riepilogoRow}>
                <Text style={styles.riepilogoLabel}>CF:</Text>
                <Text style={styles.riepilogoValue}>{formData.codiceFiscale}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.riepilogoRow}>
                <Text style={styles.riepilogoLabel}>Ragione Sociale:</Text>
                <Text style={styles.riepilogoValue}>{formData.ragioneSociale}</Text>
              </View>
              <View style={styles.riepilogoRow}>
                <Text style={styles.riepilogoLabel}>P.IVA:</Text>
                <Text style={styles.riepilogoValue}>{formData.partitaIva}</Text>
              </View>
            </>
          )}
          {formData.email && (
            <View style={styles.riepilogoRow}>
              <Text style={styles.riepilogoLabel}>Email:</Text>
              <Text style={styles.riepilogoValue}>{formData.email}</Text>
            </View>
          )}
          {formData.telefono && (
            <View style={styles.riepilogoRow}>
              <Text style={styles.riepilogoLabel}>Telefono:</Text>
              <Text style={styles.riepilogoValue}>{formData.telefono}</Text>
            </View>
          )}
        </CardContent>
      </Card>

      <Card style={styles.riepilogoCard}>
        <CardHeader>
          <CardTitle>Fornitura</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.riepilogoRow}>
            <Text style={styles.riepilogoLabel}>Indirizzo:</Text>
            <Text style={styles.riepilogoValue}>{formData.indirizzoFornitura}</Text>
          </View>
          {formData.pod && (
            <View style={styles.riepilogoRow}>
              <Text style={styles.riepilogoLabel}>POD:</Text>
              <Text style={styles.riepilogoValue}>{formData.pod}</Text>
            </View>
          )}
          {formData.pdr && (
            <View style={styles.riepilogoRow}>
              <Text style={styles.riepilogoLabel}>PDR:</Text>
              <Text style={styles.riepilogoValue}>{formData.pdr}</Text>
            </View>
          )}
        </CardContent>
      </Card>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'categoria':
        return renderCategoriaStep();
      case 'offerta':
        return renderOffertaStep();
      case 'cliente':
        return renderClienteStep();
      case 'fornitura':
        return renderFornituraStep();
      case 'riepilogo':
        return renderRiepilogoStep();
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(getStepNumber() / 5) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {getStepNumber()} di 5</Text>
      </View>

      {/* Step Content */}
      <ScrollView style={styles.content}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        {step !== 'categoria' && (
          <Button variant="outline" onPress={prevStep} style={styles.navButton}>
            Indietro
          </Button>
        )}

        {step === 'riepilogo' ? (
          <Button
            variant="default"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            style={[styles.navButton, styles.navButtonPrimary]}
          >
            {submitting ? 'Invio...' : 'Invia Pratica'}
          </Button>
        ) : (
          <Button
            variant="default"
            onPress={nextStep}
            disabled={!validateStep(step)}
            style={[styles.navButton, styles.navButtonPrimary]}
          >
            Avanti
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.muted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: spacing[1],
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: spacing[4],
  },
  stepTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  stepSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[4],
  },
  categorieGrid: {
    gap: spacing[3],
  },
  categoriaCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  categoriaCardSelected: {
    backgroundColor: colors.secondary,
  },
  categoriaIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  categoriaInfo: {
    flex: 1,
  },
  categoriaNome: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  categoriaDescrizione: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
  loader: {
    marginTop: spacing[8],
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  offerteList: {
    maxHeight: 400,
  },
  offertaCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  offertaCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.secondary,
  },
  offertaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offertaNome: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
    flex: 1,
  },
  offertaNote: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[2],
  },
  offertaBonus: {
    fontSize: fontSizes.sm,
    color: colors.success,
    marginTop: spacing[1],
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  tipoClienteRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  tipoClienteBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tipoClienteBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  tipoClienteText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  tipoClienteTextActive: {
    color: colors.primaryForeground,
    fontWeight: fontWeights.medium as any,
  },
  riepilogoCard: {
    marginBottom: spacing[3],
  },
  riepilogoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  riepilogoLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  riepilogoValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing[2],
  },
  errorText: {
    color: colors.destructive,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  navButton: {
    flex: 1,
  },
  navButtonPrimary: {
    flex: 2,
  },
});
