/**
 * AccessDenied Component
 * Schermata di accesso negato per utenti senza permessi
 * Stile Sempliswitch
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

interface AccessDeniedProps {
  backTo?: string;
  message?: string;
}

export function AccessDenied({
  backTo,
  message = 'Non hai i requisiti per vedere questa pagina.',
}: AccessDeniedProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole, isSuperAdmin, isAdmin } = useAuth();

  // Determina dove reindirizzare l'utente
  const getRedirectPath = (): string => {
    if (backTo) return backTo;

    // Redirect basato sul ruolo
    if (isSuperAdmin) return '/(tabs)/sa-dashboard';
    if (isAdmin) return '/(tabs)/admin-dashboard';
    if (userRole === ROLES.BACK_OFFICE) return '/(tabs)/backoffice';
    return '/(tabs)/dashboard';
  };

  const getDashboardPath = (): string => {
    if (isSuperAdmin) return '/(tabs)/sa-dashboard';
    if (isAdmin) return '/(tabs)/admin-dashboard';
    if (userRole === ROLES.BACK_OFFICE) return '/(tabs)/backoffice';
    return '/(tabs)/dashboard';
  };

  const handleGoBack = () => {
    const redirectPath = getRedirectPath();
    router.replace(redirectPath as any);
  };

  const handleGoHome = () => {
    const dashboardPath = getDashboardPath();
    router.replace(dashboardPath as any);
  };

  const getRoleDisplayName = (): string => {
    switch (userRole) {
      case ROLES.SUPERADMIN:
        return 'Super Admin';
      case ROLES.ADMIN:
        return 'Amministratore';
      case ROLES.MASTER:
        return 'Master';
      case ROLES.CONSULENTE:
        return 'Consulente';
      case ROLES.BACK_OFFICE:
        return 'Back Office';
      default:
        return 'Utente';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing[4],
          paddingBottom: insets.bottom + spacing[4],
        },
      ]}
    >
      <Card style={styles.card}>
        <CardHeader style={styles.cardHeader}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={32} color={colors.destructive} />
          </View>

          {/* Title */}
          <CardTitle style={styles.title}>Accesso negato</CardTitle>

          {/* Description */}
          <Text style={styles.description}>{message}</Text>
        </CardHeader>

        <CardContent style={styles.cardContent}>
          {/* User info */}
          <View style={styles.userInfoContainer}>
            <Text style={styles.userInfoLabel}>Sei autenticato come:</Text>
            <Text style={styles.userInfoRole}>{getRoleDisplayName()}</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonsContainer}>
            <Button
              variant="default"
              size="lg"
              onPress={handleGoHome}
              style={styles.button}
            >
              <View style={styles.buttonContent}>
                <Ionicons
                  name="home-outline"
                  size={18}
                  color={colors.primaryForeground}
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Torna alla Dashboard</Text>
              </View>
            </Button>

            {backTo && backTo !== getDashboardPath() && (
              <Button
                variant="outline"
                size="lg"
                onPress={handleGoBack}
                style={styles.button}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="arrow-back-outline"
                    size={18}
                    color={colors.foreground}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonTextOutline}>Torna Indietro</Text>
                </View>
              </Button>
            )}
          </View>

          {/* Additional info */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Se ritieni di dover accedere a questa pagina,{'\n'}
              contatta l'amministratore del sistema.
            </Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  cardHeader: {
    alignItems: 'center',
    paddingBottom: spacing[4],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.statoAnnullato,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: fontSizes.base * 1.5,
  },
  cardContent: {
    gap: spacing[4],
  },
  userInfoContainer: {
    backgroundColor: colors.muted,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  userInfoLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  userInfoRole: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  buttonsContainer: {
    gap: spacing[3],
  },
  button: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: spacing[2],
  },
  buttonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.primaryForeground,
  },
  buttonTextOutline: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  footerContainer: {
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: fontSizes.xs * 1.6,
  },
});

export default AccessDenied;
