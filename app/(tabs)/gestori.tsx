/**
 * Gestori - Gestione Gestori per SuperAdmin
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

export default function Gestori() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestori</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Ionicons name="briefcase-outline" size={64} color={colors.mutedForeground} />
        <Text style={styles.title}>Gestione Gestori</Text>
        <Text style={styles.subtitle}>Funzionalità in arrivo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#F2C927',
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
    marginTop: spacing[4],
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
    marginTop: spacing[2],
  },
});
