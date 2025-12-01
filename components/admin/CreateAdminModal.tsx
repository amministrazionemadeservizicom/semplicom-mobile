/**
 * CreateAdminModal - Modal per creare Admin + Agenzia
 * Flow a 2 step: 1) Crea Agenzia, 2) Crea Admin User
 * Solo per SuperAdmin
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

interface CreateAdminModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (nomeCognome: string, ruolo: string) => void;
}

interface AgencyData {
  ragioneSociale: string;
  piva: string;
  ibanAddebito: string;
  indirizzo: string;
  mail: string;
  telefono: string;
  sdi: string;
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
  notePersonale: string;
  twoFactor: boolean;
  iban: string;
}

interface AllowedRoles {
  admin: boolean;
  master: boolean;
  backoffice: boolean;
  consulenti: boolean;
}

export function CreateAdminModal({
  visible,
  onClose,
  onSuccess,
}: CreateAdminModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [createdAgencyId, setCreatedAgencyId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Agency form state (Step 1)
  const [agencyData, setAgencyData] = useState<AgencyData>({
    ragioneSociale: '',
    piva: '',
    ibanAddebito: '',
    indirizzo: '',
    mail: '',
    telefono: '',
    sdi: '',
  });

  // Admin user form state (Step 2)
  const [userData, setUserData] = useState<UserData>({
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
    notePersonale: '',
    twoFactor: false,
    iban: '',
  });

  // Allowed roles state
  const [allowedRoles, setAllowedRoles] = useState<AllowedRoles>({
    admin: false,
    master: false,
    backoffice: false,
    consulenti: false,
  });

  const [maxCreati, setMaxCreati] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setStep(1);
      setCreatedAgencyId(null);
      setAgencyData({
        ragioneSociale: '',
        piva: '',
        ibanAddebito: '',
        indirizzo: '',
        mail: '',
        telefono: '',
        sdi: '',
      });
      setUserData({
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
        notePersonale: '',
        twoFactor: false,
        iban: '',
      });
      setAllowedRoles({
        admin: false,
        master: false,
        backoffice: false,
        consulenti: false,
      });
      setMaxCreati('');
      setErrors({});
    }
  }, [visible]);

  const handleAgencyChange = (field: keyof AgencyData, value: string) => {
    setAgencyData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleUserChange = (field: keyof UserData, value: string | boolean) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRoleChange = (role: keyof AllowedRoles) => {
    setAllowedRoles((prev) => ({ ...prev, [role]: !prev[role] }));
    if (errors.allowedRoles) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.allowedRoles;
        return newErrors;
      });
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!agencyData.ragioneSociale.trim()) newErrors.ragioneSociale = 'Ragione sociale obbligatoria';
    if (!agencyData.piva.trim()) newErrors.piva = 'Partita IVA obbligatoria';
    if (!agencyData.mail.trim()) newErrors.mail = 'Email obbligatoria';
    if (!agencyData.telefono.trim()) newErrors.telefono = 'Telefono obbligatorio';
    if (!agencyData.indirizzo.trim()) newErrors.indirizzo = 'Indirizzo obbligatorio';
    if (!agencyData.ibanAddebito.trim()) newErrors.ibanAddebito = 'IBAN obbligatorio';
    if (!agencyData.sdi.trim()) newErrors.sdi = 'Codice SDI obbligatorio';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (agencyData.mail && !emailRegex.test(agencyData.mail)) {
      newErrors.mail = 'Email non valida';
    }

    // P.IVA validation
    if (agencyData.piva && !agencyData.piva.match(/^\d{11}$/)) {
      newErrors.piva = 'Partita IVA deve essere di 11 cifre';
    }

    // SDI validation
    if (agencyData.sdi && !agencyData.sdi.match(/^[A-Z0-9]{7}$/)) {
      newErrors.sdi = 'Codice SDI deve essere di 7 caratteri';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userData.username.trim()) newErrors.username = 'Username obbligatorio';
    if (!userData.password.trim()) newErrors.password = 'Password obbligatoria';
    if (!userData.nomeCognome.trim()) newErrors.nomeCognome = 'Nome e cognome obbligatorio';
    if (!userData.email.trim()) newErrors.email = 'Email obbligatoria';
    if (!userData.citta.trim()) newErrors.citta = 'Città obbligatoria';
    if (!userData.cap.trim()) newErrors.cap = 'CAP obbligatorio';
    if (!userData.provincia.trim()) newErrors.provincia = 'Provincia obbligatoria';

    // At least one role must be selected
    if (!allowedRoles.admin && !allowedRoles.master && !allowedRoles.backoffice && !allowedRoles.consulenti) {
      newErrors.allowedRoles = 'Seleziona almeno un ruolo';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userData.email && !emailRegex.test(userData.email)) {
      newErrors.email = 'Email non valida';
    }

    // CAP validation
    if (userData.cap && !userData.cap.match(/^\d{5}$/)) {
      newErrors.cap = 'CAP deve essere di 5 cifre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAgenzia = async () => {
    if (!validateStep1()) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Call AgenzieAPI.create(agencyData)
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate created agency ID
      const mockAgencyId = Math.floor(Math.random() * 1000) + 1;
      setCreatedAgencyId(mockAgencyId);

      // Move to step 2
      setStep(2);
      setErrors({});
    } catch (error: any) {
      console.error('Error creating agency:', error);
      setErrors({ general: error?.message || 'Errore durante la creazione agenzia' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!validateStep2()) {
      return;
    }

    if (!createdAgencyId) {
      setErrors({ general: 'ID Agenzia mancante. Torna al passo 1.' });
      return;
    }

    setLoading(true);

    try {
      // Build allowed roles array
      const allowedCreateRoles: string[] = [];
      if (allowedRoles.admin) allowedCreateRoles.push('a');
      if (allowedRoles.master) allowedCreateRoles.push('m');
      if (allowedRoles.backoffice) allowedCreateRoles.push('b');
      if (allowedRoles.consulenti) allowedCreateRoles.push('c');

      // TODO: Call UsersAPI.create({...userData, ruolo: 'a', idAgenzia: createdAgencyId, allowedCreateRoles})
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success
      onClose();
      onSuccess?.(userData.nomeCognome, 'a');
    } catch (error: any) {
      console.error('Error creating user:', error);
      setErrors({ general: error?.message || 'Errore durante la creazione utente' });
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

  const renderCheckbox = (
    label: string,
    description: string,
    checked: boolean,
    onChange: () => void
  ) => (
    <TouchableOpacity style={styles.checkboxRow} onPress={onChange} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color={colors.white} />}
      </View>
      <View style={styles.checkboxContent}>
        <Text style={styles.checkboxLabel}>{label}</Text>
        <Text style={styles.checkboxDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
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
            <Text style={styles.headerTitleText}>
              {step === 1 ? 'Nuova Agenzia - Passo 1/2' : 'Nuova Agenzia - Passo 2/2'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {step === 1 ? 'Inserisci i dati dell\'agenzia' : 'Crea l\'utente Admin'}
            </Text>
          </View>
          <View style={styles.closeButton} />
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, styles.progressStepActive]} />
          <View style={[styles.progressStep, step === 2 && styles.progressStepActive]} />
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
          {step === 1 ? (
            // STEP 1: Agency Form
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dati Agenzia</Text>

                {renderInput('Ragione Sociale', agencyData.ragioneSociale, (v) => handleAgencyChange('ragioneSociale', v), {
                  placeholder: 'Agenzia Sempliswitch S.r.l.',
                  required: true,
                  error: errors.ragioneSociale,
                })}

                {renderInput('Partita IVA', agencyData.piva, (v) => handleAgencyChange('piva', v), {
                  placeholder: '12345678901',
                  required: true,
                  error: errors.piva,
                  keyboardType: 'numeric',
                  maxLength: 11,
                })}

                {renderInput('Email', agencyData.mail, (v) => handleAgencyChange('mail', v), {
                  placeholder: 'info@agenzia.com',
                  required: true,
                  error: errors.mail,
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                })}

                {renderInput('Telefono', agencyData.telefono, (v) => handleAgencyChange('telefono', v), {
                  placeholder: '0212345678',
                  required: true,
                  error: errors.telefono,
                  keyboardType: 'phone-pad',
                })}

                {renderInput('Indirizzo', agencyData.indirizzo, (v) => handleAgencyChange('indirizzo', v), {
                  placeholder: 'Via Roma 123, Milano',
                  required: true,
                  error: errors.indirizzo,
                })}

                {renderInput('IBAN Addebito', agencyData.ibanAddebito, (v) => handleAgencyChange('ibanAddebito', v.toUpperCase()), {
                  placeholder: 'IT60X0542811101000000123456',
                  required: true,
                  error: errors.ibanAddebito,
                  autoCapitalize: 'characters',
                })}

                {renderInput('Codice SDI', agencyData.sdi, (v) => handleAgencyChange('sdi', v.toUpperCase()), {
                  placeholder: 'ABCDEFG',
                  required: true,
                  error: errors.sdi,
                  maxLength: 7,
                  autoCapitalize: 'characters',
                })}
              </View>
            </>
          ) : (
            // STEP 2: Admin User Form
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dati di Accesso</Text>

                {renderInput('Username', userData.username, (v) => handleUserChange('username', v), {
                  placeholder: 'mario.rossi',
                  required: true,
                  error: errors.username,
                  autoCapitalize: 'none',
                })}

                {renderInput('Password', userData.password, (v) => handleUserChange('password', v), {
                  placeholder: 'Inserisci password',
                  required: true,
                  error: errors.password,
                  secureTextEntry: true,
                })}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dati Personali</Text>

                {renderInput('Nome e Cognome', userData.nomeCognome, (v) => handleUserChange('nomeCognome', v), {
                  placeholder: 'Mario Rossi',
                  required: true,
                  error: errors.nomeCognome,
                })}

                {renderInput('Email', userData.email, (v) => handleUserChange('email', v), {
                  placeholder: 'mario.rossi@email.com',
                  required: true,
                  error: errors.email,
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                })}

                {renderInput('Telefono', userData.telefono, (v) => handleUserChange('telefono', v), {
                  placeholder: '3331234567',
                  keyboardType: 'phone-pad',
                })}

                {renderInput('Codice Fiscale', userData.codiceFiscale, (v) => handleUserChange('codiceFiscale', v.toUpperCase()), {
                  placeholder: 'RSSMRA85M01F205X',
                  maxLength: 16,
                  autoCapitalize: 'characters',
                })}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Indirizzo</Text>

                {renderInput('Città', userData.citta, (v) => handleUserChange('citta', v), {
                  placeholder: 'Milano',
                  required: true,
                  error: errors.citta,
                })}

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    {renderInput('CAP', userData.cap, (v) => handleUserChange('cap', v), {
                      placeholder: '20121',
                      required: true,
                      error: errors.cap,
                      keyboardType: 'numeric',
                      maxLength: 5,
                    })}
                  </View>
                  <View style={styles.halfWidth}>
                    {renderInput('Provincia', userData.provincia, (v) => handleUserChange('provincia', v.toUpperCase()), {
                      placeholder: 'MI',
                      required: true,
                      error: errors.provincia,
                      maxLength: 2,
                      autoCapitalize: 'characters',
                    })}
                  </View>
                </View>
              </View>

              <View style={[styles.section, styles.sectionBlue]}>
                <Text style={styles.sectionTitle}>Cosa può creare questo Admin?</Text>

                {renderCheckbox(
                  'Admin',
                  'Può creare altri Admin nella stessa agenzia',
                  allowedRoles.admin,
                  () => handleRoleChange('admin')
                )}

                {renderCheckbox(
                  'Master',
                  'Consulente capo che gestisce altri consulenti',
                  allowedRoles.master,
                  () => handleRoleChange('master')
                )}

                {renderCheckbox(
                  'BackOffice',
                  'Personale che gestisce pratiche e documenti',
                  allowedRoles.backoffice,
                  () => handleRoleChange('backoffice')
                )}

                {renderCheckbox(
                  'Consulenti',
                  'Operatori che gestiscono contratti e clienti',
                  allowedRoles.consulenti,
                  () => handleRoleChange('consulenti')
                )}

                {errors.allowedRoles && (
                  <Text style={styles.errorText}>{errors.allowedRoles}</Text>
                )}

                {renderInput('Limite utenti creabili', maxCreati, setMaxCreati, {
                  placeholder: 'Es. 50 (vuoto = illimitato)',
                  keyboardType: 'numeric',
                })}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Opzioni</Text>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Autenticazione a due fattori (2FA)</Text>
                  <Switch
                    value={userData.twoFactor}
                    onValueChange={(v) => handleUserChange('twoFactor', v)}
                    trackColor={{ false: colors.border, true: SEMPLISWITCH_COLORS.blue }}
                    thumbColor={colors.white}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
          {step === 1 ? (
            <>
              <Button variant="outline" onPress={onClose} style={styles.footerButton}>
                Annulla
              </Button>
              <Button
                variant="default"
                onPress={handleCreateAgenzia}
                disabled={loading}
                style={[styles.footerButton, styles.footerButtonPrimary]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.footerButtonText}>Avanti</Text>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onPress={() => {
                  setStep(1);
                  setErrors({});
                }}
                disabled={loading}
                style={styles.footerButton}
              >
                Indietro
              </Button>
              <Button
                variant="default"
                onPress={handleCreateUser}
                disabled={loading}
                style={[styles.footerButton, styles.footerButtonPrimary]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.footerButtonText}>Crea Admin</Text>
                )}
              </Button>
            </>
          )}
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
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressStepActive: {
    backgroundColor: SEMPLISWITCH_COLORS.blue,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.statoAnnullato,
    marginHorizontal: spacing[4],
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
  sectionBlue: {
    backgroundColor: '#EFF6FF', // blue-50
    borderWidth: 1,
    borderColor: '#BFDBFE', // blue-200
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: SEMPLISWITCH_COLORS.blue,
    borderColor: SEMPLISWITCH_COLORS.blue,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  checkboxDescription: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 2,
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

export default CreateAdminModal;
