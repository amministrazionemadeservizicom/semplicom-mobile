/**
 * BottomNav - Navigazione inferiore mobile
 * Barra di navigazione fissa in basso con menu laterale
 * Stile Sempliswitch
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, normalizeRole, getRoleDisplayName } from '../../lib/AuthContext';
import { DrawerMenu } from './DrawerMenu';
import { spacing } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  dark: '#333333',
};

interface BottomNavItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  href: string;
  roles: string[];
}

const bottomNavItems: BottomNavItem[] = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: 'home-outline',
    iconActive: 'home',
    href: '/(tabs)/dashboard',
    roles: ['consulente', 'c', 'backoffice', 'b'],
  },
  {
    id: 'admin-home',
    label: 'Dashboard',
    icon: 'home-outline',
    iconActive: 'home',
    href: '/(tabs)/admin-dashboard',
    roles: ['admin', 'a', 'master', 'm'],
  },
  {
    id: 'offers',
    label: 'Offerte',
    icon: 'list-outline',
    iconActive: 'list',
    href: '/(tabs)/offers',
    roles: ['backoffice', 'b'],
  },
  {
    id: 'offerte-catalog',
    label: 'Offerte',
    icon: 'list-outline',
    iconActive: 'list',
    href: '/(tabs)/offerte',
    roles: ['master', 'm'],
  },
  {
    id: 'contracts',
    label: 'Contratti',
    icon: 'document-text-outline',
    iconActive: 'document-text',
    href: '/(tabs)/contracts',
    roles: ['consulente', 'c', 'backoffice', 'b', 'admin', 'a', 'master', 'm'],
  },
  {
    id: 'new-practice',
    label: 'Nuova',
    icon: 'add-circle-outline',
    iconActive: 'add-circle',
    href: '/(tabs)/new-practice',
    roles: ['consulente', 'c'],
  },
];

interface BottomNavProps {
  userRole: string;
  userFullName?: string;
  onUserClick?: () => void;
}

export function BottomNav({
  userRole,
  userFullName = 'Utente',
  onUserClick,
}: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { logout, user, userInfo } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const normalizedRole = normalizeRole(userRole);
  const roleDisplayName = getRoleDisplayName(normalizedRole);

  // Filter nav items based on role
  const filteredNavItems = bottomNavItems.filter(
    (item) =>
      item.roles.includes(userRole) || item.roles.includes(normalizedRole)
  );

  // Limit to 4 items max (plus menu button)
  const displayedItems = filteredNavItems.slice(0, 4);

  const handleNavPress = (href: string) => {
    router.push(href as any);
  };

  const handleLogout = async () => {
    try {
      setIsMenuOpen(false);
      await logout();
      router.replace('/login' as any);
    } catch (error) {
      console.error('Errore durante il logout:', error);
      router.replace('/login' as any);
    }
  };

  const handleUserPress = () => {
    setIsMenuOpen(false);
    if (onUserClick) {
      onUserClick();
    } else {
      router.push('/(tabs)/profile' as any);
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, spacing[2]) },
        ]}
      >
        <View style={styles.navItems}>
          {displayedItems.map((item) => {
            const active = isActive(item.href);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => handleNavPress(item.href)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={active ? item.iconActive : item.icon}
                  size={20}
                  color={active ? SEMPLISWITCH_COLORS.magenta : SEMPLISWITCH_COLORS.dark}
                />
                <Text
                  style={[
                    styles.navLabel,
                    active && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Menu Button */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setIsMenuOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="menu-outline"
              size={20}
              color={SEMPLISWITCH_COLORS.dark}
            />
            <Text style={styles.navLabel}>Menu</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Drawer Menu */}
      <DrawerMenu
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userRole={normalizedRole}
        userFullName={userFullName}
        userEmail={user?.email || userInfo?.email}
        agencyName={userInfo?.nomeAgenzia}
        onNavigate={(route) => {
          setIsMenuOpen(false);
          router.push(route as any);
        }}
        onLogout={handleLogout}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SEMPLISWITCH_COLORS.yellow,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 120, 0, 0.3)',
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
  navItems: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing[2],
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: fontWeights.medium as any,
    color: SEMPLISWITCH_COLORS.dark,
    marginTop: 2,
    textAlign: 'center',
  },
  navLabelActive: {
    color: SEMPLISWITCH_COLORS.magenta,
  },
});

export default BottomNav;
