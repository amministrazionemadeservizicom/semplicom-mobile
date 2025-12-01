/**
 * CreateUserModal - Modal per creare un utente
 * Per Admin/SuperAdmin
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#1d4ed8',
};

const RUOLI_OPTIONS = [
  { value: 's', label: 'SuperAdmin' },
  { value: 'a', label: 'Admin' },
  { value: 'm', label: 'Master' },
  { value: 'b', label: 'BackOffice' },
  { value: 'c', label: 'Consulente' },
];

interface CreateUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Ruoli che questo utente può creare (filtrati in base ai permessi) */
  allowedRoles?: string[];
  /** ID agenzia predefinito */
  defaultAgencyId?: number;
}

interface UserData {
  username: string;
  password: string;
  nomeCognome: string;
  email: string;
  telefono: string;
  codiceFiscale: string;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  ruolo: string;
  idAgenzia: string;
  notePersonale: string;
  twoFactor: boolean;
  iban: string;
}

export function CreateUserModal({
  visible,
  onClose,
  onSuccess,
  allowedRoles,
  defaultAgencyId,
}: CreateUserModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<UserData>({
    username: '',
    password: '',
    nomeCognome: '',
    email: '',
    telefono: '',
    codiceFiscale: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    ruolo: 'c', // Default: Consulente
    idAgenzia: defaultAgencyId?.toString() || '1',
    notePersonale: '',
    twoFactor: false,
    iban: '',
  });

  // Filter available roles
  const availableRoles = allowedRoles
    ? RUOLI_OPTIONS.filter((r) => allowedRoles.includes(r.value))
    : RUOLI_OPTIONS;

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setFormData({
        username: '',
        password: '',
        nomeCognome: '',
        email: '',
        telefono: '',
        codiceFiscale: '',
        indirizzo: '',
        citta: '',
        cap: '',
        provincia: '',
        ruolo: availableRoles[0]?.value || 'c',
        idAgenzia: defaultAgencyId?.toString() || '1',
        notePersonale: '',
        twoFactor: false,
        iban: '',
      });
      setErrors({});
    }
  }, [visible, defaultAgencyId]);

  const handleChange = (field: keyof UserData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.username.trim()) newErrors.username = 'Username obbligatorio';
    if (!formData.password.trim()) newErrors.password = 'Password obbligatoria';
    if (formData.password.length < 6 && formData.password.length > 0) {
      newErrors.password = 'Password minimo 6 caratteri';
    }
    if (!formData.nomeCognome.trim()) newErrors.nomeCognome = 'Nome e cognome obbligatorio';
    if (!formData.email.trim()) newErrors.email = 'Email obbligatoria';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }

    // IBAN validation
    if (formData.iban && !formData.iban.match(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/)) {
      newErrors.iban = 'Formato IBAN non valido';
    }

    // CAP validation
    if (formData.cap && !formData.cap.match(/^\d{5}$/)) {
      newErrors.cap = 'CAP deve essere di 5 cifre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare payload
      const payload = {
        username: formData.username.trim(),
        password: formData.password,
        nomeCognome: formData.nomeCognome.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim() || undefined,
        codiceFiscale: formData.codiceFiscale.trim() || undefined,
        indirizzo: formData.indirizzo.trim() || undefined,
        citta: formData.citta.trim() || undefined,
        cap: formData.cap.trim() || undefined,
        provincia: formData.provincia.trim() || undefined,
        ruolo: formData.ruolo,
        idAgenzia: parseInt(formData.idAgenzia) || 1,
        notePersonale: formData.notePersonale.trim() || undefined,
        twoFactor: formData.twoFactor,
        iban: formData.iban.trim() || undefined,
      };

      // TODO: Call UsersAPI.create(payload)
      // For now, simulate API call
      console.log('Creating user:', payload);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMsg = error?.message || 'Errore sconosciuto';

      if (errorMsg.includes('409') || errorMsg.toLowerCase().includes('esiste')) {
        setErrors({ general: 'Username o email già esistente' });
      } else if (errorMsg.includes('403')) {
        setErrors({ general: 'Permessi insufficienti' });
      } else {
        setErrors({ general: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options?: {
      placeholder?: string;
      error?: string;
      required?: boolean;
      keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
      secureTextEntry?: boolean;
      maxLength?: number;
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {options?.required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, options?.error && styles.inputError]}
        value={value}
        onChangeText={onChange}
        placeholder={options?.placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={options?.keyboardType || 'default'}
        secureTextEntry={options?.secureTextEntry}
        maxLength={options?.maxLength}
        autoCapitalize={options?.autoCapitalize || 'sentences'}
      />
      {options?.error && <Text style={styles.errorText}>{options.error}</Text>}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Nuovo Utente</Text>
          </View>
          <View style={styles.closeButton} />
        </View>

        {/* Error banner */}
        {errors.general && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={colors.destructive} />
            <Text style={styles.errorBannerText}>{errors.general}</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Dati di accesso */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dati di Accesso</Text>

            {renderInput('Username', formData.username, (v) => handleChange('username', v), {
              placeholder: 'mario.rossi',
              required: true,
              error: errors.username,
              autoCapitalize: 'none',
            })}

            {renderInput('Password', formData.password, (v) => handleChange('password', v), {
              placeholder: 'Minimo 6 caratteri',
              required: true,
              error: errors.password,
              secureTextEntry: true,
            })}
          </View>

          {/* Dati personali */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dati Personali</Text>

            {renderInput('Nome e Cognome', formData.nomeCognome, (v) => handleChange('nomeCognome', v), {
              placeholder: 'Mario Rossi',
              required: true,
              error: errors.nomeCognome,
            })}

            {renderInput('Email', formData.email, (v) => handleChange('email', v), {
              placeholder: 'mario.rossi@email.com',
              required: true,
              error: errors.email,
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}

            {renderInput('Telefono', formData.telefono, (v) => handleChange('telefono', v), {
              placeholder: '3331234567',
              keyboardType: 'phone-pad',
            })}

            {renderInput('Codice Fiscale', formData.codiceFiscale, (v) => handleChange('codiceFiscale', v.toUpperCase()), {
              placeholder: 'RSSMRA85M01F205X',
              maxLength: 16,
              autoCapitalize: 'characters',
            })}

            {renderInput('IBAN', formData.iban, (v) => handleChange('iban', v.toUpperCase()), {
              placeholder: 'IT60X0542811101000000123456',
              error: errors.iban,
              autoCapitalize: 'characters',
            })}
          </View>

          {/* Indirizzo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Indirizzo</Text>

            {renderInput('Indirizzo', formData.indirizzo, (v) => handleChange('indirizzo', v), {
              placeholder: 'Via Roma 123',
            })}

            {renderInput('Città', formData.citta, (v) => handleChange('citta', v), {
              placeholder: 'Milano',
            })}

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderInput('CAP', formData.cap, (v) => handleChange('cap', v), {
                  placeholder: '20121',
                  error: errors.cap,
                  keyboardType: 'numeric',
                  maxLength: 5,
                })}
              </View>
              <View style={styles.halfWidth}>
                {renderInput('Provincia', formData.provincia, (v) => handleChange('provincia', v.toUpperCase()), {
                  placeholder: 'MI',
                  maxLength: 2,
                  autoCapitalize: 'characters',
                })}
              </View>
            </View>
          </View>

          {/* Ruolo e Agenzia */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ruolo e Agenzia</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Ruolo <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.roleButtonsContainer}>
                {availableRoles.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleButton,
                      formData.ruolo === role.value && styles.roleButtonSelected,
                    ]}
                    onPress={() => handleChange('ruolo', role.value)}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        formData.ruolo === role.value && styles.roleButtonTextSelected,
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderInput('ID Agenzia', formData.idAgenzia, (v) => handleChange('idAgenzia', v), {
              placeholder: '1',
              keyboardType: 'numeric',
            })}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Autenticazione a due fattori (2FA)</Text>
              <Switch
                value={formData.twoFactor}
                onValueChange={(v) => handleChange('twoFactor', v)}
                trackColor={{ false: colors.border, true: SEMPLISWITCH_COLORS.blue }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notePersonale}
              onChangeText={(v) => handleChange('notePersonale', v)}
              placeholder="Note aggiuntive..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
          <Button variant="outline" onPress={onClose} style={styles.footerButton}>
            Annulla
          </Button>
          <Button
            variant="default"
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.footerButton, styles.footerButtonPrimary]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.footerButtonText}>Crea Utente</Text>
            )}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitleText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.statoAnnullato,
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  errorBannerText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.destructive,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  section: {
    backgroundColor: colors.muted,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[4],
  },
  sectionTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  inputGroup: {
    gap: spacing[1],
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  required: {
    color: colors.destructive,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  textArea: {
    minHeight: 80,
  },
  errorText: {
    fontSize: fontSizes.xs,
    color: colors.destructive,
  },
  row: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  halfWidth: {
    flex: 1,
  },
  roleButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  roleButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  roleButtonSelected: {
    borderColor: SEMPLISWITCH_COLORS.blue,
    backgroundColor: '#EFF6FF', // blue-50
  },
  roleButtonText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  roleButtonTextSelected: {
    color: SEMPLISWITCH_COLORS.blue,
    fontWeight: fontWeights.medium as any,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: {
    flex: 1,
  },
  footerButtonPrimary: {
    backgroundColor: SEMPLISWITCH_COLORS.blue,
  },
  footerButtonText: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
  },
});

export default CreateUserModal;
