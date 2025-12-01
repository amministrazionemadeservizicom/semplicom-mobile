/**
 * AppLayout - Layout principale dell'app
 * Gestisce la navigazione, drawer menu, e header
 * Stile Sempliswitch
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, ROLES, normalizeRole, getRoleDisplayName } from '../../lib/AuthContext';
import { Header } from './Header';
import { DrawerMenu } from './DrawerMenu';
import { CtaContacts } from './CtaContacts';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

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
  const { userRole: authUserRole, user, logout, userInfo } = useAuth();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [userFullName, setUserFullName] = useState<string>('');

  // Use provided userRole or fallback to auth role, then normalize
  const rawUserRole = userRole || authUserRole || 'consulente';
  const effectiveUserRole = normalizeRole(rawUserRole) || 'consulente';

  // Update user full name from various sources
  useEffect(() => {
    if (user?.name) {
      setUserFullName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (userInfo) {
      const composed = [userInfo.nome, userInfo.cognome]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (composed) {
        setUserFullName(composed);
      }
    }
  }, [userInfo]);

  // Fallback to stored name or default
  useEffect(() => {
    if (!userFullName && !userInfo) {
      // In React Native, we'd use AsyncStorage instead of localStorage
      // For now, use a default
      setUserFullName('Utente');
    }
  }, [userFullName, userInfo]);

  const handleMenuPress = () => {
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
  };

  const handleUserClick = () => {
    setDrawerVisible(false);
    router.push('/(tabs)/profile' as any);
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

  const roleDisplayName = getRoleDisplayName(effectiveUserRole);

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
        onBackPress={handleBack}
        onProfilePress={handleUserClick}
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
        userRole={effectiveUserRole}
        userFullName={userFullName}
        userEmail={user?.email || userInfo?.email}
        agencyName={userInfo?.nomeAgenzia}
        onNavigate={(route) => {
          setDrawerVisible(false);
          router.push(route as any);
        }}
        onLogout={handleLogout}
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
