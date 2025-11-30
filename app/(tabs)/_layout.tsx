/**
 * Tabs Layout - Navigazione principale con bottom tabs
 * Collegata a sempliswitch
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { colors } from '../../styles/colors';
import { componentSizes, spacing } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Simple icon component using text symbols
function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const icons: Record<string, string> = {
    dashboard: '📊',
    offerte: '📋',
    contratti: '📄',
    nuova: '➕',
    profilo: '👤',
    backoffice: '🔧',
    admin: '⚙️',
    sa: '🛡️',
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Text style={[styles.icon, { opacity: focused ? 1 : 0.7 }]}>
        {icons[name] || '📌'}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { userRole, isSuperAdmin, isAdmin } = useAuth();

  // Determina quali tab mostrare in base al ruolo
  const showSADashboard = isSuperAdmin;
  const showAdminDashboard = isAdmin && !isSuperAdmin;
  const showBackoffice = userRole === ROLES.BACK_OFFICE;
  const showRegularDashboard = userRole === ROLES.MASTER || userRole === ROLES.CONSULENTE;
  const canCompileContract = !showBackoffice;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: componentSizes.navBottomHeight,
          paddingBottom: spacing[2],
          paddingTop: spacing[2],
        },
        tabBarLabelStyle: {
          fontSize: fontSizes.xs,
          fontWeight: fontWeights.medium as any,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontSize: fontSizes.lg,
          fontWeight: fontWeights.semibold as any,
          color: colors.foreground,
        },
        headerTintColor: colors.foreground,
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
          title: 'SA Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="sa" color={color} focused={focused} />
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="admin" color={color} focused={focused} />
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="backoffice" color={color} focused={focused} />
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="dashboard" color={color} focused={focused} />
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="offerte" color={color} focused={focused} />
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="contratti" color={color} focused={focused} />
          ),
          href: '/(tabs)/contratti',
        }}
      />

      {/* Nuova Pratica */}
      <Tabs.Screen
        name="nuova-pratica"
        options={{
          title: 'Nuova Pratica',
          tabBarLabel: 'Nuova',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="nuova" color={color} focused={focused} />
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="profilo" color={color} focused={focused} />
          ),
          href: '/(tabs)/profilo',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerFocused: {
    transform: [{ scale: 1.1 }],
  },
  icon: {
    fontSize: 20,
  },
});
