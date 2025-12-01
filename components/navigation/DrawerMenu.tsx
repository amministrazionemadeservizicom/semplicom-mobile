/**
 * DrawerMenu Component - Menu laterale
 * Stile Sempliswitch: Giallo #F2C927 e Magenta #E6007E
 *
 * Contiene le voci di navigazione aggiuntive non presenti nella tab bar
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, ROLES } from '../../lib/AuthContext';
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
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: () => void;
  roles?: string[]; // Ruoli che possono vedere questo item
}

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, userRole, isSuperAdmin, isAdmin, logout } = useAuth();

  // Menu items basati sul ruolo
  const getMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [];

    // Dashboard (sempre visibile, ma route diversa per ruolo)
    items.push({
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'home-outline',
      route: isSuperAdmin
        ? '/(tabs)/sa-dashboard'
        : isAdmin
          ? '/(tabs)/admin-dashboard'
          : userRole === ROLES.BACK_OFFICE
            ? '/(tabs)/backoffice'
            : '/(tabs)/dashboard',
    });

    // Offerte (tutti tranne backoffice)
    if (userRole !== ROLES.BACK_OFFICE) {
      items.push({
        id: 'offerte',
        label: 'Offerte',
        icon: 'pricetags-outline',
        route: '/(tabs)/offerte',
      });
    }

    // Contratti (tutti)
    items.push({
      id: 'contratti',
      label: 'Contratti',
      icon: 'document-text-outline',
      route: '/(tabs)/contratti',
    });

    // Nuova Pratica (tutti tranne backoffice)
    if (userRole !== ROLES.BACK_OFFICE) {
      items.push({
        id: 'nuova-pratica',
        label: 'Nuova Pratica',
        icon: 'add-circle-outline',
        route: '/(tabs)/nuova-pratica',
      });
    }

    // Messaggi (TODO: da implementare)
    items.push({
      id: 'messaggi',
      label: 'Messaggi',
      icon: 'chatbubbles-outline',
      route: undefined, // Non ancora implementato
    });

    // Solo per Admin/SuperAdmin
    if (isAdmin || isSuperAdmin) {
      items.push({
        id: 'divider-admin',
        label: '',
        icon: 'remove',
      });

      items.push({
        id: 'utenti',
        label: 'Gestione Utenti',
        icon: 'people-outline',
        route: undefined, // TODO: implementare
      });

      items.push({
        id: 'agenzie',
        label: 'Agenzie',
        icon: 'business-outline',
        route: undefined, // TODO: implementare
      });
    }

    // Solo per SuperAdmin
    if (isSuperAdmin) {
      items.push({
        id: 'gestori',
        label: 'Gestori',
        icon: 'briefcase-outline',
        route: undefined, // TODO: implementare
      });

      items.push({
        id: 'impostazioni',
        label: 'Impostazioni',
        icon: 'settings-outline',
        route: undefined, // TODO: implementare
      });
    }

    // Divider
    items.push({
      id: 'divider-profile',
      label: '',
      icon: 'remove',
    });

    // Profilo
    items.push({
      id: 'profilo',
      label: 'Profilo',
      icon: 'person-outline',
      route: '/(tabs)/profilo',
    });

    // Logout
    items.push({
      id: 'logout',
      label: 'Esci',
      icon: 'log-out-outline',
      action: async () => {
        await logout();
        router.replace('/login');
        onClose();
      },
    });

    return items;
  };

  const handleItemPress = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route as any);
      onClose();
    }
  };

  const menuItems = getMenuItems();

  // Genera le iniziali dall'utente
  const getInitials = () => {
    if (!user?.nomeCognome) return 'U';
    const parts = user.nomeCognome.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const getRoleLabel = () => {
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Drawer Content */}
        <View
          style={[
            styles.drawer,
            { paddingTop: insets.top },
          ]}
        >
          {/* Header con profilo utente */}
          <View style={styles.drawerHeader}>
            <View style={styles.userSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.nomeCognome || 'Utente'}
                </Text>
                <Text style={styles.userRole}>{getRoleLabel()}</Text>
                {user?.agenzia && (
                  <Text style={styles.userAgenzia} numberOfLines={1}>
                    {user.agenzia.ragioneSociale}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Chiudi menu"
            >
              <Ionicons
                name="close"
                size={24}
                color={SEMPLISWITCH_COLORS.gray[900]}
              />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuList}
            contentContainerStyle={styles.menuListContent}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item) => {
              // Render divider
              if (item.id.startsWith('divider')) {
                return (
                  <View key={item.id} style={styles.divider} />
                );
              }

              const isDisabled = !item.route && !item.action;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    isDisabled && styles.menuItemDisabled,
                  ]}
                  onPress={() => !isDisabled && handleItemPress(item)}
                  disabled={isDisabled}
                  accessibilityLabel={item.label}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={
                      isDisabled
                        ? SEMPLISWITCH_COLORS.gray[300]
                        : item.id === 'logout'
                          ? SEMPLISWITCH_COLORS.magenta
                          : SEMPLISWITCH_COLORS.gray[700]
                    }
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      isDisabled && styles.menuItemTextDisabled,
                      item.id === 'logout' && styles.menuItemTextLogout,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isDisabled && (
                    <Text style={styles.comingSoon}>Presto</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.drawerFooter, { paddingBottom: insets.bottom + spacing[4] }]}>
            <Text style={styles.footerText}>Sempliswitch Mobile</Text>
            <Text style={styles.footerVersion}>v1.0.0</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: SEMPLISWITCH_COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing[4],
    backgroundColor: SEMPLISWITCH_COLORS.yellow,
    borderBottomWidth: 1,
    borderBottomColor: SEMPLISWITCH_COLORS.gray[200],
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: SEMPLISWITCH_COLORS.white,
  },
  userInfo: {
    marginLeft: spacing[3],
    flex: 1,
  },
  userName: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: SEMPLISWITCH_COLORS.gray[900],
  },
  userRole: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.gray[700],
    marginTop: 2,
  },
  userAgenzia: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.gray[500],
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuList: {
    flex: 1,
  },
  menuListContent: {
    padding: spacing[2],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    marginVertical: spacing[0.5],
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuItemText: {
    fontSize: fontSizes.base,
    color: SEMPLISWITCH_COLORS.gray[700],
    marginLeft: spacing[3],
    flex: 1,
  },
  menuItemTextDisabled: {
    color: SEMPLISWITCH_COLORS.gray[400],
  },
  menuItemTextLogout: {
    color: SEMPLISWITCH_COLORS.magenta,
  },
  comingSoon: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.gray[400],
    backgroundColor: SEMPLISWITCH_COLORS.gray[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
  },
  divider: {
    height: 1,
    backgroundColor: SEMPLISWITCH_COLORS.gray[200],
    marginVertical: spacing[2],
    marginHorizontal: spacing[4],
  },
  drawerFooter: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: SEMPLISWITCH_COLORS.gray[200],
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.gray[500],
  },
  footerVersion: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.gray[400],
    marginTop: 2,
  },
});

export default DrawerMenu;
