/**
 * Contratto Detail Screen
 * Mostra i dettagli completi di un contratto
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import {
  ContrattiAPI,
  ContrattoDto,
  getStatoColor,
  getStatoLabel,
  getStatoPagamentoColor,
  getStatoPagamentoLabel,
  formatImporto,
} from '../../lib/api';

export default function ContrattoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [contratto, setContratto] = useState<ContrattoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContratto = async () => {
    if (!id) {
      setError('ID contratto non valido');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await ContrattiAPI.get(parseInt(id, 10));
      setContratto(data);
    } catch (err) {
      console.error('Error loading contratto:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento contratto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContratto();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContratto();
    setRefreshing(false);
  };

  const getClienteNome = (): string => {
    if (!contratto) return 'N/A';
    if (contratto.ragioneSociale) return contratto.ragioneSociale;
    if (contratto.nome && contratto.cognome) return `${contratto.nome} ${contratto.cognome}`;
    if (contratto.nome) return contratto.nome;
    if (contratto.cognome) return contratto.cognome;
    return 'Cliente N/A';
  };

  const formatData = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Caricamento...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Caricamento contratto...</Text>
        </View>
      </>
    );
  }

  if (error || !contratto) {
    return (
      <>
        <Stack.Screen options={{ title: 'Errore' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Contratto non trovato'}</Text>
          <Button variant="outline" onPress={() => router.back()}>
            Torna Indietro
          </Button>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Contratto #${contratto.id}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />
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
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.clienteNome}>{getClienteNome()}</Text>
              <View style={[styles.statoBadge, { backgroundColor: getStatoColor(contratto.stato) }]}>
                <Text style={styles.statoBadgeText}>{getStatoLabel(contratto.stato)}</Text>
              </View>
            </View>

            <View style={styles.headerMeta}>
              {contratto.tipoCliente && (
                <Badge variant="secondary">{contratto.tipoCliente}</Badge>
              )}
              {contratto.commodity && (
                <Badge variant="outline">{contratto.commodity.toUpperCase()}</Badge>
              )}
            </View>

            {contratto.offerta && (
              <View style={styles.offertaRow}>
                <Text style={styles.offertaNome}>{contratto.offerta.nome}</Text>
                <Text style={styles.offertaGestore}>{contratto.offerta.nomeGestore}</Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Dati Cliente */}
        <Card style={styles.sectionCard}>
          <CardHeader>
            <CardTitle>Dati Cliente</CardTitle>
          </CardHeader>
          <CardContent style={styles.sectionContent}>
            {contratto.nome && (
              <InfoRow label="Nome" value={contratto.nome} />
            )}
            {contratto.cognome && (
              <InfoRow label="Cognome" value={contratto.cognome} />
            )}
            {contratto.ragioneSociale && (
              <InfoRow label="Ragione Sociale" value={contratto.ragioneSociale} />
            )}
            {contratto.codiceFiscale && (
              <InfoRow label="Codice Fiscale" value={contratto.codiceFiscale} />
            )}
            {contratto.partitaIva && (
              <InfoRow label="Partita IVA" value={contratto.partitaIva} />
            )}
            {contratto.email && (
              <InfoRow label="Email" value={contratto.email} />
            )}
            {contratto.telefono && (
              <InfoRow label="Telefono" value={contratto.telefono} />
            )}
          </CardContent>
        </Card>

        {/* Indirizzi */}
        <Card style={styles.sectionCard}>
          <CardHeader>
            <CardTitle>Indirizzi</CardTitle>
          </CardHeader>
          <CardContent style={styles.sectionContent}>
            {contratto.indirizzoFornitura && (
              <InfoRow label="Fornitura" value={contratto.indirizzoFornitura} />
            )}
            {contratto.indirizzoFatturazione && (
              <InfoRow label="Fatturazione" value={contratto.indirizzoFatturazione} />
            )}
          </CardContent>
        </Card>

        {/* Dati Fornitura */}
        {(contratto.pod || contratto.pdr || contratto.telcoNumber) && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Dati Fornitura</CardTitle>
            </CardHeader>
            <CardContent style={styles.sectionContent}>
              {contratto.pod && (
                <InfoRow label="POD" value={contratto.pod} />
              )}
              {contratto.pdr && (
                <InfoRow label="PDR" value={contratto.pdr} />
              )}
              {contratto.telcoNumber && (
                <InfoRow label="Numero Telco" value={contratto.telcoNumber} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Importi */}
        {(contratto.importoLordo !== undefined || contratto.importoNetto !== undefined) && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Importi</CardTitle>
            </CardHeader>
            <CardContent style={styles.sectionContent}>
              {contratto.importoLordo !== undefined && contratto.importoLordo > 0 && (
                <InfoRow label="Importo Lordo" value={formatImporto(contratto.importoLordo)} />
              )}
              {contratto.importoNetto !== undefined && contratto.importoNetto > 0 && (
                <InfoRow
                  label="Provvigione Netta"
                  value={formatImporto(contratto.importoNetto)}
                  valueColor={colors.success}
                />
              )}
              {contratto.statoPagamento && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Stato Pagamento</Text>
                  <View style={[styles.smallBadge, { backgroundColor: getStatoPagamentoColor(contratto.statoPagamento) }]}>
                    <Text style={styles.smallBadgeText}>
                      {getStatoPagamentoLabel(contratto.statoPagamento)}
                    </Text>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* Date e Timeline */}
        <Card style={styles.sectionCard}>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent style={styles.sectionContent}>
            {contratto.tsCreazione && (
              <InfoRow label="Creazione" value={formatData(contratto.tsCreazione)} />
            )}
            {contratto.tsInserimento && (
              <InfoRow label="Inserimento" value={formatData(contratto.tsInserimento)} />
            )}
            {contratto.tsFirmato && (
              <InfoRow label="Data Firma" value={formatData(contratto.tsFirmato)} />
            )}
            {contratto.tsAttivazione && (
              <InfoRow label="Data Attivazione" value={formatData(contratto.tsAttivazione)} />
            )}
          </CardContent>
        </Card>

        {/* Note */}
        {contratto.note && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Note</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.noteText}>{contratto.note}</Text>
            </CardContent>
          </Card>
        )}

        {/* Agente */}
        {contratto.agente && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Agente</CardTitle>
            </CardHeader>
            <CardContent style={styles.sectionContent}>
              <InfoRow label="Nome" value={contratto.agente.nomeCognome || 'N/A'} />
              {contratto.agente.email && (
                <InfoRow label="Email" value={contratto.agente.email} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Torna alla Lista
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

// Helper component for info rows
function InfoRow({
  label,
  value,
  valueColor
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing[4],
    gap: spacing[4],
  },
  errorText: {
    fontSize: fontSizes.base,
    color: colors.destructive,
    textAlign: 'center',
  },
  headerCard: {
    marginBottom: spacing[4],
  },
  headerContent: {
    gap: spacing[3],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clienteNome: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
    flex: 1,
    marginRight: spacing[2],
  },
  statoBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing['1.5'],
    borderRadius: borderRadius.md,
  },
  statoBadgeText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.white,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  offertaRow: {
    backgroundColor: colors.muted,
    padding: spacing[3],
    borderRadius: borderRadius.md,
  },
  offertaNome: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  offertaGestore: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
  sectionCard: {
    marginBottom: spacing[4],
  },
  sectionContent: {
    gap: spacing[2],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    flex: 1,
  },
  infoValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    flex: 2,
    textAlign: 'right',
  },
  smallBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  smallBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
    color: colors.white,
  },
  noteText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
    lineHeight: fontSizes.sm * 1.5,
  },
  actionsContainer: {
    marginTop: spacing[2],
  },
  backButton: {
    width: '100%',
  },
});
