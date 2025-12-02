/**
 * AppLayout - Layout principale dell'app
 * Gestisce la navigazione, drawer menu, e header
 * Stile Sempliswitch
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, ROLES, normalizeRole, getRoleDisplayName } from '../../lib/AuthContext';
import { Header } from './Header';
import { DrawerMenu } from './DrawerMenu';
import { CtaContacts } from './CtaContacts';
import { colors } from '../../styles/colors';

interface AppLayoutProps {
  children: React.ReactNode;
  /** Override del ruolo utente */
  userRole?: string;
  /** Mostra navigazione (header, menu) */
  showNavigation?: boolean;
  /** Titolo da mostrare nell'header */
  title?: string;
  /** Mostra pulsante indietro */
  showBackButton?: boolean;
  /** Mostra barra contatti (Chiamaci/Scrivici) */
  showCtaContacts?: boolean;
  /** Callback navigazione indietro */
  onBack?: () => void;
}

export function AppLayout({
  children,
  userRole,
  showNavigation = true,
  title,
  showBackButton = false,
  showCtaContacts = false,
  onBack,
}: AppLayoutProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole: authUserRole, user, logout } = useAuth();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [userFullName, setUserFullName] = useState<string>('');

  // Use provided userRole or fallback to auth role, then normalize
  const rawUserRole = userRole || authUserRole || 'consulente';
  const effectiveUserRole = normalizeRole(rawUserRole) || 'consulente';

  // Update user full name from user object
  useEffect(() => {
    if (user?.nomeCognome) {
      setUserFullName(user.nomeCognome);
    } else {
      setUserFullName('Utente');
    }
  }, [user?.nomeCognome]);

  const handleMenuPress = () => {
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
  };

  const handleUserClick = () => {
    setDrawerVisible(false);
    router.push('/(tabs)/profilo' as any);
  };

  const handleLogout = async () => {
    try {
      setDrawerVisible(false);
      await logout();
      router.replace('/login' as any);
    } catch (error) {
      console.error('Errore durante il logout:', error);
      router.replace('/login' as any);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // If navigation is disabled, just render children
  if (!showNavigation) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title={title}
        showBackButton={showBackButton}
        showNotifications={true}
        showProfile={true}
        onMenuPress={handleMenuPress}
      />

      {/* Main Content */}
      <View style={[
        styles.content,
        showCtaContacts && styles.contentWithCta,
      ]}>
        {children}
      </View>

      {/* CTA Contacts Bar */}
      {showCtaContacts && <CtaContacts />}

      {/* Drawer Menu */}
      <DrawerMenu
        visible={drawerVisible}
        onClose={handleCloseDrawer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentWithCta: {
    // Add padding for the CTA bar at the bottom
    paddingBottom: 60,
  },
});

export default AppLayout;
