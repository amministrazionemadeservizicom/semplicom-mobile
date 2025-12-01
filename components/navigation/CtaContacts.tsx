/**
 * CtaContacts - Pulsanti di contatto rapido
 * Barra fissa in basso per chiamare o scrivere su WhatsApp
 * Stile Sempliswitch
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  cyan: '#0BA0D3',
  white: '#FFFFFF',
};

// Configura questi valori o usa variabili d'ambiente
const PHONE_NUMBER = process.env.EXPO_PUBLIC_PHONE_NUMBER || '+39123456789';
const WHATSAPP_E164 = process.env.EXPO_PUBLIC_WHATSAPP_E164 || '39123456789';

interface CtaContactsProps {
  /** Mostra solo su mobile (nascosto su tablet/desktop) */
  mobileOnly?: boolean;
}

export function CtaContacts({ mobileOnly = true }: CtaContactsProps) {
  const insets = useSafeAreaInsets();

  const handleCall = async () => {
    const phoneUrl = `tel:${PHONE_NUMBER}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);
    if (canOpen) {
      await Linking.openURL(phoneUrl);
    }
  };

  const handleWhatsApp = async () => {
    const message = encodeURIComponent('Ciao, ho bisogno di assistenza da Sempliswitch');
    const whatsappUrl = `https://wa.me/${WHATSAPP_E164}?text=${message}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, spacing[2]) },
      ]}
    >
      {/* Chiamaci */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleCall}
        activeOpacity={0.8}
        accessibilityLabel="Chiama Sempliswitch"
        accessibilityRole="button"
      >
        <View style={styles.iconContainer}>
          <Ionicons name="call-outline" size={22} color={SEMPLISWITCH_COLORS.white} />
        </View>
        <Text style={styles.buttonText}>Chiamaci</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider} />

      {/* WhatsApp */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleWhatsApp}
        activeOpacity={0.8}
        accessibilityLabel="Scrivici su WhatsApp"
        accessibilityRole="button"
      >
        <View style={styles.iconContainer}>
          <Ionicons name="logo-whatsapp" size={22} color={SEMPLISWITCH_COLORS.white} />
        </View>
        <Text style={styles.buttonText}>Scrivici</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: SEMPLISWITCH_COLORS.cyan,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SEMPLISWITCH_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: SEMPLISWITCH_COLORS.white,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: spacing[2],
  },
});

export default CtaContacts;
