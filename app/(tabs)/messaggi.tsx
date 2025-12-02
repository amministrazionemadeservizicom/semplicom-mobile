/**
 * Messaggi - Pagina messaggi chat sui contratti (React Native)
 * Mostra due sezioni: "Da leggere" e "Letti" stile Facebook
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, ROLES } from '../../lib/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';
import { fontSizes, fontWeights } from '../../styles/typography';

// Colori Sempliswitch
const SEMPLISWITCH_COLORS = {
  yellow: '#F2C927',
  magenta: '#E6007E',
  purple: '#7C3AED',
  green: '#22C55E',
  red: '#EF4444',
};

// Tipi
interface UltimoMessaggio {
  nome: string;
  messaggio: string;
  timestamp: string;
}

interface ChatNotification {
  contrattoId: number;
  clienteNome: string;
  messaggiNonLetti: number;
  ultimoMessaggio?: UltimoMessaggio;
}

// Mock data
const MOCK_UNREAD: ChatNotification[] = [
  {
    contrattoId: 1,
    clienteNome: 'Mario Rossi - Luce',
    messaggiNonLetti: 3,
    ultimoMessaggio: {
      nome: 'Back Office',
      messaggio: 'Abbiamo bisogno del documento di identità aggiornato per procedere con la pratica.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
  },
  {
    contrattoId: 2,
    clienteNome: 'Giuseppe Verdi - Gas',
    messaggiNonLetti: 1,
    ultimoMessaggio: {
      nome: 'Back Office',
      messaggio: 'Contratto approvato, procediamo con l\'attivazione.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  },
];

const MOCK_READ: ChatNotification[] = [
  {
    contrattoId: 3,
    clienteNome: 'Anna Bianchi - Dual',
    messaggiNonLetti: 0,
    ultimoMessaggio: {
      nome: 'Agente',
      messaggio: 'Grazie per la conferma!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  },
];

// Helper per formattare timestamp
function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;

    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// Componente Card Messaggio
function MessageCard({
  notification,
  isRead,
  onOpenChat,
  onMarkRead,
}: {
  notification: ChatNotification;
  isRead: boolean;
  onOpenChat: () => void;
  onMarkRead: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.messageCard, !isRead && styles.messageCardUnread]}
      onPress={onOpenChat}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={[styles.avatar, isRead ? styles.avatarRead : styles.avatarUnread]}>
        <Ionicons
          name="chatbubbles"
          size={24}
          color={isRead ? colors.mutedForeground : SEMPLISWITCH_COLORS.purple}
        />
      </View>

      {/* Content */}
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[styles.senderName, isRead && styles.senderNameRead]} numberOfLines={1}>
            {notification.ultimoMessaggio?.nome || 'Back Office'}
          </Text>
          <Text style={styles.timestamp}>
            {notification.ultimoMessaggio && formatTimestamp(notification.ultimoMessaggio.timestamp)}
          </Text>
        </View>

        <Text style={styles.contractName} numberOfLines={1}>
          Contratto: {notification.clienteNome}
        </Text>

        {notification.ultimoMessaggio && (
          <Text style={[styles.messageText, isRead && styles.messageTextRead]} numberOfLines={2}>
            "{notification.ultimoMessaggio.messaggio}"
          </Text>
        )}

        {!isRead && notification.messaggiNonLetti > 1 && (
          <Text style={styles.unreadCount}>
            +{notification.messaggiNonLetti - 1} altri messaggi non letti
          </Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onOpenChat}>
            <Ionicons name="open-outline" size={14} color={SEMPLISWITCH_COLORS.purple} />
            <Text style={styles.actionButtonText}>Apri chat</Text>
          </TouchableOpacity>
          {!isRead && (
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={onMarkRead}>
              <Ionicons name="checkmark" size={14} color={colors.mutedForeground} />
              <Text style={styles.actionButtonTextSecondary}>Segna letto</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Unread indicator */}
      {!isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function Messaggi() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userRole, isSuperAdmin, isAdmin } = useAuth();
  const isBackOffice = userRole === ROLES.BACK_OFFICE || isAdmin;

  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [readNotifications, setReadNotifications] = useState<ChatNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect SuperAdmin
  useEffect(() => {
    if (isSuperAdmin) {
      router.replace('/(tabs)/sa-dashboard' as any);
    }
  }, [isSuperAdmin, router]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      // In produzione: chiamata API
      // const response = await authed.get('/protected/chat-notifications');
      // setNotifications(response.unread || []);
      // setReadNotifications(response.read || []);

      // Mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setNotifications(MOCK_UNREAD);
      setReadNotifications(MOCK_READ);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  // Handle open chat
  const handleOpenChat = (contrattoId: number) => {
    // Mark as read then navigate
    handleMarkRead(contrattoId);
    router.push(`/(tabs)/contract-detail?id=${contrattoId}` as any);
  };

  // Mark as read
  const handleMarkRead = (contrattoId: number) => {
    const notification = notifications.find(n => n.contrattoId === contrattoId);
    if (notification) {
      setNotifications(prev => prev.filter(n => n.contrattoId !== contrattoId));
      setReadNotifications(prev => [{ ...notification, messaggiNonLetti: 0 }, ...prev]);
    }
  };

  // Mark all as read
  const handleMarkAllRead = () => {
    const allRead = notifications.map(n => ({ ...n, messaggiNonLetti: 0 }));
    setReadNotifications(prev => [...allRead, ...prev]);
    setNotifications([]);
  };

  const currentNotifications = activeTab === 'unread' ? notifications : readNotifications;
  const totalUnread = notifications.length;

  if (isSuperAdmin) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="chatbubbles" size={24} color={SEMPLISWITCH_COLORS.purple} />
            <Text style={styles.headerTitle}>Messaggi</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadNotifications}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={colors.mutedForeground}
                style={loading ? styles.rotating : undefined}
              />
            </TouchableOpacity>
            {totalUnread > 0 && (
              <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
                <Ionicons name="checkmark-done" size={16} color={SEMPLISWITCH_COLORS.purple} />
                <Text style={styles.markAllText}>Segna tutti letti</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
            onPress={() => setActiveTab('unread')}
          >
            <Text style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
              Da leggere
            </Text>
            {totalUnread > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{totalUnread}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'read' && styles.tabActive]}
            onPress={() => setActiveTab('read')}
          >
            <Text style={[styles.tabText, activeTab === 'read' && styles.tabTextActive]}>
              Letti
            </Text>
            {readNotifications.length > 0 && (
              <View style={styles.tabBadgeGray}>
                <Text style={styles.tabBadgeTextGray}>{readNotifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMPLISWITCH_COLORS.purple} />
          <Text style={styles.loadingText}>Caricamento messaggi...</Text>
        </View>
      ) : (
        <FlatList
          data={currentNotifications}
          keyExtractor={(item) => item.contrattoId.toString()}
          renderItem={({ item }) => (
            <MessageCard
              notification={item}
              isRead={activeTab === 'read'}
              onOpenChat={() => handleOpenChat(item.contrattoId)}
              onMarkRead={() => handleMarkRead(item.contrattoId)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>
                {activeTab === 'unread' ? 'Nessun messaggio da leggere' : 'Nessun messaggio letto'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'unread'
                  ? 'Sei in pari con tutti i messaggi!'
                  : 'I messaggi letti appariranno qui'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold as any,
    color: colors.foreground,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  refreshButton: {
    padding: spacing[2],
  },
  rotating: {
    // Note: React Native doesn't have CSS animations, would need Animated
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  markAllText: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.purple,
    fontWeight: fontWeights.medium as any,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: spacing[2],
  },
  tabActive: {
    borderBottomColor: SEMPLISWITCH_COLORS.purple,
  },
  tabText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
  },
  tabTextActive: {
    color: SEMPLISWITCH_COLORS.purple,
  },
  tabBadge: {
    backgroundColor: SEMPLISWITCH_COLORS.red,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.bold as any,
    color: '#FFFFFF',
  },
  tabBadgeGray: {
    backgroundColor: colors.muted,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  tabBadgeTextGray: {
    fontSize: 10,
    fontWeight: fontWeights.bold as any,
    color: colors.mutedForeground,
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
  listContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageCardUnread: {
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  avatarUnread: {
    backgroundColor: `${SEMPLISWITCH_COLORS.purple}20`,
  },
  avatarRead: {
    backgroundColor: colors.muted,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  senderName: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.foreground,
    flex: 1,
  },
  senderNameRead: {
    color: colors.mutedForeground,
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  contractName: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  messageText: {
    fontSize: fontSizes.sm,
    color: colors.foreground,
    lineHeight: 20,
    marginBottom: spacing[2],
  },
  messageTextRead: {
    color: colors.mutedForeground,
  },
  unreadCount: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.purple,
    fontWeight: fontWeights.medium as any,
    marginBottom: spacing[2],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: `${SEMPLISWITCH_COLORS.purple}15`,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    fontSize: fontSizes.xs,
    color: SEMPLISWITCH_COLORS.purple,
    fontWeight: fontWeights.medium as any,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  actionButtonTextSecondary: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SEMPLISWITCH_COLORS.purple,
    marginLeft: spacing[2],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium as any,
    color: colors.mutedForeground,
    marginTop: spacing[4],
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
});
