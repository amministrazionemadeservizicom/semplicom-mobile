/**
 * Offerta Detail Screen
 * Mostra i dettagli completi di un'offerta
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import {
  OfferteAPI,
  OffertaCompleta,
  getCategoriaColor,
  getCategoriaLabel,
  getStatoOffertaColor,
  getStatoOffertaLabel,
} from '../../lib/api';
import type { Categoria, StatoOfferta } from '../../shared/types/offerte';

export default function OffertaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [offerta, setOfferta] = useState<OffertaCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOfferta = async () => {
    if (!id) {
      setError('ID offerta non valido');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await OfferteAPI.get(parseInt(id, 10));
      setOfferta(data);
    } catch (err) {
      console.error('Error loading offerta:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento offerta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfferta();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOfferta();
    setRefreshing(false);
  };

  const handleSeleziona = () => {
    router.push({
      pathname: '/(tabs)/nuova-pratica',
      params: { offertaId: id },
    });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Caricamento...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Caricamento offerta...</Text>
        </View>
      </>
    );
  }

  if (error || !offerta) {
    return (
      <>
        <Stack.Screen options={{ title: 'Errore' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Offerta non trovata'}</Text>
          <Button variant="outline" onPress={() => router.back()}>
            Torna Indietro
          </Button>
        </View>
      </>
    );
  }

  // Extract base info - handle both nested and flat structure
  const base = offerta.base || offerta;
  const nome = offerta.nomeOfferta || (base as any).nome || 'Offerta';
  const categoria = (offerta.categoria?.toLowerCase() || (base as any).categoria || 'altro') as Categoria;
  const stato = ((base as any).stato || 'attiva') as StatoOfferta;
  const nomeGestore = offerta.gestore?.nome || (base as any).nomeGestore || 'N/A';
  const customer = offerta.tipoCliente || (base as any).customer || null;
  const prodotto = offerta.prodotto || (base as any).prodotto || null;
  const bonus = (base as any).bonus || null;
  const note = offerta.note || (base as any).note || null;

  return (
    <>
      <Stack.Screen
        options={{
          title: nome,
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
              <View style={styles.titleRow}>
                <Text style={styles.offertaNome}>{nome}</Text>
                <View
                  style={[
                    styles.categoriaIndicator,
                    { backgroundColor: getCategoriaColor(categoria) },
                  ]}
                />
              </View>
              <Badge variant="secondary">{nomeGestore}</Badge>
            </View>

            <View style={styles.headerMeta}>
              <Badge variant="outline">{getCategoriaLabel(categoria)}</Badge>
              {stato && (
                <View style={[styles.statoBadge, { backgroundColor: getStatoOffertaColor(stato) }]}>
                  <Text style={styles.statoBadgeText}>{getStatoOffertaLabel(stato)}</Text>
                </View>
              )}
              {customer && (
                <Badge variant="outline">{customer}</Badge>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Descrizione / Note */}
        {note && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Descrizione</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.descriptionText}>{note}</Text>
            </CardContent>
          </Card>
        )}

        {/* Bonus */}
        {bonus && (
          <Card style={styles.bonusCard}>
            <CardContent style={styles.bonusContent}>
              <Text style={styles.bonusLabel}>Bonus</Text>
              <Text style={styles.bonusValue}>{bonus}</Text>
            </CardContent>
          </Card>
        )}

        {/* Dettagli Offerta */}
        <Card style={styles.sectionCard}>
          <CardHeader>
            <CardTitle>Dettagli</CardTitle>
          </CardHeader>
          <CardContent style={styles.sectionContent}>
            {prodotto && (
              <InfoRow label="Prodotto" value={prodotto} />
            )}
            {categoria && (
              <InfoRow label="Categoria" value={getCategoriaLabel(categoria)} />
            )}
            {nomeGestore && (
              <InfoRow label="Gestore" value={nomeGestore} />
            )}
            {customer && (
              <InfoRow label="Tipo Cliente" value={customer} />
            )}
          </CardContent>
        </Card>

        {/* Dettagli Energia (se applicabile) */}
        {offerta.energia && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Dettagli Energia</CardTitle>
            </CardHeader>
            <CardContent style={styles.sectionContent}>
              {offerta.energia.commodity && (
                <InfoRow label="Commodity" value={offerta.energia.commodity.toUpperCase()} />
              )}
              {offerta.energia.prezzoTipo !== undefined && (
                <InfoRow label="Tipo Prezzo" value={offerta.energia.prezzoTipo ? 'Fisso' : 'Indicizzato'} />
              )}
              {offerta.energia.prezzo !== undefined && (
                <InfoRow label="Prezzo" value={`${offerta.energia.prezzo} €/kWh`} />
              )}
              {offerta.energia.spread !== undefined && (
                <InfoRow label="Spread" value={`${offerta.energia.spread} €/kWh`} />
              )}
              {offerta.energia.indice && (
                <InfoRow label="Indice" value={offerta.energia.indice} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Dettagli Telco (se applicabile) */}
        {offerta.telco && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Dettagli Telefonia</CardTitle>
            </CardHeader>
            <CardContent style={styles.sectionContent}>
              {offerta.telco.tecnologia && (
                <InfoRow label="Tecnologia" value={offerta.telco.tecnologia} />
              )}
              {offerta.telco.prezzo !== undefined && (
                <InfoRow label="Prezzo" value={`${offerta.telco.prezzo.toFixed(2)} €/mese`} />
              )}
              {offerta.telco.attivazione !== undefined && (
                <InfoRow label="Attivazione" value={`${offerta.telco.attivazione.toFixed(2)} €`} />
              )}
              {offerta.telco.portabilita !== undefined && (
                <InfoRow label="Portabilità" value={offerta.telco.portabilita ? 'Sì' : 'No'} />
              )}
              {offerta.telco.nuovaLinea !== undefined && (
                <InfoRow label="Nuova Linea" value={offerta.telco.nuovaLinea ? 'Sì' : 'No'} />
              )}
              {offerta.telco.lineaMobile !== undefined && (
                <InfoRow label="Linea Mobile" value={offerta.telco.lineaMobile ? 'Sì' : 'No'} />
              )}
              {offerta.telco.contenutiTv !== undefined && (
                <InfoRow label="Contenuti TV" value={offerta.telco.contenutiTv ? 'Sì' : 'No'} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Dettagli Fotovoltaico (se applicabile) */}
        {offerta.fotovoltaico && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Dettagli Fotovoltaico</CardTitle>
            </CardHeader>
            <CardContent style={styles.sectionContent}>
              {offerta.fotovoltaico.plantKw !== undefined && (
                <InfoRow label="Potenza Impianto" value={`${offerta.fotovoltaico.plantKw} kWp`} />
              )}
              {offerta.fotovoltaico.prezzo !== undefined && (
                <InfoRow label="Prezzo" value={`${offerta.fotovoltaico.prezzo.toLocaleString('it-IT')} €`} />
              )}
              {offerta.fotovoltaico.batteria !== undefined && (
                <InfoRow label="Batteria" value={offerta.fotovoltaico.batteria ? 'Sì' : 'No'} />
              )}
              {offerta.fotovoltaico.batteryKwh !== undefined && (
                <InfoRow label="Capacità Batteria" value={`${offerta.fotovoltaico.batteryKwh} kWh`} />
              )}
              {offerta.fotovoltaico.trifase !== undefined && (
                <InfoRow label="Trifase" value={offerta.fotovoltaico.trifase ? 'Sì' : 'No'} />
              )}
              {offerta.fotovoltaico.noteExtra && (
                <InfoRow label="Note" value={offerta.fotovoltaico.noteExtra} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Allegati */}
        {offerta.allegati && offerta.allegati.length > 0 && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Allegati ({offerta.allegati.length})</CardTitle>
            </CardHeader>
            <CardContent style={styles.sectionContent}>
              {offerta.allegati.map((allegato, index) => (
                <View key={allegato.id || index} style={styles.allegatoRow}>
                  <Text style={styles.allegatoNome}>{allegato.nome}</Text>
                  {allegato.tipo && (
                    <Badge variant="outline" style={styles.allegatoBadge}>
                      {allegato.tipo}
                    </Badge>
                  )}
                </View>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {stato === 'attiva' && (
            <Button
              variant="default"
              size="lg"
              onPress={handleSeleziona}
              style={styles.selectButton}
            >
              Seleziona Offerta
            </Button>
          )}
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
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
    marginRight: spacing[2],
  },
  offertaNome: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
    flex: 1,
  },
  categoriaIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  headerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  statoBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  statoBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
    color: colors.white,
  },
  bonusCard: {
    marginBottom: spacing[4],
    backgroundColor: colors.success + '15',
    borderColor: colors.success,
    borderWidth: 1,
  },
  bonusContent: {
    alignItems: 'center',
  },
  bonusLabel: {
    fontSize: fontSizes.sm,
    color: colors.success,
    marginBottom: spacing[1],
  },
  bonusValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.success,
    textAlign: 'center',
  },
  sectionCard: {
    marginBottom: spacing[4],
  },
  sectionContent: {
    gap: spacing[2],
  },
  descriptionText: {
    fontSize: fontSizes.base,
    color: colors.foreground,
    lineHeight: fontSizes.base * 1.6,
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
  allegatoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  allegatoNome: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
    flex: 1,
  },
  allegatoBadge: {
    marginLeft: spacing[2],
  },
  actionsContainer: {
    marginTop: spacing[2],
    gap: spacing[3],
  },
  selectButton: {
    width: '100%',
  },
  backButton: {
    width: '100%',
  },
});
