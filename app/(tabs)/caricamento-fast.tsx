/**
 * CaricamentoFast - Pagina per caricamento rapido contratti (React Native)
 * Per agenti che vogliono un flusso semplificato senza simulatore
 *
 * Flusso:
 * 1. Cerca cliente esistente (per cognome/nome o telefono)
 * 2. Seleziona offerta dal catalogo (carrello)
 * 3. Carica documento e fattura
 * 4. Compila solo: cellulare, email, metodo pagamento (IBAN o Bollettino)
 * 5. Invia - il backoffice riceverà il contratto contrassegnato come "Caricamento Fast"
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#1d4ed8',
  green: '#22C55E',
  orange: '#F59E0B',
  purple: '#8B5CF6',
};

// Tipo per il carrello
interface CartItem {
  offerta: any;
  quantita: number;
  fatturaFiles?: { name: string; uri: string }[];
  altriAllegatiFiles?: { name: string; uri: string }[];
  tipoOperazioneTelco?: 'nuova_linea' | 'portabilita';
}

// Tipo per cliente cercato
interface ClienteRicerca {
  id: number;
  nome: string;
  cognome: string;
  codiceFiscale?: string;
  telefono?: string;
  email?: string;
}

// Metodo di pagamento
type MetodoPagamento = 'rid' | 'bollettino';

// Tipi filtri
type FiltroTipoCliente = 'tutti' | 'privato' | 'business' | 'condominio';
type FiltroCategoria = 'tutti' | 'luce' | 'gas' | 'telco' | 'fotovoltaico';
type FiltroOperazione = 'tutti' | 'switch' | 'switch_con_voltura' | 'subentro' | 'prima_attivazione';
type FiltroTipoPrezzo = 'tutti' | 'fisso' | 'indicizzato';

// Mock offerte per demo
const MOCK_OFFERTE = [
  { id: 1, base: { nome: 'Luce Verde Plus', nomeGestore: 'Enel', customer: 'privati', categoria: 'energia' }, energia: { commodity: 'luce', prezzoTipo: true }, nomeOfferta: 'Luce Verde Plus' },
  { id: 2, base: { nome: 'Gas Casa', nomeGestore: 'Eni', customer: 'privati', categoria: 'energia' }, energia: { commodity: 'gas', prezzoTipo: false }, nomeOfferta: 'Gas Casa' },
  { id: 3, base: { nome: 'Fibra 1000', nomeGestore: 'Tim', customer: 'privati', categoria: 'telco' }, telco: { tipo: 'fibra' }, nomeOfferta: 'Fibra 1000' },
  { id: 4, base: { nome: 'Business Luce', nomeGestore: 'A2A', customer: 'business', categoria: 'energia' }, energia: { commodity: 'luce', prezzoTipo: true }, nomeOfferta: 'Business Luce' },
  { id: 5, base: { nome: 'Dual Luce+Gas', nomeGestore: 'Edison', customer: 'privati', categoria: 'energia' }, energia: { commodity: 'luce', prezzoTipo: false }, nomeOfferta: 'Dual Luce+Gas' },
  { id: 6, base: { nome: 'Fotovoltaico Casa', nomeGestore: 'SunPower', customer: 'privati', categoria: 'fotovoltaico' }, fotovoltaico: { tipo: 'residenziale' }, nomeOfferta: 'Fotovoltaico Casa' },
];

// Componente Chip Filtro
function FilterChip({
  label,
  selected,
  onPress,
  icon
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, selected && styles.filterChipSelected]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? '#fff' : colors.foreground}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Componente Card Offerta
function OffertaCard({
  offerta,
  inCarrello,
  onAdd
}: {
  offerta: any;
  inCarrello: boolean;
  onAdd: () => void;
}) {
  const nome = offerta.base?.nome || offerta.nomeOfferta;
  const gestore = offerta.base?.nomeGestore || 'N/A';
  const commodity = offerta.energia?.commodity;
  const isTelco = !!offerta.telco;
  const isFotovoltaico = !!offerta.fotovoltaico;

  return (
    <View style={[styles.offertaCard, inCarrello && styles.offertaCardSelected]}>
      <View style={styles.offertaInfo}>
        <Text style={styles.offertaGestore} numberOfLines={1}>{gestore}</Text>
        <Text style={styles.offertaNome} numberOfLines={1}>{nome}</Text>
        <View style={styles.offertaBadges}>
          {commodity === 'luce' && (
            <Badge variant="outline" style={styles.offertaBadge}>
              <Text style={styles.badgeText}>⚡ Luce</Text>
            </Badge>
          )}
          {commodity === 'gas' && (
            <Badge variant="outline" style={styles.offertaBadge}>
              <Text style={styles.badgeText}>🔥 Gas</Text>
            </Badge>
          )}
          {isTelco && (
            <Badge variant="outline" style={styles.offertaBadge}>
              <Text style={styles.badgeText}>📶 Telco</Text>
            </Badge>
          )}
          {isFotovoltaico && (
            <Badge variant="outline" style={styles.offertaBadge}>
              <Text style={styles.badgeText}>☀️ FV</Text>
            </Badge>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.addButton, inCarrello && styles.addButtonSelected]}
        onPress={onAdd}
      >
        <Ionicons name="add" size={20} color={inCarrello ? SEMPLISWITCH_COLORS.green : '#fff'} />
      </TouchableOpacity>
    </View>
  );
}

// Componente Cart Item
function CartItemCard({
  item,
  onRemove,
  onUpdateTipoOperazione,
  onPickFattura,
  onPickAltriAllegati,
  onRemoveFatturaFile,
  onRemoveAltroAllegatoFile,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateTipoOperazione: (tipo: 'nuova_linea' | 'portabilita') => void;
  onPickFattura: () => void;
  onPickAltriAllegati: () => void;
  onRemoveFatturaFile: (index: number) => void;
  onRemoveAltroAllegatoFile: (index: number) => void;
}) {
  const nome = item.offerta.base?.nome || item.offerta.nomeOfferta;
  const gestore = item.offerta.base?.nomeGestore || '';
  const isTelco = !!item.offerta.telco;

  return (
    <View style={styles.cartItemCard}>
      <View style={styles.cartItemHeader}>
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemGestore}>{gestore}</Text>
          <Text style={styles.cartItemNome} numberOfLines={1}>{nome}</Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      {/* Per offerte Telco: selezione Nuova Linea / Portabilità */}
      {isTelco && (
        <View style={styles.telcoOptions}>
          <Text style={styles.telcoLabel}>Tipo operazione:</Text>
          <View style={styles.telcoButtons}>
            <TouchableOpacity
              style={[
                styles.telcoButton,
                item.tipoOperazioneTelco === 'nuova_linea' && styles.telcoButtonSelected
              ]}
              onPress={() => onUpdateTipoOperazione('nuova_linea')}
            >
              <Ionicons name="add-circle-outline" size={14} color={item.tipoOperazioneTelco === 'nuova_linea' ? '#fff' : colors.foreground} />
              <Text style={[styles.telcoButtonText, item.tipoOperazioneTelco === 'nuova_linea' && styles.telcoButtonTextSelected]}>
                Nuova Linea
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.telcoButton,
                item.tipoOperazioneTelco === 'portabilita' && styles.telcoButtonSelected
              ]}
              onPress={() => onUpdateTipoOperazione('portabilita')}
            >
              <Ionicons name="swap-horizontal-outline" size={14} color={item.tipoOperazioneTelco === 'portabilita' ? '#fff' : colors.foreground} />
              <Text style={[styles.telcoButtonText, item.tipoOperazioneTelco === 'portabilita' && styles.telcoButtonTextSelected]}>
                Portabilità
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sezione Fattura - solo per non-Telco o Telco con portabilità */}
      {(!isTelco || item.tipoOperazioneTelco === 'portabilita') && (
        <View style={styles.allegatoSection}>
          <Text style={styles.allegatoLabel}>
            <Ionicons name="document-text-outline" size={14} color={colors.mutedForeground} /> Fattura
            {isTelco && item.tipoOperazioneTelco === 'portabilita' && <Text style={styles.required}> *</Text>}
          </Text>

          {/* Files caricati */}
          {(item.fatturaFiles || []).map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <Ionicons name="document" size={14} color={SEMPLISWITCH_COLORS.green} />
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <TouchableOpacity onPress={() => onRemoveFatturaFile(index)}>
                <Ionicons name="close-circle" size={18} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.uploadButton} onPress={onPickFattura}>
            <Ionicons name="cloud-upload-outline" size={16} color={SEMPLISWITCH_COLORS.blue} />
            <Text style={styles.uploadButtonText}>Carica fattura</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messaggio per Telco nuova linea */}
      {isTelco && item.tipoOperazioneTelco === 'nuova_linea' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>Per una nuova linea non è richiesta la fattura</Text>
        </View>
      )}

      {/* Messaggio per Telco senza selezione */}
      {isTelco && !item.tipoOperazioneTelco && (
        <View style={styles.warningBox}>
          <Text style={styles.warningBoxText}>Seleziona "Nuova Linea" o "Portabilità"</Text>
        </View>
      )}

      {/* Altri allegati */}
      <View style={styles.allegatoSection}>
        <Text style={styles.allegatoLabel}>
          <Ionicons name="attach-outline" size={14} color={colors.mutedForeground} /> Altri allegati (opzionale)
        </Text>

        {(item.altriAllegatiFiles || []).map((file, index) => (
          <View key={index} style={styles.fileItem}>
            <Ionicons name="document" size={14} color={SEMPLISWITCH_COLORS.purple} />
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <TouchableOpacity onPress={() => onRemoveAltroAllegatoFile(index)}>
              <Ionicons name="close-circle" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.uploadButton} onPress={onPickAltriAllegati}>
          <Ionicons name="attach-outline" size={16} color={SEMPLISWITCH_COLORS.purple} />
          <Text style={[styles.uploadButtonText, { color: SEMPLISWITCH_COLORS.purple }]}>Aggiungi allegato</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CaricamentoFast() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole, user } = useAuth();

  // ===== STEP 1: Ricerca Cliente =====
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'nome' | 'telefono'>('nome');
  const [clientiTrovati, setClientiTrovati] = useState<ClienteRicerca[]>([]);
  const [clienteSelezionato, setClienteSelezionato] = useState<ClienteRicerca | null>(null);
  const [searchingCliente, setSearchingCliente] = useState(false);

  // ===== STEP 2: Selezione Offerta =====
  const [offerte, setOfferte] = useState<any[]>(MOCK_OFFERTE);
  const [loadingOfferte, setLoadingOfferte] = useState(false);
  const [carrello, setCarrello] = useState<CartItem[]>([]);
  const [searchOfferta, setSearchOfferta] = useState('');

  // Filtri offerte
  const [filtroTipoCliente, setFiltroTipoCliente] = useState<FiltroTipoCliente>('tutti');
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>('tutti');
  const [filtroOperazione, setFiltroOperazione] = useState<FiltroOperazione>('tutti');
  const [filtroTipoPrezzo, setFiltroTipoPrezzo] = useState<FiltroTipoPrezzo>('tutti');
  const [showFilters, setShowFilters] = useState(false);

  // ===== STEP 3: Upload Documenti =====
  const [documentoFiles, setDocumentoFiles] = useState<{ name: string; uri: string }[]>([]);

  // ===== STEP 4: Dati Cliente Rapidi =====
  const [nomeManuale, setNomeManuale] = useState('');
  const [cognomeManuale, setCognomeManuale] = useState('');
  const [cellulare, setCellulare] = useState('');
  const [email, setEmail] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('rid');
  const [iban, setIban] = useState('');
  const [ibanTerzaParte, setIbanTerzaParte] = useState(false);
  const [terzaParteNome, setTerzaParteNome] = useState('');
  const [terzaParteCognome, setTerzaParteCognome] = useState('');
  const [terzaParteCF, setTerzaParteCF] = useState('');

  // ===== Stato invio =====
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Current step for mobile wizard
  const [currentStep, setCurrentStep] = useState(1);

  // Cerca cliente
  const cercaCliente = useCallback(async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Errore', 'Inserisci un termine di ricerca');
      return;
    }

    setSearchingCliente(true);

    // Mock ricerca
    setTimeout(() => {
      const mockClienti: ClienteRicerca[] = [
        { id: 1, nome: 'Mario', cognome: 'Rossi', telefono: '3331234567', email: 'mario.rossi@email.it' },
        { id: 2, nome: 'Luigi', cognome: 'Verdi', telefono: '3339876543', email: 'luigi.verdi@email.it' },
      ].filter(c => {
        const search = searchQuery.toLowerCase();
        if (searchType === 'telefono') {
          return c.telefono?.includes(search);
        }
        return `${c.nome} ${c.cognome}`.toLowerCase().includes(search);
      });

      setClientiTrovati(mockClienti);
      setSearchingCliente(false);

      if (mockClienti.length === 0) {
        Alert.alert('Nessun risultato', 'Nessun cliente trovato');
      }
    }, 500);
  }, [searchQuery, searchType]);

  // Seleziona cliente
  const selezionaCliente = (cliente: ClienteRicerca) => {
    setClienteSelezionato(cliente);
    setNomeManuale(cliente.nome);
    setCognomeManuale(cliente.cognome);
    setCellulare(cliente.telefono || '');
    setEmail(cliente.email || '');
    setClientiTrovati([]);
  };

  // Reset cliente
  const resetCliente = () => {
    setClienteSelezionato(null);
    setCellulare('');
    setEmail('');
  };

  // Aggiungi al carrello
  const aggiungiAlCarrello = (offerta: any) => {
    const offertaId = offerta.id || offerta.base?.id;
    const existing = carrello.find(item => (item.offerta.id || item.offerta.base?.id) === offertaId);

    if (existing) {
      setCarrello(prev => prev.map(item =>
        (item.offerta.id || item.offerta.base?.id) === offertaId
          ? { ...item, quantita: item.quantita + 1 }
          : item
      ));
    } else {
      setCarrello(prev => [...prev, { offerta, quantita: 1 }]);
    }
  };

  // Rimuovi dal carrello
  const rimuoviDalCarrello = (offertaId: number) => {
    setCarrello(prev => prev.filter(item => (item.offerta.id || item.offerta.base?.id) !== offertaId));
  };

  // Update tipo operazione Telco
  const updateTipoOperazioneTelco = (offertaId: number, tipo: 'nuova_linea' | 'portabilita') => {
    setCarrello(prev => prev.map(item =>
      (item.offerta.id || item.offerta.base?.id) === offertaId
        ? { ...item, tipoOperazioneTelco: tipo }
        : item
    ));
  };

  // Pick documento
  const pickDocumento = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => ({
          name: asset.name,
          uri: asset.uri,
        }));
        setDocumentoFiles(prev => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  // Pick documento da camera
  const pickDocumentoCamera = async () => {
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
      setDocumentoFiles(prev => [...prev, {
        name: `foto_${Date.now()}.jpg`,
        uri: result.assets[0].uri,
      }]);
    }
  };

  // Remove documento file
  const removeDocumentoFile = (index: number) => {
    setDocumentoFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Pick fattura per offerta
  const pickFatturaForItem = async (offertaId: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => ({
          name: asset.name,
          uri: asset.uri,
        }));
        setCarrello(prev => prev.map(item =>
          (item.offerta.id || item.offerta.base?.id) === offertaId
            ? { ...item, fatturaFiles: [...(item.fatturaFiles || []), ...newFiles] }
            : item
        ));
      }
    } catch (err) {
      console.error('Error picking fattura:', err);
    }
  };

  // Remove fattura file
  const removeFatturaFile = (offertaId: number, fileIndex: number) => {
    setCarrello(prev => prev.map(item =>
      (item.offerta.id || item.offerta.base?.id) === offertaId
        ? { ...item, fatturaFiles: (item.fatturaFiles || []).filter((_, i) => i !== fileIndex) }
        : item
    ));
  };

  // Pick altri allegati per offerta
  const pickAltriAllegatiForItem = async (offertaId: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => ({
          name: asset.name,
          uri: asset.uri,
        }));
        setCarrello(prev => prev.map(item =>
          (item.offerta.id || item.offerta.base?.id) === offertaId
            ? { ...item, altriAllegatiFiles: [...(item.altriAllegatiFiles || []), ...newFiles] }
            : item
        ));
      }
    } catch (err) {
      console.error('Error picking allegati:', err);
    }
  };

  // Remove altro allegato file
  const removeAltroAllegatoFile = (offertaId: number, fileIndex: number) => {
    setCarrello(prev => prev.map(item =>
      (item.offerta.id || item.offerta.base?.id) === offertaId
        ? { ...item, altriAllegatiFiles: (item.altriAllegatiFiles || []).filter((_, i) => i !== fileIndex) }
        : item
    ));
  };

  // Filtra offerte
  const offerteFiltrate = offerte.filter(o => {
    const nome = (o.base?.nome || o.nomeOfferta || '').toLowerCase();
    const gestore = (o.base?.nomeGestore || '').toLowerCase();
    const search = searchOfferta.toLowerCase();
    if (!nome.includes(search) && !gestore.includes(search)) return false;

    if (filtroTipoCliente !== 'tutti') {
      const customer = (o.base?.customer || '').toLowerCase();
      if (filtroTipoCliente === 'privato' && !customer.includes('privat')) return false;
      if (filtroTipoCliente === 'business' && !customer.includes('business')) return false;
      if (filtroTipoCliente === 'condominio' && !customer.includes('condomin')) return false;
    }

    if (filtroCategoria !== 'tutti') {
      const commodity = o.energia?.commodity?.toLowerCase() || '';
      const hasTelco = !!o.telco;
      const hasFotovoltaico = !!o.fotovoltaico;

      if (filtroCategoria === 'luce' && commodity !== 'luce') return false;
      if (filtroCategoria === 'gas' && commodity !== 'gas') return false;
      if (filtroCategoria === 'telco' && !hasTelco) return false;
      if (filtroCategoria === 'fotovoltaico' && !hasFotovoltaico) return false;
    }

    return true;
  });

  // Validazione
  const canSubmit = () => {
    if (carrello.length === 0) return false;
    if (!nomeManuale.trim() || !cognomeManuale.trim()) return false;
    if (!cellulare.trim() || !email.trim()) return false;
    if (metodoPagamento === 'rid' && !iban.trim()) return false;
    if (metodoPagamento === 'rid' && ibanTerzaParte) {
      if (!terzaParteNome.trim() || !terzaParteCognome.trim() || !terzaParteCF.trim()) return false;
    }

    for (const item of carrello) {
      if (item.offerta.telco) {
        if (!item.tipoOperazioneTelco) return false;
        if (item.tipoOperazioneTelco === 'portabilita' && (!item.fatturaFiles || item.fatturaFiles.length === 0)) {
          return false;
        }
      }
    }

    return true;
  };

  // Submit
  const handleSubmit = async () => {
    if (!canSubmit()) {
      Alert.alert('Dati incompleti', 'Compila tutti i campi obbligatori');
      return;
    }

    setIsSubmitting(true);

    // Simula invio
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Contratti Inviati!',
        `${carrello.length} contratto/i inviato/i al backoffice`,
        [
          { text: 'Nuovo Caricamento', onPress: resetForm },
          { text: 'Vai ai Contratti', onPress: () => router.push('/(tabs)/contratti' as any) },
        ]
      );
    }, 1500);
  };

  // Reset form
  const resetForm = () => {
    setCarrello([]);
    setClienteSelezionato(null);
    setNomeManuale('');
    setCognomeManuale('');
    setCellulare('');
    setEmail('');
    setIban('');
    setDocumentoFiles([]);
    setCurrentStep(1);
  };

  // Refresh
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  // Access guard - non permettere al backoffice
  if (userRole === ROLES.BACK_OFFICE) {
    return <AccessDenied message="Questa funzione è riservata ai consulenti." />;
  }

  // Render Step 1: Ricerca Cliente
  const renderStep1 = () => (
    <Card style={styles.stepCard}>
      <CardHeader>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepTitleContainer}>
            <CardTitle>Cerca Cliente (Opzionale)</CardTitle>
            <Text style={styles.stepDescription}>Cerca un cliente esistente o inserisci i dati manualmente</Text>
          </View>
        </View>
      </CardHeader>
      <CardContent>
        {!clienteSelezionato ? (
          <>
            {/* Tipo ricerca */}
            <View style={styles.searchTypeContainer}>
              <TouchableOpacity
                style={[styles.searchTypeButton, searchType === 'nome' && styles.searchTypeButtonActive]}
                onPress={() => setSearchType('nome')}
              >
                <Ionicons name="person-outline" size={16} color={searchType === 'nome' ? '#fff' : colors.foreground} />
                <Text style={[styles.searchTypeText, searchType === 'nome' && styles.searchTypeTextActive]}>Nome</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.searchTypeButton, searchType === 'telefono' && styles.searchTypeButtonActive]}
                onPress={() => setSearchType('telefono')}
              >
                <Ionicons name="call-outline" size={16} color={searchType === 'telefono' ? '#fff' : colors.foreground} />
                <Text style={[styles.searchTypeText, searchType === 'telefono' && styles.searchTypeTextActive]}>Telefono</Text>
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={searchType === 'nome' ? 'Mario Rossi' : '3331234567'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={cercaCliente}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchButton} onPress={cercaCliente} disabled={searchingCliente}>
                {searchingCliente ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="search" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Risultati ricerca */}
            {clientiTrovati.length > 0 && (
              <View style={styles.searchResults}>
                {clientiTrovati.map(cliente => (
                  <TouchableOpacity
                    key={cliente.id}
                    style={styles.searchResultItem}
                    onPress={() => selezionaCliente(cliente)}
                  >
                    <Text style={styles.searchResultName}>{cliente.nome} {cliente.cognome}</Text>
                    <Text style={styles.searchResultDetail}>
                      {cliente.telefono && `📱 ${cliente.telefono}`}
                      {cliente.email && ` • ${cliente.email}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.clienteSelezionato}>
            <View style={styles.clienteInfo}>
              <Ionicons name="checkmark-circle" size={20} color={SEMPLISWITCH_COLORS.green} />
              <View style={styles.clienteDetails}>
                <Text style={styles.clienteNome}>{clienteSelezionato.nome} {clienteSelezionato.cognome}</Text>
                <Text style={styles.clienteContatti}>
                  {clienteSelezionato.telefono} • {clienteSelezionato.email}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={resetCliente}>
              <Ionicons name="close-circle" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}
      </CardContent>
    </Card>
  );

  // Render Step 2: Catalogo Offerte
  const renderStep2 = () => (
    <Card style={styles.stepCard}>
      <CardHeader>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepTitleContainer}>
            <CardTitle>Seleziona Offerta</CardTitle>
            <Text style={styles.stepDescription}>Scegli le offerte dal catalogo</Text>
          </View>
        </View>
      </CardHeader>
      <CardContent>
        {/* Search offerte */}
        <View style={styles.searchOfferteContainer}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.searchOfferteInput}
            placeholder="Cerca offerta o gestore..."
            value={searchOfferta}
            onChangeText={setSearchOfferta}
          />
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Ionicons name="options-outline" size={22} color={showFilters ? SEMPLISWITCH_COLORS.magenta : colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Filtri */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            {/* Filtro Tipo Cliente */}
            <Text style={styles.filterLabel}>Tipo Cliente</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <FilterChip label="Tutti" selected={filtroTipoCliente === 'tutti'} onPress={() => setFiltroTipoCliente('tutti')} />
              <FilterChip label="Privato" selected={filtroTipoCliente === 'privato'} onPress={() => setFiltroTipoCliente('privato')} icon="person-outline" />
              <FilterChip label="Business" selected={filtroTipoCliente === 'business'} onPress={() => setFiltroTipoCliente('business')} icon="business-outline" />
              <FilterChip label="Condominio" selected={filtroTipoCliente === 'condominio'} onPress={() => setFiltroTipoCliente('condominio')} icon="home-outline" />
            </ScrollView>

            {/* Filtro Categoria */}
            <Text style={styles.filterLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <FilterChip label="Tutti" selected={filtroCategoria === 'tutti'} onPress={() => setFiltroCategoria('tutti')} />
              <FilterChip label="Luce" selected={filtroCategoria === 'luce'} onPress={() => setFiltroCategoria('luce')} icon="flash-outline" />
              <FilterChip label="Gas" selected={filtroCategoria === 'gas'} onPress={() => setFiltroCategoria('gas')} icon="flame-outline" />
              <FilterChip label="Telco" selected={filtroCategoria === 'telco'} onPress={() => setFiltroCategoria('telco')} icon="wifi-outline" />
              <FilterChip label="FV" selected={filtroCategoria === 'fotovoltaico'} onPress={() => setFiltroCategoria('fotovoltaico')} icon="sunny-outline" />
            </ScrollView>
          </View>
        )}

        {/* Contatore */}
        <Text style={styles.offerteCount}>{offerteFiltrate.length} offerte trovate</Text>

        {/* Lista offerte */}
        {loadingOfferte ? (
          <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.offerteGrid}>
            {offerteFiltrate.map(offerta => {
              const offertaId = offerta.id || offerta.base?.id;
              const inCarrello = carrello.some(item => (item.offerta.id || item.offerta.base?.id) === offertaId);
              return (
                <OffertaCard
                  key={offertaId}
                  offerta={offerta}
                  inCarrello={inCarrello}
                  onAdd={() => aggiungiAlCarrello(offerta)}
                />
              );
            })}
          </View>
        )}
      </CardContent>
    </Card>
  );

  // Render Step 3: Documenti
  const renderStep3 = () => (
    <Card style={styles.stepCard}>
      <CardHeader>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepTitleContainer}>
            <CardTitle>Documenti</CardTitle>
            <Text style={styles.stepDescription}>Carica documento identità e fatture</Text>
          </View>
        </View>
      </CardHeader>
      <CardContent>
        {/* Documento Identità */}
        <View style={styles.documentSection}>
          <Text style={styles.documentLabel}>
            <Ionicons name="person-outline" size={16} color={colors.foreground} /> Documento di Identità (condiviso)
          </Text>

          {/* Files caricati */}
          {documentoFiles.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <Ionicons name="document" size={14} color={SEMPLISWITCH_COLORS.green} />
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <TouchableOpacity onPress={() => removeDocumentoFile(index)}>
                <Ionicons name="close-circle" size={18} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Bottoni upload */}
          <View style={styles.uploadButtonsRow}>
            <TouchableOpacity style={styles.uploadButtonLarge} onPress={pickDocumento}>
              <Ionicons name="cloud-upload-outline" size={20} color={SEMPLISWITCH_COLORS.blue} />
              <Text style={styles.uploadButtonLargeText}>Carica file</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButtonLarge} onPress={pickDocumentoCamera}>
              <Ionicons name="camera-outline" size={20} color={SEMPLISWITCH_COLORS.blue} />
              <Text style={styles.uploadButtonLargeText}>Scatta foto</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fatture per ogni offerta */}
        {carrello.length > 0 ? (
          <View style={styles.cartItemsSection}>
            <Text style={styles.sectionTitle}>Fatture per ogni offerta</Text>
            {carrello.map((item, index) => {
              const offertaId = item.offerta.id || item.offerta.base?.id;
              return (
                <CartItemCard
                  key={offertaId}
                  item={item}
                  onRemove={() => rimuoviDalCarrello(offertaId)}
                  onUpdateTipoOperazione={(tipo) => updateTipoOperazioneTelco(offertaId, tipo)}
                  onPickFattura={() => pickFatturaForItem(offertaId)}
                  onPickAltriAllegati={() => pickAltriAllegatiForItem(offertaId)}
                  onRemoveFatturaFile={(fileIndex) => removeFatturaFile(offertaId, fileIndex)}
                  onRemoveAltroAllegatoFile={(fileIndex) => removeAltroAllegatoFile(offertaId, fileIndex)}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={32} color={colors.mutedForeground} />
            <Text style={styles.emptyCartText}>Aggiungi offerte al carrello</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );

  // Render Step 4: Dati e Pagamento
  const renderStep4 = () => (
    <Card style={styles.stepCard}>
      <CardHeader>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepTitleContainer}>
            <CardTitle>Dati e Pagamento</CardTitle>
            <Text style={styles.stepDescription}>Inserisci i dati del cliente e metodo di pagamento</Text>
          </View>
        </View>
      </CardHeader>
      <CardContent>
        {/* Nome e Cognome */}
        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Nome <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Mario"
              value={nomeManuale}
              onChangeText={setNomeManuale}
            />
          </View>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Cognome <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Rossi"
              value={cognomeManuale}
              onChangeText={setCognomeManuale}
            />
          </View>
        </View>

        {/* Cellulare e Email */}
        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Cellulare <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="333 1234567"
              value={cellulare}
              onChangeText={setCellulare}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Email <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="cliente@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Metodo Pagamento */}
        <Text style={styles.inputLabel}>Metodo di Pagamento <Text style={styles.required}>*</Text></Text>
        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={[styles.paymentOption, metodoPagamento === 'rid' && styles.paymentOptionSelected]}
            onPress={() => setMetodoPagamento('rid')}
          >
            <View style={[styles.radioCircle, metodoPagamento === 'rid' && styles.radioCircleSelected]}>
              {metodoPagamento === 'rid' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.paymentOptionText}>RID (IBAN)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentOption, metodoPagamento === 'bollettino' && styles.paymentOptionSelected]}
            onPress={() => setMetodoPagamento('bollettino')}
          >
            <View style={[styles.radioCircle, metodoPagamento === 'bollettino' && styles.radioCircleSelected]}>
              {metodoPagamento === 'bollettino' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.paymentOptionText}>Bollettino</Text>
          </TouchableOpacity>
        </View>

        {/* IBAN */}
        {metodoPagamento === 'rid' && (
          <>
            <Text style={styles.inputLabel}>IBAN <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.ibanInput]}
              placeholder="IT60X0542811101000000123456"
              value={iban}
              onChangeText={(text) => setIban(text.toUpperCase())}
              autoCapitalize="characters"
            />

            {/* Checkbox IBAN terza parte */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIbanTerzaParte(!ibanTerzaParte)}
            >
              <View style={[styles.checkbox, ibanTerzaParte && styles.checkboxChecked]}>
                {ibanTerzaParte && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>IBAN intestato a terza persona</Text>
            </TouchableOpacity>

            {/* Dati terza parte */}
            {ibanTerzaParte && (
              <View style={styles.terzaParteContainer}>
                <Text style={styles.terzaParteTitle}>
                  <Ionicons name="people-outline" size={16} color={SEMPLISWITCH_COLORS.purple} /> Dati Intestatario IBAN
                </Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Nome <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Mario"
                      value={terzaParteNome}
                      onChangeText={setTerzaParteNome}
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Cognome <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Rossi"
                      value={terzaParteCognome}
                      onChangeText={setTerzaParteCognome}
                    />
                  </View>
                </View>
                <Text style={styles.inputLabel}>Codice Fiscale <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, styles.cfInput]}
                  placeholder="RSSMRA80A01H501U"
                  value={terzaParteCF}
                  onChangeText={(text) => setTerzaParteCF(text.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  // Render Carrello Floating
  const renderCarrelloFloating = () => {
    if (carrello.length === 0) return null;

    const totaleItems = carrello.reduce((acc, item) => acc + item.quantita, 0);

    return (
      <View style={[styles.carrelloFloating, { bottom: insets.bottom + 16 }]}>
        <View style={styles.carrelloInfo}>
          <View style={styles.carrelloBadge}>
            <Text style={styles.carrelloBadgeText}>{totaleItems}</Text>
          </View>
          <Text style={styles.carrelloText}>
            {carrello.length} offert{carrello.length === 1 ? 'a' : 'e'} nel carrello
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit() && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#333" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#333" />
              <Text style={styles.submitButtonText}>Invia</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="flash" size={24} color={SEMPLISWITCH_COLORS.yellow} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Caricamento Fast</Text>
            <Text style={styles.headerSubtitle}>Procedura rapida</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: carrello.length > 0 ? 100 : 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep1()}
        {renderStep2()}
        {renderStep3()}
        {renderStep4()}

        {/* Info box */}
        <View style={styles.infoCard}>
          <Ionicons name="time-outline" size={20} color={SEMPLISWITCH_COLORS.blue} />
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardTitle}>Procedura Rapida</Text>
            <Text style={styles.infoCardText}>
              I contratti verranno contrassegnati come "Caricamento Fast" e il backoffice completerà i dati mancanti.
            </Text>
          </View>
        </View>
      </ScrollView>

      {renderCarrelloFloating()}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${SEMPLISWITCH_COLORS.yellow}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  stepCard: {
    marginBottom: spacing[2],
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: fontWeights.bold as any,
    fontSize: fontSizes.sm,
  },
  stepTitleContainer: {
    flex: 1,
  },
  stepDescription: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  searchTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[1],
  },
  searchTypeButtonActive: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  searchTypeText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  searchTypeTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    fontSize: fontSizes.base,
    backgroundColor: colors.background,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResults: {
    marginTop: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  searchResultItem: {
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultName: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  searchResultDetail: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  clienteSelezionato: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${SEMPLISWITCH_COLORS.green}15`,
    borderWidth: 1,
    borderColor: `${SEMPLISWITCH_COLORS.green}40`,
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  clienteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  clienteDetails: {
    flex: 1,
  },
  clienteNome: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  clienteContatti: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  searchOfferteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    marginBottom: spacing[3],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchOfferteInput: {
    flex: 1,
    height: 44,
    fontSize: fontSizes.base,
  },
  filtersContainer: {
    marginBottom: spacing[3],
  },
  filterLabel: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
    marginTop: spacing[2],
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing[2],
    backgroundColor: colors.background,
  },
  filterChipSelected: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  filterChipText: {
    fontSize: fontSizes.xs,
    color: colors.foreground,
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  offerteCount: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[2],
  },
  offerteGrid: {
    gap: spacing[2],
  },
  offertaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
  },
  offertaCardSelected: {
    borderColor: SEMPLISWITCH_COLORS.green,
    backgroundColor: `${SEMPLISWITCH_COLORS.green}10`,
  },
  offertaInfo: {
    flex: 1,
  },
  offertaGestore: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  offertaNome: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  offertaBadges: {
    flexDirection: 'row',
    marginTop: spacing[1],
    gap: spacing[1],
  },
  offertaBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonSelected: {
    backgroundColor: `${SEMPLISWITCH_COLORS.green}20`,
  },
  documentSection: {
    marginBottom: spacing[4],
  },
  documentLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  uploadButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
  },
  uploadButtonLargeText: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.blue,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${SEMPLISWITCH_COLORS.green}15`,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  fileName: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  cartItemsSection: {
    marginTop: spacing[3],
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  cartItemCard: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemGestore: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  cartItemNome: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  removeButton: {
    padding: spacing[1],
  },
  telcoOptions: {
    marginBottom: spacing[2],
  },
  telcoLabel: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  telcoButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  telcoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  telcoButtonSelected: {
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  telcoButtonText: {
    fontSize: fontSizes.xs,
    color: colors.foreground,
  },
  telcoButtonTextSelected: {
    color: '#fff',
  },
  allegatoSection: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  allegatoLabel: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[2],
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
  },
  uploadButtonText: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.blue,
  },
  infoBox: {
    backgroundColor: `${SEMPLISWITCH_COLORS.green}15`,
    borderRadius: borderRadius.sm,
    padding: spacing[2],
    marginTop: spacing[2],
  },
  infoBoxText: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.green,
  },
  warningBox: {
    backgroundColor: `${SEMPLISWITCH_COLORS.orange}15`,
    borderRadius: borderRadius.sm,
    padding: spacing[2],
    marginTop: spacing[2],
  },
  warningBoxText: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.orange,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  emptyCartText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[2],
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  required: {
    color: colors.destructive,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    fontSize: fontSizes.base,
    backgroundColor: colors.background,
  },
  ibanInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cfInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[3],
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  paymentOptionSelected: {},
  paymentOptionText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: SEMPLISWITCH_COLORS.magenta,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: SEMPLISWITCH_COLORS.purple,
    borderColor: SEMPLISWITCH_COLORS.purple,
  },
  checkboxLabel: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  terzaParteContainer: {
    backgroundColor: `${SEMPLISWITCH_COLORS.purple}10`,
    borderWidth: 1,
    borderColor: `${SEMPLISWITCH_COLORS.purple}30`,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  terzaParteTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: SEMPLISWITCH_COLORS.purple,
    marginBottom: spacing[3],
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
  carrelloFloating: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  carrelloInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  carrelloBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carrelloBadgeText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold as any,
  },
  carrelloText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: SEMPLISWITCH_COLORS.yellow,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold as any,
    color: '#333',
  },
});
