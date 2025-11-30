/**
 * Profilo Screen
 * COPIATO DA SEMPLISWITCH - NON MODIFICARE SENZA SINCRONIZZARE
 *
 * Fonte: sempliswitch/client/pages/Profile.tsx
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getRoleDisplayName } from '../../shared/utils/roles';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

export default function ProfiloScreen() {
  const { user, userRole, logout, isSuperAdmin, isAdmin } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Errore', 'Errore durante il logout');
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = async () => {
    // Su web, window.confirm funziona meglio di Alert.alert
    if (Platform.OS === 'web') {
      if (window.confirm('Sei sicuro di voler uscire?')) {
        await performLogout();
      }
    } else {
      Alert.alert(
        'Conferma Logout',
        'Sei sicuro di voler uscire?',
        [
          {
            text: 'Annulla',
            style: 'cancel',
          },
          {
            text: 'Esci',
            style: 'destructive',
            onPress: performLogout,
          },
        ],
        { cancelable: true }
      );
    }
  };

  const getRoleBadgeVariant = () => {
    if (isSuperAdmin) return 'destructive';
    if (isAdmin) return 'default';
    return 'secondary';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.nomeCognome
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'U'}
            </Text>
          </View>
        </View>

        <Text style={styles.userName}>{user?.nomeCognome || 'Utente'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <Badge variant={getRoleBadgeVariant()} style={styles.roleBadge}>
          {getRoleDisplayName(userRole)}
        </Badge>
      </View>

      {/* Account Info */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Informazioni Account</CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user?.username || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ruolo</Text>
            <Text style={styles.infoValue}>{getRoleDisplayName(userRole)}</Text>
          </View>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Impostazioni</CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              // TODO: Navigate to notification settings
            }}
          >
            <Text style={styles.settingLabel}>Notifiche</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              // TODO: Navigate to password change
            }}
          >
            <Text style={styles.settingLabel}>Cambia Password</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              // TODO: Navigate to privacy settings
            }}
          >
            <Text style={styles.settingLabel}>Privacy</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </CardContent>
      </Card>

      {/* Support */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Supporto</CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              // TODO: Open support chat or email
            }}
          >
            <Text style={styles.settingLabel}>Contatta Supporto</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              // TODO: Open FAQ
            }}
          >
            <Text style={styles.settingLabel}>FAQ</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Versione App</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="destructive"
        size="lg"
        loading={isLoggingOut}
        disabled={isLoggingOut}
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        {isLoggingOut ? 'Disconnessione...' : 'Esci'}
      </Button>

      {/* Footer */}
      <Text style={styles.footerText}>Semplicom Mobile v1.0.0</Text>
    </ScrollView>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  avatarContainer: {
    marginBottom: spacing[4],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.primaryForeground,
  },
  userName: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  userEmail: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[2],
  },
  roleBadge: {
    marginTop: spacing[1],
  },
  card: {
    marginBottom: spacing[4],
  },
  cardContent: {
    paddingVertical: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  infoLabel: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  infoValue: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.foreground,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  settingLabel: {
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  settingArrow: {
    fontSize: fontSizes.xl,
    color: colors.mutedForeground,
  },
  settingValue: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  logoutButton: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  footerText: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
