/**
 * Login Screen
 * Adattato da sempliswitch/client/pages/LoginForm.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../lib/AuthContext';
import { Input } from '../../components/ui/Input';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori sempliswitch
const COLORS = {
  yellow: '#F2C927',
  magenta: '#D1009C',
  magentaDark: '#b0007d',
  white: '#FFFFFF',
  gray: {
    200: '#E5E7EB',
    400: '#9CA3AF',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  green: '#16A34A',
  red: '#DC2626',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Load saved email on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('login_email');
        const savedRemember = await AsyncStorage.getItem('login_remember');
        if (savedEmail) setEmail(savedEmail);
        if (savedRemember === 'true') setRememberMe(true);
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    };
    loadSavedCredentials();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      console.log('🔄 LoginScreen: User already logged in, redirecting...');
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading spinner
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.magenta} />
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }

  // Show blank while redirecting
  if (!isLoading && isAuthenticated && user) {
    return null;
  }

  const handleSubmit = async () => {
    if (!email || !password) {
      setMessage('❌ Inserisci email e password.');
      return;
    }

    setMessage('Verifica in corso...');
    setIsSubmitting(true);

    try {
      await login({
        username: email,
        password: password,
        rememberMe: rememberMe,
      });

      // Save remember-me preference
      if (rememberMe) {
        await AsyncStorage.setItem('login_email', email);
        await AsyncStorage.setItem('login_remember', 'true');
      } else {
        await AsyncStorage.removeItem('login_email');
        await AsyncStorage.setItem('login_remember', 'false');
      }

      setMessage('✅ Accesso effettuato');

      // Navigate to tabs
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMsg = error?.message || 'Errore di connessione';
      if (errorMsg.includes('INVALID_CREDENTIALS') || errorMsg.includes('password') || errorMsg.includes('Credenziali')) {
        setMessage('❌ Email o password errati.');
      } else if (errorMsg.includes('MISSING_CREDENTIALS')) {
        setMessage('❌ Inserisci email e password.');
      } else {
        setMessage(`❌ ${errorMsg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPhone = () => {
    Linking.openURL('tel:0832665506');
  };

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/393701314979');
  };

  const loading = isLoading || isSubmitting;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Card principale */}
        <View style={styles.card}>
          {/* Sezione benvenuto */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Benvenuti in</Text>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>SempliCom</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Input
                placeholder="nome@esempio.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setMessage(null);
                }}
                editable={!loading}
                style={styles.input}
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <Input
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setMessage(null);
                }}
                editable={!loading}
                style={styles.input}
              />
            </View>

            {/* Ricordami */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Ricordami</Text>
            </TouchableOpacity>

            {/* Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginButtonText}>Accedi</Text>
              )}
            </TouchableOpacity>

            {/* Messaggio */}
            {message && (
              <Text
                style={[
                  styles.message,
                  message.includes('✅') ? styles.messageSuccess : styles.messageError,
                ]}
              >
                {message}
              </Text>
            )}
          </View>

          {/* Help section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Hai problemi ad accedere?</Text>
            <Text style={styles.helpText}>
              Chiamaci allo{' '}
              <Text style={styles.helpLink} onPress={openPhone}>
                0832 665506
              </Text>
              {' '}o scrivici su{' '}
              <Text style={styles.helpLink} onPress={openWhatsApp}>
                WhatsApp
              </Text>
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerCopyright}>© SempliCom</Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
            <Text style={styles.footerSeparator}>•</Text>
            <Text style={styles.footerLink}>Termini e Condizioni</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellow,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: COLORS.magenta,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[4],
    paddingVertical: spacing[8],
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: spacing[6],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  welcomeText: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold as any,
    color: COLORS.gray[900],
    marginBottom: spacing[6],
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  logoText: {
    fontSize: 48,
    fontWeight: fontWeights.extrabold as any,
    color: COLORS.magenta,
    letterSpacing: -1,
  },
  form: {
    gap: spacing[4],
  },
  inputGroup: {
    marginBottom: spacing[1],
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold as any,
    color: COLORS.gray[700],
    marginBottom: spacing[2],
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    padding: spacing[4],
    fontSize: fontSizes.base,
    color: COLORS.gray[900],
    backgroundColor: COLORS.white,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  checkboxChecked: {
    backgroundColor: COLORS.magenta,
    borderColor: COLORS.magenta,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: fontWeights.bold as any,
  },
  rememberText: {
    fontSize: fontSizes.sm,
    color: COLORS.gray[700],
  },
  loginButton: {
    backgroundColor: COLORS.magenta,
    paddingVertical: spacing[4],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
    ...Platform.select({
      ios: {
        shadowColor: COLORS.magenta,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold as any,
  },
  message: {
    textAlign: 'center',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    marginTop: spacing[2],
  },
  messageSuccess: {
    color: COLORS.green,
  },
  messageError: {
    color: COLORS.red,
  },
  helpSection: {
    marginTop: spacing[6],
    paddingTop: spacing[6],
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  helpTitle: {
    textAlign: 'center',
    fontSize: fontSizes.sm,
    color: COLORS.gray[600],
    marginBottom: spacing[2],
  },
  helpText: {
    textAlign: 'center',
    fontSize: fontSizes.sm,
    color: COLORS.gray[600],
  },
  helpLink: {
    color: COLORS.magenta,
    fontWeight: fontWeights.semibold as any,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: spacing[8],
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: fontSizes.sm,
    color: COLORS.gray[800],
    marginBottom: spacing[2],
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: fontSizes.sm,
    color: COLORS.gray[800],
    fontWeight: fontWeights.medium as any,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    marginHorizontal: spacing[2],
    color: COLORS.gray[800],
  },
});
