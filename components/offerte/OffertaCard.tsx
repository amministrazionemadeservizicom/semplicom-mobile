/**
 * OffertaCard - Card offerta professionale per React Native
 * Adattata da sempliswitch/client/components/offerte/OffertaCardPublic.tsx
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OffertaCompleta, OfferteAPI } from '../../lib/api/offerte';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

interface OffertaCardProps {
  offerta: OffertaCompleta;
  onSelect?: (offerta: OffertaCompleta) => void;
  onDetails?: (offerta: OffertaCompleta) => void;
  showActions?: boolean;
}

// Colori Sempliswitch
const COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  energia: '#F59E0B',
  telco: '#3B82F6',
  fotovoltaico: '#10B981',
  fisso: '#059669',
  indicizzato: '#7C3AED',
};

export function OffertaCard({
  offerta,
  onSelect,
  onDetails,
  showActions = true,
}: OffertaCardProps) {
  // Gestione wrapper "base" dalla risposta API
  const base = offerta.base || (offerta as any);
  const energia = offerta.energia;
  const telco = offerta.telco;
  const fotovoltaico = offerta.fotovoltaico;
  const allegati = offerta.allegati || [];

  // Recupera ID gestore da diverse fonti possibili
  const idGestore = (offerta as any).idGestore || (base as any).idGestore || offerta.gestore?.id;
  const nomeGestore = (offerta as any).nomeGestore || (base as any).nomeGestore || offerta.gestore?.nome;
  const nomeOfferta = (base as any).nome || offerta.nomeOfferta || 'Offerta';
  const categoria = (base as any).categoria || offerta.categoria || 'energia';
  const customer = (base as any).customer;
  const bonus = (base as any).bonus;

  // URL logo gestore
  const logoUrl = idGestore ? OfferteAPI.getLogoGestoreUrl(idGestore) : null;

  // Icona categoria
  const getCategoriaIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (categoria) {
      case 'energia':
        return 'flash';
      case 'telco':
        return 'wifi';
      case 'fotovoltaico':
        return 'sunny';
      default:
        return 'cube';
    }
  };

  // Colore categoria
  const getCategoriaColor = (): string => {
    switch (categoria) {
      case 'energia':
        return COLORS.energia;
      case 'telco':
        return COLORS.telco;
      case 'fotovoltaico':
        return COLORS.fotovoltaico;
      default:
        return colors.mutedForeground;
    }
  };

  // Label categoria
  const getCategoriaLabel = (): string => {
    switch (categoria) {
      case 'energia':
        return 'Energia';
      case 'telco':
        return 'Telco';
      case 'fotovoltaico':
        return 'Fotovoltaico';
      default:
        return 'Altro';
    }
  };

  // Determina prezzo principale in base alla categoria
  const getPrezzoDisplay = () => {
    if (categoria === 'energia' && energia) {
      const isFisso = energia.prezzoTipo === true || (energia.prezzoTipo as any) === 'fisso';
      const indice = energia.indice || (energia.commodity === 'luce' ? 'PUN' : 'PSV');
      const unit = energia.commodity === 'luce' ? 'kWh' : 'Smc';
      const prezzo = energia.prezzo || 0;

      return {
        label: isFisso ? 'Prezzo FISSO' : 'Prezzo INDICIZZATO',
        isFisso,
        indice,
        value: isFisso
          ? `${prezzo.toFixed(3)} €/${unit}`
          : `${indice}+ ${prezzo.toFixed(3)} €/${unit}`,
        commodity: energia.commodity,
        unit,
      };
    }

    if (categoria === 'telco' && telco) {
      return {
        label: telco.tecnologia || 'Internet',
        value: telco.prezzo ? `${telco.prezzo.toFixed(2)} €/mese` : 'Prezzo su richiesta',
        extra: telco.attivazione ? `Attivazione: ${telco.attivazione.toFixed(2)} €` : 'Attivazione inclusa',
      };
    }

    if (categoria === 'fotovoltaico' && fotovoltaico) {
      return {
        label: `Impianto ${fotovoltaico.plantKw} kW`,
        value: fotovoltaico.prezzo ? `${fotovoltaico.prezzo.toLocaleString()} €` : 'Preventivo',
        extra: fotovoltaico.batteria
          ? `Batteria ${fotovoltaico.batteryKwh || 0} kWh`
          : 'Solo pannelli',
      };
    }

    return null;
  };

  // Dettagli specifici per categoria
  const getDettagli = (): { icon: keyof typeof Ionicons.glyphMap; text: string; color: string }[] => {
    const items: { icon: keyof typeof Ionicons.glyphMap; text: string; color: string }[] = [];

    if (categoria === 'energia' && energia) {
      // Tipo acquisizione
      const acquisitionLabels: Record<string, string> = {
        switch: 'Switch',
        switch_con_voltura: 'Switch con voltura',
        prima_attivazione: 'Prima attivazione',
        subentro: 'Subentro',
        voltura: 'Voltura',
      };
      items.push({
        icon: 'flash',
        text: acquisitionLabels[energia.acquisition || ''] || energia.acquisition || 'Nuova attivazione',
        color: '#059669',
      });

      // Metodo pagamento
      items.push({
        icon: 'card',
        text: (energia as any).abilitaBollettino ? 'RID o Bollettino' : 'RID',
        color: '#3B82F6',
      });

      // Periodo fatturazione
      items.push({
        icon: 'calendar',
        text: `Fatturazione ${energia.periodoFatturazione || 'bimestrale'}`,
        color: '#F59E0B',
      });
    }

    if (categoria === 'telco' && telco) {
      items.push({
        icon: 'wifi',
        text: `Tecnologia: ${telco.tecnologia || 'N/D'}`,
        color: '#3B82F6',
      });
      if (telco.contenutiTv) {
        items.push({
          icon: 'tv',
          text: 'Contenuti TV inclusi',
          color: '#059669',
        });
      }
      if (telco.lineaMobile) {
        items.push({
          icon: 'phone-portrait',
          text: 'Linea mobile inclusa',
          color: '#059669',
        });
      }
    }

    if (categoria === 'fotovoltaico' && fotovoltaico) {
      items.push({
        icon: 'sunny',
        text: `Potenza: ${fotovoltaico.plantKw} kW`,
        color: '#F59E0B',
      });
      if (fotovoltaico.batteria) {
        items.push({
          icon: 'battery-charging',
          text: `Accumulo ${fotovoltaico.batteryKwh || 0} kWh`,
          color: '#059669',
        });
      }
      if (fotovoltaico.trifase) {
        items.push({
          icon: 'flash',
          text: 'Inverter trifase',
          color: '#3B82F6',
        });
      }
    }

    return items;
  };

  const prezzoInfo = getPrezzoDisplay();
  const dettagli = getDettagli();

  return (
    <Card style={styles.card}>
      <CardContent style={styles.content}>
        {/* Header con logo e info gestore */}
        <View style={styles.header}>
          {/* Logo Gestore */}
          <View style={styles.logoContainer}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.logo}
                resizeMode="contain"
                onError={() => {
                  // Logo non disponibile, mostrerà l'icona di fallback
                }}
              />
            ) : (
              <View style={[styles.logoFallback, { backgroundColor: getCategoriaColor() + '20' }]}>
                <Ionicons name={getCategoriaIcon()} size={32} color={getCategoriaColor()} />
              </View>
            )}
          </View>

          {/* Badge categoria */}
          <View style={[styles.categoriaBadge, { backgroundColor: getCategoriaColor() }]}>
            <Ionicons name={getCategoriaIcon()} size={12} color="#FFF" />
            <Text style={styles.categoriaBadgeText}>{getCategoriaLabel()}</Text>
          </View>
        </View>

        {/* Nome Gestore + Nome Offerta */}
        <View style={styles.titleSection}>
          <Text style={styles.gestoreName}>{nomeGestore || 'Gestore'}</Text>
          <Text style={styles.offertaName} numberOfLines={2}>{nomeOfferta}</Text>
        </View>

        {/* Prezzo principale */}
        {prezzoInfo && (
          <View style={styles.prezzoSection}>
            {/* Badge tipo prezzo per energia */}
            {'isFisso' in prezzoInfo && (
              <View style={[
                styles.tipoPrezzoTag,
                { backgroundColor: prezzoInfo.isFisso ? COLORS.fisso + '20' : COLORS.indicizzato + '20' }
              ]}>
                <Text style={[
                  styles.tipoPrezzoText,
                  { color: prezzoInfo.isFisso ? COLORS.fisso : COLORS.indicizzato }
                ]}>
                  {prezzoInfo.isFisso ? 'FISSA' : 'INDICIZZATA'}
                </Text>
              </View>
            )}
            <Text style={styles.prezzoLabel}>{prezzoInfo.label}</Text>
            <Text style={styles.prezzoValue}>{prezzoInfo.value}</Text>
            {'extra' in prezzoInfo && prezzoInfo.extra && (
              <Text style={styles.prezzoExtra}>{prezzoInfo.extra}</Text>
            )}
          </View>
        )}

        {/* Dettagli specifici */}
        {dettagli.length > 0 && (
          <View style={styles.dettagliSection}>
            {dettagli.map((item, idx) => (
              <View key={idx} style={styles.dettaglioItem}>
                <Ionicons name={item.icon} size={16} color={item.color} />
                <Text style={styles.dettaglioText}>{item.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Customer type */}
        {customer && (
          <View style={styles.customerSection}>
            <Badge variant="outline">
              {customer === 'privato' && 'Per Privati'}
              {customer === 'business' && 'Per Aziende'}
              {customer === 'condominio' && 'Per Condomini'}
            </Badge>
          </View>
        )}

        {/* Allegati info */}
        {allegati.length > 0 && (
          <View style={styles.allegatiInfo}>
            <Ionicons name="attach" size={14} color={colors.mutedForeground} />
            <Text style={styles.allegatiText}>
              {allegati.length} documento{allegati.length > 1 ? 'i' : ''} disponibil{allegati.length > 1 ? 'i' : 'e'}
            </Text>
          </View>
        )}

        {/* Bonus */}
        {bonus && (
          <View style={styles.bonusSection}>
            <Ionicons name="gift" size={16} color={COLORS.magenta} />
            <Text style={styles.bonusText}>{bonus}</Text>
          </View>
        )}

        {/* Azioni */}
        {showActions && (
          <View style={styles.actionsSection}>
            {onSelect && (
              <Button
                variant="default"
                size="sm"
                style={styles.selectButton}
                onPress={() => onSelect(offerta)}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="cart" size={18} color="#000" />
                  <Text style={styles.selectButtonText}>Seleziona</Text>
                </View>
              </Button>
            )}

            {onDetails && (
              <Button
                variant="outline"
                size="sm"
                onPress={() => onDetails(offerta)}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="information-circle" size={18} color={colors.foreground} />
                  <Text style={styles.detailsButtonText}>Dettagli</Text>
                </View>
              </Button>
            )}
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[4],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      } as any,
    }),
  },
  content: {
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  logoContainer: {
    width: 80,
    height: 60,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  categoriaBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
    color: '#FFF',
  },
  titleSection: {
    marginBottom: spacing[3],
  },
  gestoreName: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  offertaName: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  prezzoSection: {
    backgroundColor: '#EFF6FF',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  tipoPrezzoTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
    marginBottom: spacing[2],
  },
  tipoPrezzoText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold as any,
  },
  prezzoLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  prezzoValue: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: '#2563EB',
  },
  prezzoExtra: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
  dettagliSection: {
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  dettaglioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  dettaglioText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  customerSection: {
    marginBottom: spacing[3],
  },
  allegatiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  allegatiText: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  bonusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#FDF2F8',
    padding: spacing[2],
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
  },
  bonusText: {
    fontSize: fontSizes.sm,
    color: COLORS.magenta,
    fontWeight: fontWeights.medium as any,
    flex: 1,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  selectButton: {
    flex: 1,
    backgroundColor: COLORS.yellow,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  selectButtonText: {
    color: '#000',
    fontWeight: fontWeights.semibold as any,
  },
  detailsButtonText: {
    color: colors.foreground,
  },
});

export default OffertaCard;
