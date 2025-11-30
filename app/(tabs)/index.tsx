/**
 * Tabs Index - Mostra Dashboard di default
 * Questo file esiste solo per gestire la route /(tabs)/
 * Reindirizza alla dashboard appropriata
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { colors } from '../../styles/colors';

export default function TabsIndex() {
  const { userRole, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Redirect alla dashboard corretta per il ruolo
    let dashboardRoute = 'dashboard';

    switch (userRole) {
      case ROLES.SUPERADMIN:
        dashboardRoute = 'sa-dashboard';
        break;
      case ROLES.ADMIN:
        dashboardRoute = 'admin-dashboard';
        break;
      case ROLES.BACK_OFFICE:
        dashboardRoute = 'backoffice';
        break;
      default:
        dashboardRoute = 'dashboard';
    }

    router.replace(`/(tabs)/${dashboardRoute}`);
  }, [userRole, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
