/**
 * Tabs Layout - Navigazione principale con bottom tabs
 * Stile Sempliswitch: Giallo #F2C927 e Magenta #E6007E
 */

import React, { useState } from 'react';
import { Text, View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { spacing } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';
import { DrawerMenu } from '../../components/navigation/DrawerMenu';

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

// Tab Icon component con icone Ionicons
function TabIcon({
  name,
  focused
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Ionicons
        name={name}
        size={24}
        color={focused ? SEMPLISWITCH_COLORS.magenta : SEMPLISWITCH_COLORS.gray[500]}
      />
    </View>
  );
}

// Custom header component con menu hamburger e logo
function CustomHeader({ onMenuPress }: { onMenuPress: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={onMenuPress}
        accessibilityLabel="Apri menu"
      >
        <Ionicons name="menu" size={24} color={SEMPLISWITCH_COLORS.gray[900]} />
      </TouchableOpacity>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Sempli</Text>
        <Text style={styles.logoTextAccent}>switch</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export default function TabsLayout() {
  const { userRole, isSuperAdmin, isAdmin } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Determina quali tab mostrare in base al ruolo
  const showSADashboard = isSuperAdmin;
  const showAdminDashboard = isAdmin && !isSuperAdmin;
  const showBackoffice = userRole === ROLES.BACK_OFFICE;
  const showRegularDashboard = userRole === ROLES.MASTER || userRole === ROLES.CONSULENTE;
  const canCompileContract = !showBackoffice;

  return (
    <>
    <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    <Tabs
      screenOptions={{
        // Tab Bar colors - sfondo giallo sempliswitch
        tabBarActiveTintColor: SEMPLISWITCH_COLORS.magenta,
        tabBarInactiveTintColor: SEMPLISWITCH_COLORS.gray[700],
        tabBarStyle: {
          backgroundColor: SEMPLISWITCH_COLORS.yellow,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : spacing[2],
          paddingTop: spacing[2],
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
        tabBarLabelStyle: {
          fontSize: fontSizes.xs,
          fontWeight: fontWeights.semibold as any,
          marginTop: 2,
        },
        // Header colors - sfondo giallo
        headerStyle: {
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
        headerTitleStyle: {
          fontSize: fontSizes.lg,
          fontWeight: fontWeights.bold as any,
          color: SEMPLISWITCH_COLORS.gray[900],
        },
        headerTintColor: SEMPLISWITCH_COLORS.gray[900],
        headerTitleAlign: 'center',
        // Custom header con menu hamburger
        headerLeft: () => (
          <TouchableOpacity
            style={styles.headerMenuButton}
            onPress={() => setDrawerVisible(true)}
            accessibilityLabel="Apri menu"
          >
            <Ionicons name="menu" size={24} color={SEMPLISWITCH_COLORS.gray[900]} />
          </TouchableOpacity>
        ),
      }}
    >
      {/* Index - nascosto, solo per redirect */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      {/* SA Dashboard */}
      <Tabs.Screen
        name="sa-dashboard"
        options={{
          title: 'Dashboard SA',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="shield-checkmark" focused={focused} />
          ),
          href: showSADashboard ? '/(tabs)/sa-dashboard' : null,
        }}
      />

      {/* Admin Dashboard */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" focused={focused} />
          ),
          href: showAdminDashboard ? '/(tabs)/admin-dashboard' : null,
        }}
      />

      {/* Backoffice Dashboard */}
      <Tabs.Screen
        name="backoffice"
        options={{
          title: 'Back Office',
          tabBarLabel: 'Backoffice',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="construct" focused={focused} />
          ),
          href: showBackoffice ? '/(tabs)/backoffice' : null,
        }}
      />

      {/* Regular Dashboard (Master/Consulente) */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="stats-chart" focused={focused} />
          ),
          href: showRegularDashboard ? '/(tabs)/dashboard' : null,
        }}
      />

      {/* Offerte */}
      <Tabs.Screen
        name="offerte"
        options={{
          title: 'Offerte',
          tabBarLabel: 'Offerte',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="pricetags" focused={focused} />
          ),
          href: canCompileContract ? '/(tabs)/offerte' : null,
        }}
      />

      {/* Contratti */}
      <Tabs.Screen
        name="contratti"
        options={{
          title: 'Contratti',
          tabBarLabel: 'Contratti',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="document-text" focused={focused} />
          ),
          href: '/(tabs)/contratti',
        }}
      />

      {/* Nuova Pratica - con stile prominente */}
      <Tabs.Screen
        name="nuova-pratica"
        options={{
          title: 'Nuova Pratica',
          tabBarLabel: 'Nuova',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.nuovaPraticaIcon, focused && styles.nuovaPraticaIconFocused]}>
              <Ionicons
                name="add"
                size={28}
                color={SEMPLISWITCH_COLORS.white}
              />
            </View>
          ),
          href: canCompileContract ? '/(tabs)/nuova-pratica' : null,
        }}
      />

      {/* Profilo */}
      <Tabs.Screen
        name="profilo"
        options={{
          title: 'Profilo',
          tabBarLabel: 'Profilo',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} />
          ),
          href: '/(tabs)/profilo',
        }}
      />

      {/* Schermate nascoste dalla tab bar - accessibili via drawer o navigazione */}

      {/* Caricamento Fast - procedura rapida */}
      <Tabs.Screen
        name="caricamento-fast"
        options={{
          title: 'Caricamento Fast',
          href: null, // Nascosto dalla tab bar
          headerShown: false, // Header custom nella pagina
        }}
      />

      {/* Piani Compenso - solo admin */}
      <Tabs.Screen
        name="piani-compenso"
        options={{
          title: 'Piani Compenso',
          href: null,
          headerShown: false,
        }}
      />

      {/* Compile Contract Multi - wizard contratti multipli */}
      <Tabs.Screen
        name="compile-contract-multi"
        options={{
          title: 'Nuovi Contratti',
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerFocused: {
    transform: [{ scale: 1.05 }],
  },
  // Stile speciale per il pulsante Nuova Pratica
  nuovaPraticaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
    ...Platform.select({
      ios: {
        shadowColor: SEMPLISWITCH_COLORS.magenta,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  nuovaPraticaIconFocused: {
    backgroundColor: SEMPLISWITCH_COLORS.magentaDark,
    transform: [{ scale: 1.05 }],
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    height: 56,
    backgroundColor: SEMPLISWITCH_COLORS.yellow,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing[2],
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerSpacer: {
    width: 40,
  },
});
