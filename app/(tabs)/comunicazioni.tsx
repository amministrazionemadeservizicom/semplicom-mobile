/**
 * Comunicazioni - Pagina comunicazioni per utenti (React Native)
 * Lista comunicazioni aziendali con gestione letti/non letti
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
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
  red: '#EF4444',
};

// Tipi
interface Allegato {
  name: string;
  url: string;
}

interface Comunicazione {
  id: string;
  titolo: string;
  testo: string;
  tipo: 'info' | 'avviso' | 'urgente' | 'aggiornamento';
  allegati?: Allegato[];
  letto?: boolean;
  dataCreazione?: string;
}

// Mock data
const MOCK_COMUNICAZIONI: Comunicazione[] = [
  {
    id: '1',
    titolo: 'Nuove offerte disponibili',
    testo: 'Sono state aggiunte nuove offerte al catalogo. Controlla la sezione Offerte per visualizzare le novità.',
    tipo: 'info',
    letto: false,
    dataCreazione: '2024-01-15',
  },
  {
    id: '2',
    titolo: 'Aggiornamento procedure',
    testo: 'A partire dal prossimo mese entreranno in vigore le nuove procedure per la compilazione dei contratti. Si prega di leggere attentamente il documento allegato.',
    tipo: 'avviso',
    allegati: [
      { name: 'Nuove_Procedure.pdf', url: 'https://example.com/doc.pdf' },
    ],
    letto: false,
    dataCreazione: '2024-01-10',
  },
  {
    id: '3',
    titolo: 'Manutenzione programmata',
    testo: 'Il sistema sarà in manutenzione sabato dalle 22:00 alle 02:00. Durante questo periodo il servizio potrebbe essere non disponibile.',
    tipo: 'urgente',
    letto: true,
    dataCreazione: '2024-01-05',
  },
];

// Helper per icona tipo
function getTipoIcon(tipo: string): { name: keyof typeof Ionicons.glyphMap; color: string } {
  switch (tipo) {
    case 'urgente':
      return { name: 'alert-circle', color: SEMPLISWITCH_COLORS.red };
    case 'avviso':
      return { name: 'warning', color: SEMPLISWITCH_COLORS.orange };
    case 'aggiornamento':
      return { name: 'refresh-circle', color: SEMPLISWITCH_COLORS.blue };
    default:
      return { name: 'information-circle', color: SEMPLISWITCH_COLORS.blue };
  }
}

// Helper per label tipo
function getTipoLabel(tipo: string): string {
  switch (tipo) {
    case 'urgente':
      return 'URGENTE';
    case 'avviso':
      return 'AVVISO';
    case 'aggiornamento':
      return 'UPDATE';
    default:
      return 'INFO';
  }
}

// Componente Card Comunicazione
function ComunicazioneCard({
  comunicazione,
  onMarkRead,
  onOpenAllegato,
}: {
  comunicazione: Comunicazione;
  onMarkRead: () => void;
  onOpenAllegato: (url: string) => void;
}) {
  const tipoInfo = getTipoIcon(comunicazione.tipo);

  return (
    <Card style={[styles.comunicazioneCard, !comunicazione.letto && styles.comunicazioneCardUnread]}>
      <CardContent style={styles.comunicazioneContent}>
        {/* Header */}
        <View style={styles.comunicazioneHeader}>
          <View style={styles.comunicazioneTitleRow}>
            <Ionicons name={tipoInfo.name} size={20} color={tipoInfo.color} />
            <Text style={styles.comunicazioneTitolo} numberOfLines={2}>
              {comunicazione.titolo}
            </Text>
          </View>
          <Badge
            variant="outline"
            style={[
              styles.tipoBadge,
              comunicazione.tipo === 'urgente' && styles.tipoBadgeUrgente,
              comunicazione.tipo === 'avviso' && styles.tipoBadgeAvviso,
            ]}
          >
            <Text style={[
              styles.tipoBadgeText,
              comunicazione.tipo === 'urgente' && styles.tipoBadgeTextUrgente,
              comunicazione.tipo === 'avviso' && styles.tipoBadgeTextAvviso,
            ]}>
              {getTipoLabel(comunicazione.tipo)}
            </Text>
          </Badge>
        </View>

        {/* Indicatore non letto */}
        {!comunicazione.letto && (
          <View style={styles.unreadIndicator}>
            <View style={styles.unreadDot} />
            <Text style={styles.unreadText}>Non letto</Text>
          </View>
        )}

        {/* Testo */}
        <Text style={styles.comunicazioneTesto}>
          {comunicazione.testo}
        </Text>

        {/* Allegati */}
        {comunicazione.allegati && comunicazione.allegati.length > 0 && (
          <View style={styles.allegatiContainer}>
            <Text style={styles.allegatiLabel}>
              <Ionicons name="attach" size={14} color={colors.mutedForeground} /> Allegati:
            </Text>
            {comunicazione.allegati.map((allegato, index) => (
              <TouchableOpacity
                key={index}
                style={styles.allegatoButton}
                onPress={() => onOpenAllegato(allegato.url)}
              >
                <Ionicons name="document-outline" size={16} color={SEMPLISWITCH_COLORS.blue} />
                <Text style={styles.allegatoText}>{allegato.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Data */}
        {comunicazione.dataCreazione && (
          <Text style={styles.dataText}>
            {new Date(comunicazione.dataCreazione).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        )}

        {/* Azioni */}
        {!comunicazione.letto && (
          <View style={styles.comunicazioneActions}>
            <TouchableOpacity style={styles.markReadButton} onPress={onMarkRead}>
              <Ionicons name="checkmark-circle-outline" size={18} color={SEMPLISWITCH_COLORS.green} />
              <Text style={styles.markReadText}>Segna come letto</Text>
            </TouchableOpacity>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

export default function Comunicazioni() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole, isSuperAdmin } = useAuth();

  const [comunicazioni, setComunicazioni] = useState<Comunicazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Redirect SuperAdmin
  useEffect(() => {
    if (isSuperAdmin) {
      router.replace('/(tabs)/sa-dashboard' as any);
    }
  }, [isSuperAdmin, router]);

  // Load comunicazioni
  const loadComunicazioni = useCallback(async () => {
    try {
      // In produzione: chiamata API
      // const response = await authed.get('/protected/list-communications');
      // setComunicazioni(response.items || []);
      // setUnreadCount(response.unreadCount || 0);

      // Mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setComunicazioni(MOCK_COMUNICAZIONI);
      setUnreadCount(MOCK_COMUNICAZIONI.filter(c => !c.letto).length);
    } catch (error) {
      console.error('Error loading comunicazioni:', error);
      setComunicazioni([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRole]);

  useEffect(() => {
    loadComunicazioni();
  }, [loadComunicazioni]);

  const onRefresh = () => {
    setRefreshing(true);
    loadComunicazioni();
  };

  // Mark as read
  const handleMarkRead = async (id: string) => {
    try {
      // In produzione: chiamata API
      // await authed.post('/protected/mark-communication-read', { comunicazioneId: id });

      // Update locale
      setComunicazioni(prev => prev.map(c =>
        c.id === id ? { ...c, letto: true } : c
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
      Alert.alert('Errore', 'Impossibile segnare come letto');
    }
  };

  // Open allegato
  const handleOpenAllegato = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Errore', 'Impossibile aprire il documento');
      }
    } catch (error) {
      console.error('Error opening allegato:', error);
      Alert.alert('Errore', 'Impossibile aprire il documento');
    }
  };

  // Block SuperAdmin access
  if (isSuperAdmin) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Comunicazioni</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} non lette</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      ) : (
        <FlatList
          data={comunicazioni}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ComunicazioneCard
              comunicazione={item}
              onMarkRead={() => handleMarkRead(item.id)}
              onOpenAllegato={handleOpenAllegato}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <CardContent style={styles.emptyContent}>
                <Ionicons name="mail-outline" size={48} color={colors.mutedForeground} />
                <Text style={styles.emptyText}>Nessuna comunicazione</Text>
                <Text style={styles.emptySubtext}>
                  Le comunicazioni aziendali appariranno qui
                </Text>
              </CardContent>
            </Card>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  unreadBadge: {
    backgroundColor: `${SEMPLISWITCH_COLORS.red}15`,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  unreadBadgeText: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.red,
    fontWeight: fontWeights.medium as any,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  loadingText: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  comunicazioneCard: {
    marginBottom: spacing[3],
  },
  comunicazioneCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: SEMPLISWITCH_COLORS.magenta,
  },
  comunicazioneContent: {
    padding: spacing[4],
  },
  comunicazioneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  comunicazioneTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    flex: 1,
    paddingRight: spacing[2],
  },
  comunicazioneTitolo: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
    flex: 1,
  },
  tipoBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  tipoBadgeUrgente: {
    backgroundColor: `${SEMPLISWITCH_COLORS.red}15`,
    borderColor: SEMPLISWITCH_COLORS.red,
  },
  tipoBadgeAvviso: {
    backgroundColor: `${SEMPLISWITCH_COLORS.orange}15`,
    borderColor: SEMPLISWITCH_COLORS.orange,
  },
  tipoBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.bold as any,
    color: colors.mutedForeground,
  },
  tipoBadgeTextUrgente: {
    color: SEMPLISWITCH_COLORS.red,
  },
  tipoBadgeTextAvviso: {
    color: SEMPLISWITCH_COLORS.orange,
  },
  unreadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
  },
  unreadText: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.magenta,
    fontWeight: fontWeights.medium as any,
  },
  comunicazioneTesto: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
    lineHeight: 22,
    marginBottom: spacing[3],
  },
  allegatiContainer: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  allegatiLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
    marginBottom: spacing[2],
  },
  allegatoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  allegatoText: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.blue,
    textDecorationLine: 'underline',
  },
  dataText: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[2],
  },
  comunicazioneActions: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[3],
    marginTop: spacing[2],
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  markReadText: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.green,
    fontWeight: fontWeights.medium as any,
  },
  emptyCard: {
    marginTop: spacing[8],
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
    marginTop: spacing[3],
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
    textAlign: 'center',
  },
});
