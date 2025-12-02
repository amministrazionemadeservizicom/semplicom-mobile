/**
 * Drive - Gestione documenti e file (React Native)
 * Visualizza offerte e materiali caricati
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  blue: '#3B82F6',
  red: '#EF4444',
};

// Tipi
interface FileItem {
  name: string;
  type: string;
  size: number;
  modifyTime?: number;
  path?: string;
}

// Mock data
const MOCK_OFFERTE: FileItem[] = [
  { name: 'Offerta_Luce_Famiglia_2024.pdf', type: 'pdf', size: 1024000 },
  { name: 'Offerta_Gas_Business_Q1.pdf', type: 'pdf', size: 2048000 },
  { name: 'Promo_Dual_Primavera.png', type: 'image', size: 512000 },
];

const MOCK_MATERIALI: FileItem[] = [
  { name: 'Guida_Venditori_2024.pdf', type: 'pdf', size: 3072000 },
  { name: 'Template_Contratto.docx', type: 'doc', size: 256000 },
  { name: 'Logo_Sempliswitch.png', type: 'image', size: 128000 },
];

// Helper per formattare dimensione file
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper per icona tipo file
function getFileIcon(name: string): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return { icon: 'image', color: SEMPLISWITCH_COLORS.blue };
  }
  if (ext === 'pdf') {
    return { icon: 'document-text', color: SEMPLISWITCH_COLORS.red };
  }
  if (['doc', 'docx'].includes(ext)) {
    return { icon: 'document', color: SEMPLISWITCH_COLORS.blue };
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return { icon: 'grid', color: '#22C55E' };
  }
  return { icon: 'document-outline', color: colors.mutedForeground };
}

// Helper per verificare se supporta anteprima
function canPreview(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'].includes(ext);
}

// Componente per file item
function FileItemRow({
  file,
  canWrite,
  onPreview,
  onDelete,
}: {
  file: FileItem;
  canWrite: boolean;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const fileInfo = getFileIcon(file.name);

  return (
    <View style={styles.fileRow}>
      <View style={[styles.fileIcon, { backgroundColor: `${fileInfo.color}15` }]}>
        <Ionicons name={fileInfo.icon} size={20} color={fileInfo.color} />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
        <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
      </View>
      <View style={styles.fileActions}>
        {canPreview(file.name) && (
          <TouchableOpacity style={styles.fileActionButton} onPress={onPreview}>
            <Ionicons name="eye-outline" size={20} color={SEMPLISWITCH_COLORS.blue} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.fileActionButton}
          onPress={() => Alert.alert('Download', `Download di ${file.name} avviato`)}
        >
          <Ionicons name="download-outline" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
        {canWrite && (
          <TouchableOpacity style={styles.fileActionButton} onPress={onDelete}>
            <Ionicons name="trash-outline" size={20} color={SEMPLISWITCH_COLORS.red} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Componente per sezione file
function FileSection({
  title,
  files,
  canWrite,
  onUpload,
  onPreview,
  onDelete,
}: {
  title: string;
  files: FileItem[];
  canWrite: boolean;
  onUpload: () => void;
  onPreview: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}) {
  return (
    <Card style={styles.sectionCard}>
      <CardHeader style={styles.sectionHeader}>
        <CardTitle style={styles.sectionTitle}>
          <Ionicons name="folder-open" size={20} color={SEMPLISWITCH_COLORS.yellow} />
          <Text style={styles.sectionTitleText}>{title}</Text>
        </CardTitle>
        {canWrite && (
          <TouchableOpacity style={styles.uploadButton} onPress={onUpload}>
            <Ionicons name="cloud-upload" size={18} color={SEMPLISWITCH_COLORS.magenta} />
            <Text style={styles.uploadButtonText}>Carica</Text>
          </TouchableOpacity>
        )}
      </CardHeader>
      <CardContent style={styles.sectionContent}>
        {files.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="folder-open-outline" size={32} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>Nessun file</Text>
          </View>
        ) : (
          files.map((file, index) => (
            <FileItemRow
              key={`${file.name}-${index}`}
              file={file}
              canWrite={canWrite}
              onPreview={() => onPreview(file)}
              onDelete={() => onDelete(file)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function Drive() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole, isSuperAdmin, isAdmin } = useAuth();

  const canWrite = isAdmin || userRole === ROLES.BACK_OFFICE;

  const [offerte, setOfferte] = useState<FileItem[]>([]);
  const [materiali, setMateriali] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Preview modal
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Redirect SuperAdmin
  useEffect(() => {
    if (isSuperAdmin) {
      router.replace('/(tabs)/sa-dashboard' as any);
    }
  }, [isSuperAdmin, router]);

  // Load files
  const loadFiles = useCallback(async () => {
    try {
      // In produzione: chiamata API
      // const offerteRes = await authed.get('/protected/listFiles?path=/drive/offerte');
      // const materialiRes = await authed.get('/protected/listFiles?path=/drive/materiali');
      // setOfferte(offerteRes.files || []);
      // setMateriali(materialiRes.files || []);

      // Mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setOfferte(MOCK_OFFERTE);
      setMateriali(MOCK_MATERIALI);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFiles();
  };

  // Upload file
  const handleUpload = async (path: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        Alert.alert('Caricamento', `File "${file.name}" caricato con successo!`);
        // In produzione: upload a backend
        loadFiles();
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Errore', 'Impossibile selezionare il file');
    }
  };

  // Preview file
  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  // Delete file
  const handleDelete = (file: FileItem) => {
    Alert.alert(
      'Elimina file',
      `Sei sicuro di voler eliminare "${file.name}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            // In produzione: chiamata API per eliminare
            Alert.alert('Eliminato', `File "${file.name}" eliminato`);
            loadFiles();
          },
        },
      ]
    );
  };

  if (isSuperAdmin) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drive</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.magenta} />
          <Text style={styles.loadingText}>Caricamento file...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <FileSection
            title="Offerte"
            files={offerte}
            canWrite={canWrite}
            onUpload={() => handleUpload('/drive/offerte')}
            onPreview={handlePreview}
            onDelete={handleDelete}
          />

          <FileSection
            title="Materiali"
            files={materiali}
            canWrite={canWrite}
            onUpload={() => handleUpload('/drive/materiali')}
            onPreview={handlePreview}
            onDelete={handleDelete}
          />
        </ScrollView>
      )}

      {/* Preview Modal */}
      <Modal
        visible={previewVisible}
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={[styles.previewContainer, { paddingTop: insets.top }]}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {previewFile?.name}
            </Text>
            <TouchableOpacity
              style={styles.previewCloseButton}
              onPress={() => setPreviewVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <View style={styles.previewContent}>
            {previewFile && (
              <View style={styles.previewPlaceholder}>
                <Ionicons
                  name={getFileIcon(previewFile.name).icon}
                  size={64}
                  color={getFileIcon(previewFile.name).color}
                />
                <Text style={styles.previewPlaceholderText}>
                  Anteprima non disponibile nell'app.
                </Text>
                <Text style={styles.previewPlaceholderSubtext}>
                  Scarica il file per visualizzarlo.
                </Text>
                <TouchableOpacity
                  style={styles.downloadPreviewButton}
                  onPress={() => {
                    Alert.alert('Download', 'Download avviato');
                    setPreviewVisible(false);
                  }}
                >
                  <Ionicons name="download" size={20} color="#FFFFFF" />
                  <Text style={styles.downloadPreviewButtonText}>Scarica File</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.card,
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: colors.foreground,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  loadingText: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  sectionCard: {
    marginBottom: spacing[2],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sectionTitleText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: `${SEMPLISWITCH_COLORS.magenta}15`,
    borderRadius: borderRadius.md,
  },
  uploadButtonText: {
    fontSize: fontSizes.sm,
    color: SEMPLISWITCH_COLORS.magenta,
    fontWeight: fontWeights.medium as any,
  },
  sectionContent: {
    padding: spacing[4],
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    gap: spacing[2],
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
  },
  fileSize: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  fileActions: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  fileActionButton: {
    padding: spacing[2],
  },
  previewContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  previewTitle: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    marginRight: spacing[4],
  },
  previewCloseButton: {
    padding: spacing[2],
  },
  previewContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlaceholder: {
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[6],
  },
  previewPlaceholderText: {
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  previewPlaceholderSubtext: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  downloadPreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: SEMPLISWITCH_COLORS.magenta,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    marginTop: spacing[4],
  },
  downloadPreviewButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: '#FFFFFF',
  },
});
