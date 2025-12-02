/**
 * CompileContractMulti - Wizard multi-step per compilazione contratti multipli
 * Con supporto OCR per documento identità e fatture
 *
 * Flusso:
 * Step 0: Upload documento identità (con OCR)
 * Step 1: Dati comuni cliente (auto-fill da OCR)
 * Step 2: Dati per ogni contratto (upload fattura con OCR)
 * Step 3: Conferma e creazione contratti
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AccessDenied } from '../../components/navigation/AccessDenied';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#1d4ed8',
  green: '#22C55E',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
};

// Tipi
type TipoCliente = 'privato' | 'business' | 'condominio';
type TipoDocumento = 'carta_identita' | 'patente' | 'passaporto';
type MetodoPagamento = 'rid' | 'bollettino';
type TipoOperazione = 'switch' | 'switch_con_voltura' | 'subentro' | 'prima_attivazione' | 'nuova_linea' | 'portabilita';

interface FileDoc {
  name: string;
  uri: string;
  type?: string;
}

interface ContrattoData {
  offertaId: number;
  offertaNome: string;
  gestoreNome: string;
  categoria: 'luce' | 'gas' | 'telco' | 'fotovoltaico';
  tipoOperazione?: TipoOperazione;
  fatturaFiles: FileDoc[];
  altriAllegatiFiles: FileDoc[];
  // Dati specifici per energia
  podPdr?: string;
  consumoAnnuo?: string;
  potenza?: string;
  // Dati specifici per telco
  numeroPortare?: string;
  operatoreProvenienza?: string;
  // Note
  note?: string;
}

interface DatiCliente {
  tipoCliente: TipoCliente;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
  luogoNascita: string;
  indirizzo: string;
  civico: string;
  cap: string;
  comune: string;
  provincia: string;
  telefono: string;
  cellulare: string;
  email: string;
  pec?: string;
  // Business
  ragioneSociale?: string;
  partitaIva?: string;
  // Pagamento
  metodoPagamento: MetodoPagamento;
  iban?: string;
  ibanTerzaParte: boolean;
  terzaParteNome?: string;
  terzaParteCognome?: string;
  terzaParteCF?: string;
}

interface OcrResult {
  nome?: string;
  cognome?: string;
  codiceFiscale?: string;
  dataNascita?: string;
  luogoNascita?: string;
  indirizzo?: string;
  comune?: string;
  cap?: string;
  provincia?: string;
  // Per fatture
  podPdr?: string;
  consumoAnnuo?: string;
  potenza?: string;
}

// Mock offerte selezionate (arrivano da router params)
const MOCK_OFFERTE_CARRELLO = [
  { id: 1, nome: 'Luce Verde Plus', gestore: 'Enel', categoria: 'luce' as const },
  { id: 2, nome: 'Gas Casa Sicura', gestore: 'Eni', categoria: 'gas' as const },
];

// Mock clienti per ricerca
const MOCK_CLIENTI = [
  { id: 1, nome: 'Mario', cognome: 'Rossi', codiceFiscale: 'RSSMRA80A01H501U', telefono: '3331234567', email: 'mario.rossi@email.it' },
  { id: 2, nome: 'Luigi', cognome: 'Verdi', codiceFiscale: 'VRDLGU75B02F205X', telefono: '3339876543', email: 'luigi.verdi@email.it' },
];

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View style={styles.stepIndicatorContainer}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View key={i} style={styles.stepIndicatorItem}>
          <View style={[
            styles.stepDot,
            i < currentStep && styles.stepDotCompleted,
            i === currentStep && styles.stepDotCurrent,
          ]}>
            {i < currentStep ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : (
              <Text style={[
                styles.stepDotText,
                (i === currentStep || i < currentStep) && styles.stepDotTextActive
              ]}>
                {i}
              </Text>
            )}
          </View>
          {i < totalSteps - 1 && (
            <View style={[
              styles.stepLine,
              i < currentStep && styles.stepLineCompleted
            ]} />
          )}
        </View>
      ))}
    </View>
  );
}

// Step labels
const STEP_LABELS = [
  'Documento',
  'Dati Cliente',
  'Contratti',
  'Conferma',
];

export default function CompileContractMulti() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { userRole, user } = useAuth();

  // Current step (0-3)
  const [currentStep, setCurrentStep] = useState(0);

  // Step 0: Documento identità
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('carta_identita');
  const [documentoFiles, setDocumentoFiles] = useState<FileDoc[]>([]);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

  // Step 1: Dati cliente
  const [datiCliente, setDatiCliente] = useState<DatiCliente>({
    tipoCliente: 'privato',
    nome: '',
    cognome: '',
    codiceFiscale: '',
    dataNascita: '',
    luogoNascita: '',
    indirizzo: '',
    civico: '',
    cap: '',
    comune: '',
    provincia: '',
    telefono: '',
    cellulare: '',
    email: '',
    metodoPagamento: 'rid',
    ibanTerzaParte: false,
  });

  // Ricerca cliente esistente
  const [searchClienteQuery, setSearchClienteQuery] = useState('');
  const [searchingCliente, setSearchingCliente] = useState(false);
  const [clientiTrovati, setClientiTrovati] = useState<any[]>([]);
  const [clienteSelezionato, setClienteSelezionato] = useState<any | null>(null);
  const [showClienteSearch, setShowClienteSearch] = useState(false);

  // Step 2: Contratti
  const [contratti, setContratti] = useState<ContrattoData[]>([]);
  const [currentContrattoIndex, setCurrentContrattoIndex] = useState(0);
  const [processingFatturaOcr, setProcessingFatturaOcr] = useState<number | null>(null);

  // Step 3: Conferma
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Initialize contratti from offerte in carrello
  useEffect(() => {
    // In produzione: leggere da params.offerte
    const offerte = MOCK_OFFERTE_CARRELLO;
    const initialContratti: ContrattoData[] = offerte.map(o => ({
      offertaId: o.id,
      offertaNome: o.nome,
      gestoreNome: o.gestore,
      categoria: o.categoria,
      fatturaFiles: [],
      altriAllegatiFiles: [],
    }));
    setContratti(initialContratti);
  }, []);

  // Apply OCR result to dati cliente
  useEffect(() => {
    if (ocrResult) {
      setDatiCliente(prev => ({
        ...prev,
        nome: ocrResult.nome || prev.nome,
        cognome: ocrResult.cognome || prev.cognome,
        codiceFiscale: ocrResult.codiceFiscale || prev.codiceFiscale,
        dataNascita: ocrResult.dataNascita || prev.dataNascita,
        luogoNascita: ocrResult.luogoNascita || prev.luogoNascita,
        indirizzo: ocrResult.indirizzo || prev.indirizzo,
        comune: ocrResult.comune || prev.comune,
        cap: ocrResult.cap || prev.cap,
        provincia: ocrResult.provincia || prev.provincia,
      }));
    }
  }, [ocrResult]);

  // Access guard
  const isBackoffice = userRole === ROLES.BACK_OFFICE;
  if (isBackoffice) {
    return <AccessDenied message="Questa funzione è riservata ai consulenti." />;
  }

  // --- Document Handling ---
  const pickDocumento = async (source: 'file' | 'camera') => {
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permesso negato', 'È necessario il permesso per usare la fotocamera');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const newFile: FileDoc = {
            name: `documento_${Date.now()}.jpg`,
            uri: result.assets[0].uri,
            type: 'image/jpeg',
          };
          setDocumentoFiles(prev => [...prev, newFile]);
          processDocumentoOcr(newFile);
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/*'],
          multiple: true,
        });

        if (!result.canceled && result.assets) {
          const newFiles = result.assets.map(asset => ({
            name: asset.name,
            uri: asset.uri,
            type: asset.mimeType,
          }));
          setDocumentoFiles(prev => [...prev, ...newFiles]);
          if (newFiles.length > 0) {
            processDocumentoOcr(newFiles[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Errore', 'Impossibile caricare il documento');
    }
  };

  const processDocumentoOcr = async (file: FileDoc) => {
    setIsProcessingOcr(true);
    try {
      // In produzione: chiamata API OCR
      // const result = await ocrApi.processDocument(file);
      // setOcrResult(result);

      // Mock OCR
      await new Promise(resolve => setTimeout(resolve, 2000));
      setOcrResult({
        nome: 'Mario',
        cognome: 'Rossi',
        codiceFiscale: 'RSSMRA80A01H501U',
        dataNascita: '01/01/1980',
        luogoNascita: 'Roma',
        indirizzo: 'Via Roma',
        comune: 'Roma',
        cap: '00100',
        provincia: 'RM',
      });

      Alert.alert('OCR Completato', 'I dati sono stati estratti dal documento. Verifica e completa i campi mancanti.');
    } catch (err) {
      console.error('OCR error:', err);
      Alert.alert('Attenzione', 'Impossibile estrarre i dati automaticamente. Inserisci i dati manualmente.');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const removeDocumentoFile = (index: number) => {
    setDocumentoFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- Fattura Handling ---
  const pickFattura = async (contrattoIndex: number, source: 'file' | 'camera') => {
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permesso negato', 'È necessario il permesso per usare la fotocamera');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const newFile: FileDoc = {
            name: `fattura_${Date.now()}.jpg`,
            uri: result.assets[0].uri,
            type: 'image/jpeg',
          };
          updateContratto(contrattoIndex, 'fatturaFiles', [
            ...contratti[contrattoIndex].fatturaFiles,
            newFile,
          ]);
          processFatturaOcr(contrattoIndex, newFile);
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/*'],
          multiple: true,
        });

        if (!result.canceled && result.assets) {
          const newFiles = result.assets.map(asset => ({
            name: asset.name,
            uri: asset.uri,
            type: asset.mimeType,
          }));
          updateContratto(contrattoIndex, 'fatturaFiles', [
            ...contratti[contrattoIndex].fatturaFiles,
            ...newFiles,
          ]);
          if (newFiles.length > 0) {
            processFatturaOcr(contrattoIndex, newFiles[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error picking fattura:', err);
    }
  };

  const processFatturaOcr = async (contrattoIndex: number, file: FileDoc) => {
    setProcessingFatturaOcr(contrattoIndex);
    try {
      // Mock OCR per fattura
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResult = {
        podPdr: contratti[contrattoIndex].categoria === 'luce' ? 'IT001E12345678' : 'IT001G98765432',
        consumoAnnuo: '2500',
        potenza: '3.0',
      };

      setContratti(prev => prev.map((c, i) =>
        i === contrattoIndex
          ? {
              ...c,
              podPdr: mockResult.podPdr,
              consumoAnnuo: mockResult.consumoAnnuo,
              potenza: mockResult.potenza,
            }
          : c
      ));

      Alert.alert('OCR Fattura', 'Dati estratti dalla fattura. Verifica i valori.');
    } catch (err) {
      console.error('Fattura OCR error:', err);
    } finally {
      setProcessingFatturaOcr(null);
    }
  };

  const removeFatturaFile = (contrattoIndex: number, fileIndex: number) => {
    setContratti(prev => prev.map((c, i) =>
      i === contrattoIndex
        ? { ...c, fatturaFiles: c.fatturaFiles.filter((_, fi) => fi !== fileIndex) }
        : c
    ));
  };

  // --- Contratto Update ---
  const updateContratto = (index: number, field: keyof ContrattoData, value: any) => {
    setContratti(prev => prev.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    ));
  };

  // --- Cliente Search ---
  const searchCliente = async () => {
    if (!searchClienteQuery.trim()) return;

    setSearchingCliente(true);
    try {
      // Mock search
      await new Promise(resolve => setTimeout(resolve, 500));
      const results = MOCK_CLIENTI.filter(c =>
        `${c.nome} ${c.cognome}`.toLowerCase().includes(searchClienteQuery.toLowerCase()) ||
        c.codiceFiscale.toLowerCase().includes(searchClienteQuery.toLowerCase())
      );
      setClientiTrovati(results);
    } finally {
      setSearchingCliente(false);
    }
  };

  const selectCliente = (cliente: any) => {
    setClienteSelezionato(cliente);
    setDatiCliente(prev => ({
      ...prev,
      nome: cliente.nome,
      cognome: cliente.cognome,
      codiceFiscale: cliente.codiceFiscale,
      cellulare: cliente.telefono || '',
      email: cliente.email || '',
    }));
    setShowClienteSearch(false);
    setClientiTrovati([]);
    setSearchClienteQuery('');
  };

  // --- Validation ---
  const canProceedStep0 = documentoFiles.length > 0;

  const canProceedStep1 = () => {
    const d = datiCliente;
    if (!d.nome || !d.cognome || !d.codiceFiscale) return false;
    if (!d.cellulare || !d.email) return false;
    if (!d.indirizzo || !d.comune || !d.cap) return false;
    if (d.metodoPagamento === 'rid' && !d.iban) return false;
    if (d.metodoPagamento === 'rid' && d.ibanTerzaParte) {
      if (!d.terzaParteNome || !d.terzaParteCognome || !d.terzaParteCF) return false;
    }
    if (d.tipoCliente === 'business' && (!d.ragioneSociale || !d.partitaIva)) return false;
    return true;
  };

  const canProceedStep2 = () => {
    for (const c of contratti) {
      if (!c.tipoOperazione) return false;
      // Per switch/subentro serve fattura
      if (['switch', 'switch_con_voltura', 'subentro'].includes(c.tipoOperazione || '')) {
        if (c.fatturaFiles.length === 0) return false;
      }
      // Per energia serve POD/PDR
      if ((c.categoria === 'luce' || c.categoria === 'gas') && !c.podPdr) return false;
      // Per telco portabilità serve numero
      if (c.categoria === 'telco' && c.tipoOperazione === 'portabilita' && !c.numeroPortare) {
        return false;
      }
    }
    return true;
  };

  const canSubmit = acceptTerms;

  // --- Navigation ---
  const goNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Errore', 'Accetta i termini e condizioni per procedere');
      return;
    }

    setIsSubmitting(true);
    try {
      // In produzione: chiamata API per creare contratti
      // await contrattiApi.createMultiple({ datiCliente, contratti, documentoFiles });

      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Contratti Creati!',
        `${contratti.length} contratto/i creato/i con successo`,
        [
          {
            text: 'Vai ai Contratti',
            onPress: () => router.replace('/(tabs)/contratti' as any),
          },
          {
            text: 'Nuovo Caricamento',
            onPress: () => router.replace('/(tabs)/nuova-pratica' as any),
          },
        ]
      );
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Errore', 'Impossibile creare i contratti. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Step 0: Documento ---
  const renderStep0 = () => (
    <ScrollView style={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Documento di Identità</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.helpText}>
            Carica il documento di identità del cliente. I dati verranno estratti automaticamente con OCR.
          </Text>

          {/* Tipo documento */}
          <Text style={styles.inputLabel}>Tipo Documento</Text>
          <View style={styles.tipoDocumentoButtons}>
            {[
              { value: 'carta_identita', label: 'Carta Identità', icon: 'card-outline' },
              { value: 'patente', label: 'Patente', icon: 'car-outline' },
              { value: 'passaporto', label: 'Passaporto', icon: 'airplane-outline' },
            ].map(td => (
              <TouchableOpacity
                key={td.value}
                style={[
                  styles.tipoDocumentoButton,
                  tipoDocumento === td.value && styles.tipoDocumentoButtonActive
                ]}
                onPress={() => setTipoDocumento(td.value as TipoDocumento)}
              >
                <Ionicons
                  name={td.icon as any}
                  size={18}
                  color={tipoDocumento === td.value ? '#fff' : colors.foreground}
                />
                <Text style={[
                  styles.tipoDocumentoText,
                  tipoDocumento === td.value && styles.tipoDocumentoTextActive
                ]}>
                  {td.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Upload area */}
          <View style={styles.uploadSection}>
            {documentoFiles.length > 0 ? (
              <View style={styles.uploadedFiles}>
                {documentoFiles.map((file, index) => (
                  <View key={index} style={styles.uploadedFile}>
                    <View style={styles.uploadedFileInfo}>
                      <Ionicons name="document" size={20} color={SEMPLISWITCH_COLORS.green} />
                      <Text style={styles.uploadedFileName} numberOfLines={1}>{file.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeDocumentoFile(index)}>
                      <Ionicons name="close-circle" size={22} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.uploadButtons}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickDocumento('camera')}
              >
                <Ionicons name="camera-outline" size={24} color={SEMPLISWITCH_COLORS.blue} />
                <Text style={styles.uploadButtonText}>Scatta Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickDocumento('file')}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={SEMPLISWITCH_COLORS.blue} />
                <Text style={styles.uploadButtonText}>Carica File</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* OCR Status */}
          {isProcessingOcr && (
            <View style={styles.ocrStatus}>
              <ActivityIndicator size="small" color={SEMPLISWITCH_COLORS.magenta} />
              <Text style={styles.ocrStatusText}>Elaborazione OCR in corso...</Text>
            </View>
          )}

          {ocrResult && !isProcessingOcr && (
            <View style={styles.ocrSuccess}>
              <Ionicons name="checkmark-circle" size={20} color={SEMPLISWITCH_COLORS.green} />
              <Text style={styles.ocrSuccessText}>
                Dati estratti: {ocrResult.nome} {ocrResult.cognome}
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={SEMPLISWITCH_COLORS.blue} />
        <View style={styles.infoCardContent}>
          <Text style={styles.infoCardTitle}>Suggerimento</Text>
          <Text style={styles.infoCardText}>
            Fotografa fronte e retro del documento per un riconoscimento ottimale.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // --- Render Step 1: Dati Cliente ---
  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} keyboardShouldPersistTaps="handled">
      {/* Ricerca cliente esistente */}
      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.cardHeaderRow}>
            <CardTitle>Cliente Esistente?</CardTitle>
            <TouchableOpacity
              style={styles.searchClienteButton}
              onPress={() => setShowClienteSearch(true)}
            >
              <Ionicons name="search" size={18} color={SEMPLISWITCH_COLORS.magenta} />
              <Text style={styles.searchClienteButtonText}>Cerca</Text>
            </TouchableOpacity>
          </View>
        </CardHeader>
        {clienteSelezionato && (
          <CardContent>
            <View style={styles.clienteSelezionato}>
              <View style={styles.clienteSelezionatoInfo}>
                <Ionicons name="person-circle" size={32} color={SEMPLISWITCH_COLORS.green} />
                <View style={styles.clienteSelezionatoDetails}>
                  <Text style={styles.clienteSelezionatoNome}>
                    {clienteSelezionato.nome} {clienteSelezionato.cognome}
                  </Text>
                  <Text style={styles.clienteSelezionatoCF}>{clienteSelezionato.codiceFiscale}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setClienteSelezionato(null)}>
                <Ionicons name="close-circle" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </CardContent>
        )}
      </Card>

      {/* Tipo cliente */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Tipo Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.tipoClienteButtons}>
            {[
              { value: 'privato', label: 'Privato', icon: 'person-outline' },
              { value: 'business', label: 'Business', icon: 'business-outline' },
              { value: 'condominio', label: 'Condominio', icon: 'home-outline' },
            ].map(tc => (
              <TouchableOpacity
                key={tc.value}
                style={[
                  styles.tipoClienteButton,
                  datiCliente.tipoCliente === tc.value && styles.tipoClienteButtonActive
                ]}
                onPress={() => setDatiCliente({ ...datiCliente, tipoCliente: tc.value as TipoCliente })}
              >
                <Ionicons
                  name={tc.icon as any}
                  size={20}
                  color={datiCliente.tipoCliente === tc.value ? '#fff' : colors.foreground}
                />
                <Text style={[
                  styles.tipoClienteText,
                  datiCliente.tipoCliente === tc.value && styles.tipoClienteTextActive
                ]}>
                  {tc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* Dati anagrafici */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Dati Anagrafici</CardTitle>
        </CardHeader>
        <CardContent>
          {datiCliente.tipoCliente === 'business' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ragione Sociale *</Text>
                <TextInput
                  style={styles.input}
                  value={datiCliente.ragioneSociale}
                  onChangeText={(v) => setDatiCliente({ ...datiCliente, ragioneSociale: v })}
                  placeholder="Nome azienda"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Partita IVA *</Text>
                <TextInput
                  style={styles.input}
                  value={datiCliente.partitaIva}
                  onChangeText={(v) => setDatiCliente({ ...datiCliente, partitaIva: v })}
                  placeholder="12345678901"
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.nome}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, nome: v })}
                placeholder="Mario"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Cognome *</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.cognome}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, cognome: v })}
                placeholder="Rossi"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Codice Fiscale *</Text>
            <TextInput
              style={[styles.input, styles.inputMono]}
              value={datiCliente.codiceFiscale}
              onChangeText={(v) => setDatiCliente({ ...datiCliente, codiceFiscale: v.toUpperCase() })}
              placeholder="RSSMRA80A01H501U"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Data Nascita</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.dataNascita}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, dataNascita: v })}
                placeholder="01/01/1980"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Luogo Nascita</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.luogoNascita}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, luogoNascita: v })}
                placeholder="Roma"
              />
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Indirizzo */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Indirizzo di Residenza</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.inputRow}>
            <View style={{ flex: 3 }}>
              <Text style={styles.inputLabel}>Indirizzo *</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.indirizzo}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, indirizzo: v })}
                placeholder="Via Roma"
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing[2] }}>
              <Text style={styles.inputLabel}>N. *</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.civico}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, civico: v })}
                placeholder="10"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>CAP *</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.cap}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, cap: v })}
                placeholder="00100"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 2, marginLeft: spacing[2] }}>
              <Text style={styles.inputLabel}>Comune *</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.comune}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, comune: v })}
                placeholder="Roma"
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing[2] }}>
              <Text style={styles.inputLabel}>Prov.</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.provincia}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, provincia: v.toUpperCase() })}
                placeholder="RM"
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Contatti */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Contatti</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Telefono</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.telefono}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, telefono: v })}
                placeholder="06 12345678"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Cellulare *</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.cellulare}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, cellulare: v })}
                placeholder="333 1234567"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              value={datiCliente.email}
              onChangeText={(v) => setDatiCliente({ ...datiCliente, email: v })}
              placeholder="cliente@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {datiCliente.tipoCliente === 'business' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PEC</Text>
              <TextInput
                style={styles.input}
                value={datiCliente.pec}
                onChangeText={(v) => setDatiCliente({ ...datiCliente, pec: v })}
                placeholder="azienda@pec.it"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}
        </CardContent>
      </Card>

      {/* Pagamento */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Metodo di Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                datiCliente.metodoPagamento === 'rid' && styles.paymentOptionActive
              ]}
              onPress={() => setDatiCliente({ ...datiCliente, metodoPagamento: 'rid' })}
            >
              <View style={[
                styles.radioCircle,
                datiCliente.metodoPagamento === 'rid' && styles.radioCircleActive
              ]}>
                {datiCliente.metodoPagamento === 'rid' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.paymentOptionText}>RID Bancario (IBAN)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                datiCliente.metodoPagamento === 'bollettino' && styles.paymentOptionActive
              ]}
              onPress={() => setDatiCliente({ ...datiCliente, metodoPagamento: 'bollettino' })}
            >
              <View style={[
                styles.radioCircle,
                datiCliente.metodoPagamento === 'bollettino' && styles.radioCircleActive
              ]}>
                {datiCliente.metodoPagamento === 'bollettino' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.paymentOptionText}>Bollettino Postale</Text>
            </TouchableOpacity>
          </View>

          {datiCliente.metodoPagamento === 'rid' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IBAN *</Text>
                <TextInput
                  style={[styles.input, styles.inputMono]}
                  value={datiCliente.iban}
                  onChangeText={(v) => setDatiCliente({ ...datiCliente, iban: v.toUpperCase() })}
                  placeholder="IT60X0542811101000000123456"
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setDatiCliente({ ...datiCliente, ibanTerzaParte: !datiCliente.ibanTerzaParte })}
              >
                <View style={[
                  styles.checkbox,
                  datiCliente.ibanTerzaParte && styles.checkboxChecked
                ]}>
                  {datiCliente.ibanTerzaParte && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>IBAN intestato a terza persona</Text>
              </TouchableOpacity>

              {datiCliente.ibanTerzaParte && (
                <View style={styles.terzaParteContainer}>
                  <Text style={styles.terzaParteTitle}>
                    <Ionicons name="people-outline" size={16} color={SEMPLISWITCH_COLORS.purple} /> Dati Intestatario IBAN
                  </Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>Nome *</Text>
                      <TextInput
                        style={styles.input}
                        value={datiCliente.terzaParteNome}
                        onChangeText={(v) => setDatiCliente({ ...datiCliente, terzaParteNome: v })}
                      />
                    </View>
                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>Cognome *</Text>
                      <TextInput
                        style={styles.input}
                        value={datiCliente.terzaParteCognome}
                        onChangeText={(v) => setDatiCliente({ ...datiCliente, terzaParteCognome: v })}
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Codice Fiscale *</Text>
                    <TextInput
                      style={[styles.input, styles.inputMono]}
                      value={datiCliente.terzaParteCF}
                      onChangeText={(v) => setDatiCliente({ ...datiCliente, terzaParteCF: v.toUpperCase() })}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // --- Render Step 2: Contratti ---
  const renderStep2 = () => {
    const currentContratto = contratti[currentContrattoIndex];
    if (!currentContratto) return null;

    const isEnergia = currentContratto.categoria === 'luce' || currentContratto.categoria === 'gas';
    const isTelco = currentContratto.categoria === 'telco';

    return (
      <ScrollView style={styles.stepContent} keyboardShouldPersistTaps="handled">
        {/* Contratto selector tabs */}
        {contratti.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contrattoTabs}>
            {contratti.map((c, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.contrattoTab,
                  currentContrattoIndex === index && styles.contrattoTabActive
                ]}
                onPress={() => setCurrentContrattoIndex(index)}
              >
                <Ionicons
                  name={c.categoria === 'luce' ? 'flash' : c.categoria === 'gas' ? 'flame' : c.categoria === 'telco' ? 'wifi' : 'sunny'}
                  size={16}
                  color={currentContrattoIndex === index ? '#fff' : colors.foreground}
                />
                <Text style={[
                  styles.contrattoTabText,
                  currentContrattoIndex === index && styles.contrattoTabTextActive
                ]}>
                  {c.gestoreNome}
                </Text>
                {/* Indicator if completed */}
                {c.tipoOperazione && c.fatturaFiles.length > 0 && (
                  <Ionicons name="checkmark-circle" size={14} color={SEMPLISWITCH_COLORS.green} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Current contratto details */}
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardHeaderRow}>
              <View>
                <CardTitle>{currentContratto.offertaNome}</CardTitle>
                <Text style={styles.cardSubtitle}>{currentContratto.gestoreNome}</Text>
              </View>
              <Badge variant="outline">
                <Text style={styles.badgeTextSmall}>
                  {currentContratto.categoria === 'luce' ? '⚡ Luce' :
                   currentContratto.categoria === 'gas' ? '🔥 Gas' :
                   currentContratto.categoria === 'telco' ? '📶 Telco' : '☀️ FV'}
                </Text>
              </Badge>
            </View>
          </CardHeader>
          <CardContent>
            {/* Tipo operazione */}
            <Text style={styles.inputLabel}>Tipo Operazione *</Text>
            <View style={styles.operazioneButtons}>
              {(isEnergia ? [
                { value: 'switch', label: 'Switch' },
                { value: 'switch_con_voltura', label: 'Switch+Voltura' },
                { value: 'subentro', label: 'Subentro' },
                { value: 'prima_attivazione', label: 'Prima Attiv.' },
              ] : [
                { value: 'nuova_linea', label: 'Nuova Linea' },
                { value: 'portabilita', label: 'Portabilità' },
              ]).map(op => (
                <TouchableOpacity
                  key={op.value}
                  style={[
                    styles.operazioneButton,
                    currentContratto.tipoOperazione === op.value && styles.operazioneButtonActive
                  ]}
                  onPress={() => updateContratto(currentContrattoIndex, 'tipoOperazione', op.value as TipoOperazione)}
                >
                  <Text style={[
                    styles.operazioneButtonText,
                    currentContratto.tipoOperazione === op.value && styles.operazioneButtonTextActive
                  ]}>
                    {op.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fattura upload - per switch/subentro/portabilità */}
            {(isEnergia && ['switch', 'switch_con_voltura', 'subentro'].includes(currentContratto.tipoOperazione || '')) ||
             (isTelco && currentContratto.tipoOperazione === 'portabilita') ? (
              <View style={styles.uploadSection}>
                <Text style={styles.inputLabel}>
                  {isEnergia ? 'Fattura Attuale *' : 'Fattura Operatore Attuale *'}
                </Text>

                {currentContratto.fatturaFiles.map((file, index) => (
                  <View key={index} style={styles.uploadedFile}>
                    <View style={styles.uploadedFileInfo}>
                      <Ionicons name="document" size={20} color={SEMPLISWITCH_COLORS.green} />
                      <Text style={styles.uploadedFileName} numberOfLines={1}>{file.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFatturaFile(currentContrattoIndex, index)}>
                      <Ionicons name="close-circle" size={22} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                ))}

                {processingFatturaOcr === currentContrattoIndex && (
                  <View style={styles.ocrStatus}>
                    <ActivityIndicator size="small" color={SEMPLISWITCH_COLORS.magenta} />
                    <Text style={styles.ocrStatusText}>Elaborazione fattura...</Text>
                  </View>
                )}

                <View style={styles.uploadButtons}>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickFattura(currentContrattoIndex, 'camera')}
                  >
                    <Ionicons name="camera-outline" size={20} color={SEMPLISWITCH_COLORS.blue} />
                    <Text style={styles.uploadButtonText}>Foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickFattura(currentContrattoIndex, 'file')}
                  >
                    <Ionicons name="cloud-upload-outline" size={20} color={SEMPLISWITCH_COLORS.blue} />
                    <Text style={styles.uploadButtonText}>File</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : currentContratto.tipoOperazione === 'prima_attivazione' || currentContratto.tipoOperazione === 'nuova_linea' ? (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={SEMPLISWITCH_COLORS.blue} />
                <Text style={styles.infoBoxText}>
                  Per {currentContratto.tipoOperazione === 'prima_attivazione' ? 'prima attivazione' : 'nuova linea'} non è richiesta la fattura
                </Text>
              </View>
            ) : null}

            {/* Dati energia: POD/PDR */}
            {isEnergia && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {currentContratto.categoria === 'luce' ? 'Codice POD *' : 'Codice PDR *'}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.inputMono]}
                    value={currentContratto.podPdr}
                    onChangeText={(v) => updateContratto(currentContrattoIndex, 'podPdr', v.toUpperCase())}
                    placeholder={currentContratto.categoria === 'luce' ? 'IT001E...' : 'IT001G...'}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Consumo Annuo (kWh/Smc)</Text>
                    <TextInput
                      style={styles.input}
                      value={currentContratto.consumoAnnuo}
                      onChangeText={(v) => updateContratto(currentContrattoIndex, 'consumoAnnuo', v)}
                      placeholder="2500"
                      keyboardType="numeric"
                    />
                  </View>
                  {currentContratto.categoria === 'luce' && (
                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>Potenza (kW)</Text>
                      <TextInput
                        style={styles.input}
                        value={currentContratto.potenza}
                        onChangeText={(v) => updateContratto(currentContrattoIndex, 'potenza', v)}
                        placeholder="3.0"
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Dati telco: numero da portare */}
            {isTelco && currentContratto.tipoOperazione === 'portabilita' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Numero da Portare *</Text>
                  <TextInput
                    style={styles.input}
                    value={currentContratto.numeroPortare}
                    onChangeText={(v) => updateContratto(currentContrattoIndex, 'numeroPortare', v)}
                    placeholder="333 1234567"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Operatore di Provenienza</Text>
                  <TextInput
                    style={styles.input}
                    value={currentContratto.operatoreProvenienza}
                    onChangeText={(v) => updateContratto(currentContrattoIndex, 'operatoreProvenienza', v)}
                    placeholder="Es. Vodafone, Tim, Wind..."
                  />
                </View>
              </>
            )}

            {/* Note */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note (opzionale)</Text>
              <TextInput
                style={[styles.input, styles.inputTextarea]}
                value={currentContratto.note}
                onChangeText={(v) => updateContratto(currentContrattoIndex, 'note', v)}
                placeholder="Eventuali note o richieste particolari..."
                multiline
                numberOfLines={3}
              />
            </View>
          </CardContent>
        </Card>

        {/* Navigation between contracts */}
        {contratti.length > 1 && (
          <View style={styles.contrattoNavigation}>
            <TouchableOpacity
              style={[styles.contrattoNavButton, currentContrattoIndex === 0 && styles.contrattoNavButtonDisabled]}
              onPress={() => setCurrentContrattoIndex(Math.max(0, currentContrattoIndex - 1))}
              disabled={currentContrattoIndex === 0}
            >
              <Ionicons name="chevron-back" size={20} color={currentContrattoIndex === 0 ? colors.mutedForeground : colors.foreground} />
              <Text style={[styles.contrattoNavText, currentContrattoIndex === 0 && styles.contrattoNavTextDisabled]}>
                Precedente
              </Text>
            </TouchableOpacity>

            <Text style={styles.contrattoNavCounter}>
              {currentContrattoIndex + 1} / {contratti.length}
            </Text>

            <TouchableOpacity
              style={[styles.contrattoNavButton, currentContrattoIndex === contratti.length - 1 && styles.contrattoNavButtonDisabled]}
              onPress={() => setCurrentContrattoIndex(Math.min(contratti.length - 1, currentContrattoIndex + 1))}
              disabled={currentContrattoIndex === contratti.length - 1}
            >
              <Text style={[styles.contrattoNavText, currentContrattoIndex === contratti.length - 1 && styles.contrattoNavTextDisabled]}>
                Successivo
              </Text>
              <Ionicons name="chevron-forward" size={20} color={currentContrattoIndex === contratti.length - 1 ? colors.mutedForeground : colors.foreground} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // --- Render Step 3: Conferma ---
  const renderStep3 = () => (
    <ScrollView style={styles.stepContent}>
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Riepilogo Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.riepilogoRow}>
            <Text style={styles.riepilogoLabel}>Nome</Text>
            <Text style={styles.riepilogoValue}>{datiCliente.nome} {datiCliente.cognome}</Text>
          </View>
          <View style={styles.riepilogoRow}>
            <Text style={styles.riepilogoLabel}>Codice Fiscale</Text>
            <Text style={[styles.riepilogoValue, styles.riepilogoValueMono]}>{datiCliente.codiceFiscale}</Text>
          </View>
          <View style={styles.riepilogoRow}>
            <Text style={styles.riepilogoLabel}>Indirizzo</Text>
            <Text style={styles.riepilogoValue}>{datiCliente.indirizzo} {datiCliente.civico}, {datiCliente.cap} {datiCliente.comune}</Text>
          </View>
          <View style={styles.riepilogoRow}>
            <Text style={styles.riepilogoLabel}>Contatti</Text>
            <Text style={styles.riepilogoValue}>{datiCliente.cellulare} - {datiCliente.email}</Text>
          </View>
          <View style={styles.riepilogoRow}>
            <Text style={styles.riepilogoLabel}>Pagamento</Text>
            <Text style={styles.riepilogoValue}>
              {datiCliente.metodoPagamento === 'rid' ? `RID: ${datiCliente.iban}` : 'Bollettino'}
            </Text>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Contratti ({contratti.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contratti.map((c, index) => (
            <View key={index} style={styles.riepilogoContratto}>
              <View style={styles.riepilogoContrattoHeader}>
                <Ionicons
                  name={c.categoria === 'luce' ? 'flash' : c.categoria === 'gas' ? 'flame' : c.categoria === 'telco' ? 'wifi' : 'sunny'}
                  size={20}
                  color={SEMPLISWITCH_COLORS.magenta}
                />
                <View style={styles.riepilogoContrattoInfo}>
                  <Text style={styles.riepilogoContrattoNome}>{c.offertaNome}</Text>
                  <Text style={styles.riepilogoContrattoGestore}>{c.gestoreNome}</Text>
                </View>
              </View>
              <View style={styles.riepilogoContrattoDetails}>
                <Text style={styles.riepilogoContrattoDetail}>
                  Operazione: {formatOperazione(c.tipoOperazione || '')}
                </Text>
                {c.podPdr && (
                  <Text style={styles.riepilogoContrattoDetail}>
                    {c.categoria === 'luce' ? 'POD' : 'PDR'}: {c.podPdr}
                  </Text>
                )}
                {c.numeroPortare && (
                  <Text style={styles.riepilogoContrattoDetail}>
                    Numero: {c.numeroPortare}
                  </Text>
                )}
                <Text style={styles.riepilogoContrattoDetail}>
                  Documenti: {documentoFiles.length} + {c.fatturaFiles.length} allegati
                </Text>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>

      {/* Terms acceptance */}
      <Card style={styles.card}>
        <CardContent>
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
              {acceptTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              Confermo che il cliente ha preso visione e accettato le condizioni contrattuali e l'informativa privacy
            </Text>
          </TouchableOpacity>
        </CardContent>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // Helper function
  function formatOperazione(op: string): string {
    const map: Record<string, string> = {
      switch: 'Switch',
      switch_con_voltura: 'Switch con Voltura',
      subentro: 'Subentro',
      prima_attivazione: 'Prima Attivazione',
      nuova_linea: 'Nuova Linea',
      portabilita: 'Portabilità',
    };
    return map[op] || op;
  }

  // Check if can proceed
  const canProceed = () => {
    switch (currentStep) {
      case 0: return canProceedStep0;
      case 1: return canProceedStep1();
      case 2: return canProceedStep2();
      case 3: return canSubmit;
      default: return false;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Nuovi Contratti</Text>
          <Text style={styles.headerSubtitle}>{STEP_LABELS[currentStep]}</Text>
        </View>
        <Text style={styles.headerStep}>{currentStep + 1}/4</Text>
      </View>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={4} />

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[2] }]}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.footerButtonSecondary} onPress={goBack}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
            <Text style={styles.footerButtonSecondaryText}>Indietro</Text>
          </TouchableOpacity>
        )}

        {currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.footerButtonPrimary, !canProceed() && styles.footerButtonDisabled]}
            onPress={goNext}
            disabled={!canProceed()}
          >
            <Text style={styles.footerButtonPrimaryText}>Avanti</Text>
            <Ionicons name="arrow-forward" size={20} color="#333" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.footerButtonPrimary, !canSubmit && styles.footerButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#333" />
            ) : (
              <>
                <Text style={styles.footerButtonPrimaryText}>Crea Contratti</Text>
                <Ionicons name="checkmark-circle" size={20} color="#333" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Cliente Search Modal */}
      <Modal
        visible={showClienteSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClienteSearch(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cerca Cliente</Text>
            <TouchableOpacity onPress={() => setShowClienteSearch(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearchContainer}>
            <TextInput
              style={styles.modalSearchInput}
              value={searchClienteQuery}
              onChangeText={setSearchClienteQuery}
              placeholder="Nome, cognome o codice fiscale..."
              onSubmitEditing={searchCliente}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.modalSearchButton} onPress={searchCliente}>
              {searchingCliente ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <FlatList
            data={clientiTrovati}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.clienteSearchResult} onPress={() => selectCliente(item)}>
                <Ionicons name="person-circle-outline" size={32} color={colors.mutedForeground} />
                <View style={styles.clienteSearchResultInfo}>
                  <Text style={styles.clienteSearchResultNome}>{item.nome} {item.cognome}</Text>
                  <Text style={styles.clienteSearchResultCF}>{item.codiceFiscale}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchClienteQuery && !searchingCliente ? (
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>Nessun cliente trovato</Text>
                </View>
              ) : null
            }
          />
        </View>
      </Modal>
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
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: {
    padding: spacing[2],
    marginRight: spacing[2],
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  headerStep: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    fontWeight: fontWeights.medium as any,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },
  stepIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: SEMPLISWITCH_COLORS.green,
  },
  stepDotCurrent: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
  },
  stepDotText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
  },
  stepDotTextActive: {
    color: '#fff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.muted,
    marginHorizontal: spacing[1],
  },
  stepLineCompleted: {
    backgroundColor: SEMPLISWITCH_COLORS.green,
  },
  contentContainer: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: spacing[4],
  },
  card: {
    marginBottom: spacing[4],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  helpText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  inputHalf: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    backgroundColor: colors.background,
  },
  inputMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputTextarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tipoDocumentoButtons: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  tipoDocumentoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  tipoDocumentoButtonActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  tipoDocumentoText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  tipoDocumentoTextActive: {
    color: '#fff',
  },
  tipoClienteButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  tipoClienteButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    gap: spacing[1],
  },
  tipoClienteButtonActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  tipoClienteText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  tipoClienteTextActive: {
    color: '#fff',
  },
  uploadSection: {
    marginTop: spacing[4],
  },
  uploadedFiles: {
    marginBottom: spacing[3],
  },
  uploadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${SEMPLISWITCH_COLORS.green}15`,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  uploadedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  uploadedFileName: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
    flex: 1,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  uploadButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    gap: spacing[2],
  },
  uploadButtonText: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.blue,
  },
  ocrStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  ocrStatusText: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.magenta,
  },
  ocrSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: `${SEMPLISWITCH_COLORS.green}15`,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginTop: spacing[3],
  },
  ocrSuccessText: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.green,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${SEMPLISWITCH_COLORS.blue}10`,
    borderWidth: 1,
    borderColor: `${SEMPLISWITCH_COLORS.blue}30`,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    gap: spacing[3],
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: SEMPLISWITCH_COLORS.blue,
    marginBottom: 2,
  },
  infoCardText: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: `${SEMPLISWITCH_COLORS.blue}10`,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginTop: spacing[3],
  },
  infoBoxText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.blue,
  },
  searchClienteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: `${SEMPLISWITCH_COLORS.magenta}15`,
    borderRadius: borderRadius.md,
  },
  searchClienteButtonText: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.magenta,
    fontWeight: fontWeights.medium as any,
  },
  clienteSelezionato: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clienteSelezionatoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  clienteSelezionatoDetails: {
    flex: 1,
  },
  clienteSelezionatoNome: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  clienteSelezionatoCF: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  paymentOptions: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  paymentOptionActive: {},
  paymentOptionText: {
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  checkboxLabel: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
    flex: 1,
  },
  terzaParteContainer: {
    backgroundColor: `${SEMPLISWITCH_COLORS.purple}10`,
    borderWidth: 1,
    borderColor: `${SEMPLISWITCH_COLORS.purple}30`,
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  terzaParteTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: SEMPLISWITCH_COLORS.purple,
    marginBottom: spacing[3],
  },
  contrattoTabs: {
    marginBottom: spacing[3],
  },
  contrattoTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing[2],
  },
  contrattoTabActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  contrattoTabText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  contrattoTabTextActive: {
    color: '#fff',
  },
  operazioneButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  operazioneButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  operazioneButtonActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  operazioneButtonText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  operazioneButtonTextActive: {
    color: '#fff',
  },
  contrattoNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
  },
  contrattoNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  contrattoNavButtonDisabled: {
    opacity: 0.5,
  },
  contrattoNavText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  contrattoNavTextDisabled: {
    color: colors.mutedForeground,
  },
  contrattoNavCounter: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  badgeTextSmall: {
    fontSize: 10,
  },
  riepilogoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  riepilogoLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  riepilogoValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    flex: 1,
    textAlign: 'right',
  },
  riepilogoValueMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  riepilogoContratto: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  riepilogoContrattoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  riepilogoContrattoInfo: {
    flex: 1,
  },
  riepilogoContrattoNome: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  riepilogoContrattoGestore: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  riepilogoContrattoDetails: {
    marginLeft: 28,
  },
  riepilogoContrattoDetail: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  termsText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing[3],
  },
  footerButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  footerButtonSecondaryText: {
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  footerButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: SEMPLISWITCH_COLORS.yellow,
    borderRadius: borderRadius.md,
  },
  footerButtonPrimaryText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: '#333',
  },
  footerButtonDisabled: {
    opacity: 0.5,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[2],
  },
  modalSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
  },
  modalSearchButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clienteSearchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },
  clienteSearchResultInfo: {
    flex: 1,
  },
  clienteSearchResultNome: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  clienteSearchResultCF: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptySearchText: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
});
