/**
 * DrawerMenu Component - Menu laterale
 * Stile Sempliswitch: Giallo #F2C927 e Magenta #E6007E
 *
 * Mostra solo le pagine accessibili in base al ruolo utente:
 * - SuperAdmin: tutte le pagine + gestione sistema
 * - Admin: dashboard admin, contratti, utenti, presenze, offerte
 * - Master: dashboard, offerte, contratti, nuova pratica, consulenti
 * - Consulente: dashboard, offerte, contratti, nuova pratica
 * - BackOffice: dashboard backoffice, coda lavorazione, contratti
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
import { useAuth, ROLES, type UserRole } from '../../lib/AuthContext';
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
    600: '#4B5563',
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
  roles: UserRole[]; // Ruoli che possono vedere questo item
  section?: 'main' | 'admin' | 'system' | 'profile';
}

// Definizione completa delle pagine e dei ruoli che possono accedervi
const ALL_MENU_ITEMS: MenuItem[] = [
  // === SEZIONE PRINCIPALE ===
  // Dashboard - route diversa per ruolo (gestita dinamicamente)
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home-outline',
    route: '/(tabs)/dashboard', // Route default, verrà sovrascritta
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MASTER, ROLES.CONSULENTE, ROLES.BACK_OFFICE],
    section: 'main',
  },
  // Offerte - NON per backoffice
  {
    id: 'offerte',
    label: 'Offerte',
    icon: 'pricetags-outline',
    route: '/(tabs)/offerte',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MASTER, ROLES.CONSULENTE],
    section: 'main',
  },
  // Contratti - tutti
  {
    id: 'contratti',
    label: 'Contratti',
    icon: 'document-text-outline',
    route: '/(tabs)/contratti',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MASTER, ROLES.CONSULENTE, ROLES.BACK_OFFICE],
    section: 'main',
  },
  // Nuova Pratica - NON per backoffice
  {
    id: 'nuova-pratica',
    label: 'Nuova Pratica',
    icon: 'add-circle-outline',
    route: '/(tabs)/nuova-pratica',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MASTER, ROLES.CONSULENTE],
    section: 'main',
  },
  // Coda Lavorazione - SOLO backoffice
  {
    id: 'coda-lavorazione',
    label: 'Coda Lavorazione',
    icon: 'list-outline',
    route: '/(tabs)/backoffice',
    roles: [ROLES.BACK_OFFICE],
    section: 'main',
  },
  // Messaggi - tutti tranne backoffice
  {
    id: 'messaggi',
    label: 'Messaggi',
    icon: 'chatbubbles-outline',
    route: '/(tabs)/messaggi',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MASTER, ROLES.CONSULENTE],
    section: 'main',
  },
  // Simulatore - tutti tranne backoffice
  {
    id: 'simulation',
    label: 'Simulatore',
    icon: 'calculator-outline',
    route: '/(tabs)/simulation',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MASTER, ROLES.CONSULENTE],
    section: 'main',
  },
  // Ricerca Prodotto - tutti tranne backoffice
  {
    id: 'product-finder',
    label: 'Ricerca Prodotto',
    icon: 'search-outline',
    route: '/(tabs)/product-finder',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MASTER, ROLES.CONSULENTE],
    section: 'main',
  },
  // Drive documenti - tutti
  {
    id: 'drive',
    label: 'Drive',
    icon: 'folder-outline',
    route: '/(tabs)/drive',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MASTER, ROLES.CONSULENTE, ROLES.BACK_OFFICE],
    section: 'main',
  },

  // === SEZIONE AMMINISTRAZIONE ===
  // Gestione Contratti Admin
  {
    id: 'admin-contratti',
    label: 'Gestione Contratti',
    icon: 'documents-outline',
    route: '/(tabs)/admin-contratti',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    section: 'admin',
  },
  // Gestione Utenti
  {
    id: 'users',
    label: 'Gestione Utenti',
    icon: 'people-outline',
    route: '/(tabs)/users',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    section: 'admin',
  },
  // Presenze
  {
    id: 'presenze',
    label: 'Presenze',
    icon: 'calendar-outline',
    route: '/(tabs)/admin-attendance',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    section: 'admin',
  },
  // Gestione Offerte Admin
  {
    id: 'admin-offerte',
    label: 'Gestione Offerte',
    icon: 'pricetag-outline',
    route: '/(tabs)/admin-offers',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MASTER],
    section: 'admin',
  },
  // Consulenti (per Master)
  {
    id: 'consulenti',
    label: 'I Miei Consulenti',
    icon: 'people-circle-outline',
    route: '/(tabs)/consulenti',
    roles: [ROLES.MASTER],
    section: 'admin',
  },
  // Il Mio Piano Compenso - consulenti e master
  {
    id: 'my-piano-compenso',
    label: 'Il Mio Piano Compenso',
    icon: 'wallet-outline',
    route: '/(tabs)/my-piano-compenso',
    roles: [ROLES.MASTER, ROLES.CONSULENTE],
    section: 'admin',
  },
  // Stato Pagamenti - admin e SA
  {
    id: 'stato-pagamenti',
    label: 'Stato Pagamenti',
    icon: 'cash-outline',
    route: '/(tabs)/stato-pagamenti',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    section: 'admin',
  },
  // Piani Compenso - solo admin e SA
  {
    id: 'piani-compenso',
    label: 'Piani Compenso',
    icon: 'clipboard-outline',
    route: '/(tabs)/piani-compenso',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
    section: 'admin',
  },
  // Comunicazioni - tutti tranne backoffice
  {
    id: 'comunicazioni',
    label: 'Comunicazioni',
    icon: 'megaphone-outline',
    route: '/(tabs)/comunicazioni',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MASTER, ROLES.CONSULENTE],
    section: 'admin',
  },

  // === SEZIONE SISTEMA (Solo SuperAdmin) ===
  {
    id: 'global-users',
    label: 'Gestione Utenti',
    icon: 'people-outline',
    route: '/(tabs)/global-users',
    roles: [ROLES.SUPERADMIN],
    section: 'system',
  },
  {
    id: 'gestione-agenzie',
    label: 'Gestione Agenzie',
    icon: 'business-outline',
    route: '/(tabs)/gestione-agenzie',
    roles: [ROLES.SUPERADMIN],
    section: 'system',
  },
  {
    id: 'gestori',
    label: 'Gestori',
    icon: 'briefcase-outline',
    route: '/(tabs)/gestori',
    roles: [ROLES.SUPERADMIN],
    section: 'system',
  },
  {
    id: 'impostazioni',
    label: 'Impostazioni',
    icon: 'settings-outline',
    route: '/(tabs)/impostazioni',
    roles: [ROLES.SUPERADMIN],
    section: 'system',
  },

  // === SEZIONE PROFILO (tutti) ===
  {
    id: 'profilo',
    label: 'Profilo',
    icon: 'person-outline',
    route: '/(tabs)/profilo',
    roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MASTER, ROLES.CONSULENTE, ROLES.BACK_OFFICE],
    section: 'profile',
  },
];

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, userRole, isSuperAdmin, isAdmin, logout } = useAuth();

  // Filtra menu items in base al ruolo
  const getMenuItemsForRole = (): MenuItem[] => {
    if (!userRole) return [];

    // Filtra gli items per il ruolo corrente
    const filteredItems = ALL_MENU_ITEMS.filter((item) =>
      item.roles.includes(userRole)
    );

    // Aggiusta la route della dashboard in base al ruolo
    return filteredItems.map((item) => {
      if (item.id === 'dashboard') {
        let dashboardRoute = '/(tabs)/dashboard';

        if (isSuperAdmin) {
          dashboardRoute = '/(tabs)/sa-dashboard';
        } else if (isAdmin) {
          dashboardRoute = '/(tabs)/admin-dashboard';
        } else if (userRole === ROLES.MASTER) {
          dashboardRoute = '/(tabs)/master-dashboard';
        } else if (userRole === ROLES.BACK_OFFICE) {
          dashboardRoute = '/(tabs)/backoffice';
        }

        return { ...item, route: dashboardRoute };
      }
      return item;
    });
  };

  // Raggruppa items per sezione
  const groupedItems = () => {
    const items = getMenuItemsForRole();
    const main = items.filter((i) => i.section === 'main');
    const admin = items.filter((i) => i.section === 'admin');
    const system = items.filter((i) => i.section === 'system');
    const profile = items.filter((i) => i.section === 'profile');

    return { main, admin, system, profile };
  };

  const handleItemPress = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route as any);
      onClose();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/login');
      onClose();
    }
  };

  // Genera le iniziali dall'utente
  const getInitials = () => {
    if (!user?.nomeCognome) return 'U';
    const parts = user.nomeCognome.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // Label del ruolo in italiano
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

  // Colore del badge ruolo
  const getRoleBadgeColor = () => {
    switch (userRole) {
      case ROLES.SUPERADMIN:
        return '#DC2626'; // Red
      case ROLES.ADMIN:
        return '#7C3AED'; // Purple
      case ROLES.MASTER:
        return '#2563EB'; // Blue
      case ROLES.CONSULENTE:
        return '#059669'; // Green
      case ROLES.BACK_OFFICE:
        return '#D97706'; // Amber
      default:
        return SEMPLISWITCH_COLORS.gray[500];
    }
  };

  const { main, admin, system, profile } = groupedItems();

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
      accessibilityLabel={item.label}
    >
      <Ionicons
        name={item.icon}
        size={22}
        color={SEMPLISWITCH_COLORS.gray[700]}
      />
      <Text style={styles.menuItemText}>{item.label}</Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={SEMPLISWITCH_COLORS.gray[400]}
      />
    </TouchableOpacity>
  );

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
                <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor() }]}>
                  <Text style={styles.roleBadgeText}>{getRoleLabel()}</Text>
                </View>
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
            {/* Sezione Principale */}
            {main.length > 0 && (
              <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>Menu</Text>
                {main.map(renderMenuItem)}
              </View>
            )}

            {/* Sezione Amministrazione */}
            {admin.length > 0 && (
              <View style={styles.menuSection}>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Amministrazione</Text>
                {admin.map(renderMenuItem)}
              </View>
            )}

            {/* Sezione Sistema (Solo SuperAdmin) */}
            {system.length > 0 && (
              <View style={styles.menuSection}>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Sistema</Text>
                {system.map(renderMenuItem)}
              </View>
            )}

            {/* Sezione Profilo */}
            {profile.length > 0 && (
              <View style={styles.menuSection}>
                <View style={styles.divider} />
                {profile.map(renderMenuItem)}
              </View>
            )}

            {/* Logout */}
            <View style={styles.menuSection}>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleLogout}
                activeOpacity={0.7}
                accessibilityLabel="Esci"
              >
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={SEMPLISWITCH_COLORS.magenta}
                />
                <Text style={[styles.menuItemText, styles.menuItemTextLogout]}>
                  Esci
                </Text>
              </TouchableOpacity>
            </View>
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
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
    marginTop: spacing[1],
  },
  roleBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium as any,
    color: SEMPLISWITCH_COLORS.white,
  },
  userAgenzia: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.gray[600],
    marginTop: spacing[1],
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
    paddingVertical: spacing[2],
  },
  menuSection: {
    paddingHorizontal: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold as any,
    color: SEMPLISWITCH_COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    marginTop: spacing[1],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    marginVertical: spacing[0.5],
  },
  menuItemText: {
    fontSize: fontSizes.base,
    color: SEMPLISWITCH_COLORS.gray[700],
    marginLeft: spacing[3],
    flex: 1,
  },
  menuItemTextLogout: {
    color: SEMPLISWITCH_COLORS.magenta,
    fontWeight: fontWeights.medium as any,
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
