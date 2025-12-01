/**
 * Header Component - Navigazione superiore
 * Stile Sempliswitch: Giallo #F2C927 e Magenta #E6007E
 *
 * Contiene:
 * - Logo Sempliswitch (o testo)
 * - Icona notifiche
 * - Avatar profilo con iniziali
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/AuthContext';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  magentaDark: '#C70067',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F3F4F6',
    200: '#E5E7EB',
    500: '#6B7280',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

interface HeaderProps {
  title?: string;
  showNotifications?: boolean;
  showProfile?: boolean;
  showBackButton?: boolean;
  onMenuPress?: () => void;
}

export function Header({
  title,
  showNotifications = true,
  showProfile = true,
  showBackButton = false,
  onMenuPress,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();

  // Genera le iniziali dall'utente
  const getInitials = () => {
    if (!user?.nomeCognome) return 'U';
    const parts = user.nomeCognome.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const handleNotificationsPress = () => {
    // TODO: Navigare alla schermata notifiche quando disponibile
    console.log('Notifications pressed');
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/profilo');
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing[2] },
      ]}
    >
      <View style={styles.content}>
        {/* Left Section: Menu/Back button + Logo */}
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBackPress}
              accessibilityLabel="Torna indietro"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={SEMPLISWITCH_COLORS.gray[900]}
              />
            </TouchableOpacity>
          ) : onMenuPress ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onMenuPress}
              accessibilityLabel="Apri menu"
            >
              <Ionicons
                name="menu"
                size={24}
                color={SEMPLISWITCH_COLORS.gray[900]}
              />
            </TouchableOpacity>
          ) : null}

          {/* Logo o Titolo */}
          <View style={styles.logoContainer}>
            {title ? (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            ) : (
              <>
                <Text style={styles.logoText}>Sempli</Text>
                <Text style={styles.logoTextAccent}>switch</Text>
              </>
            )}
          </View>
        </View>

        {/* Right Section: Notifications + Profile */}
        {isAuthenticated && (
          <View style={styles.rightSection}>
            {showNotifications && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleNotificationsPress}
                accessibilityLabel="Notifiche"
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={SEMPLISWITCH_COLORS.gray[900]}
                />
                {/* Badge per notifiche non lette (placeholder) */}
                {/* <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>3</Text>
                </View> */}
              </TouchableOpacity>
            )}

            {showProfile && (
              <TouchableOpacity
                style={styles.profileButton}
                onPress={handleProfilePress}
                accessibilityLabel="Profilo"
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials()}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMPLISWITCH_COLORS.yellow,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 56,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SEMPLISWITCH_COLORS.yellow,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[2],
  },
  logoText: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.gray[900],
  },
  logoTextAccent: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.magenta,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.gray[900],
    flex: 1,
  },
  profileButton: {
    marginLeft: spacing[1],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: SEMPLISWITCH_COLORS.magenta,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold as any,
    color: SEMPLISWITCH_COLORS.white,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.white,
  },
});

export default Header;
