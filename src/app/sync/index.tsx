import * as Linking from 'expo-linking';
import { type Href, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { triggerSuccessHaptic } from '@/features/haptics/haptics';
import {
  getCurrentNetworkStatus,
  subscribeToNetworkStatus,
} from '@/features/sync/services/connectivityService';
import { scheduleSyncReminder } from '@/features/sync/services/notificationService';
import {
  injectRemoteChecklistConflict,
  setFailNextRequest,
} from '@/features/sync/services/simulatedServer';
import { processSyncQueue } from '@/features/sync/services/syncProcessor';
import type { NetworkStatus, SyncQueueItem, SyncQueueSummary } from '@/features/tasks/domain/task';
import { useTaskRepository } from '@/features/tasks/hooks/useTaskRepository';
import { getColors, radii, spacing, typography } from '@/theme';

export default function SyncCenterRoute() {
  const db = useSQLiteContext();
  const repository = useTaskRepository();
  const colors = getColors(useColorScheme());

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [summary, setSummary] = useState<SyncQueueSummary>({
    conflictCount: 0,
    failedCount: 0,
    pendingCount: 0,
    syncedCount: 0,
    totalCount: 0,
  });
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);
  const [remindStatus, setRemindStatus] = useState<string | null>(null);

  const deepLinkUrl = Linking.createURL('/sync');

  const reloadData = useCallback(async () => {
    try {
      const currentSum = await repository.getSyncQueueSummary();
      setSummary(currentSum);
      const items = await repository.listSyncQueue();
      setQueueItems(items);
    } catch (err) {
      console.warn('Failed to load sync queue:', err);
    }
  }, [repository]);

  useEffect(() => {
    let active = true;

    getCurrentNetworkStatus().then((status) => {
      if (active) setNetworkStatus(status);
    });

    const unsubscribe = subscribeToNetworkStatus((status) => {
      if (active) setNetworkStatus(status);
    });

    reloadData();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [reloadData]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSimMessage(null);
    try {
      await processSyncQueue(db, { force: true });
      await triggerSuccessHaptic();
      await reloadData();
    } catch (err) {
      setSimMessage(err instanceof Error ? err.message : 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInjectConflict = async () => {
    setSimMessage(null);
    try {
      const items = await repository.listAssignedTasks();
      const firstTask = items[0];
      if (firstTask == null) {
        setSimMessage('No assigned tasks available for simulation.');
        return;
      }
      const detail = await repository.getTaskDetail(firstTask.id);
      if (!detail || detail.checklist.length === 0) {
        setSimMessage('No checklist items available for simulation.');
        return;
      }

      const targetItem = detail.checklist[0];
      if (targetItem == null) {
        setSimMessage('No valid target checklist item found.');
        return;
      }

      const res = await injectRemoteChecklistConflict(db, targetItem.id);
      await triggerSuccessHaptic();
      setSimMessage(
        `Injected simulated server version ${res.newVersion} for item ${targetItem.id} (Checked: ${res.remoteChecked}). Next sync will detect version mismatch conflict!`,
      );
      await reloadData();
    } catch (err) {
      setSimMessage(err instanceof Error ? err.message : 'Failed to inject conflict.');
    }
  };

  const handleFailNext = async () => {
    setSimMessage(null);
    try {
      await setFailNextRequest(db, true);
      await triggerSuccessHaptic();
      setSimMessage('Configured: Next simulated request will fail with network timeout.');
    } catch (err) {
      setSimMessage(err instanceof Error ? err.message : 'Failed to set flag.');
    }
  };

  const handleScheduleReminder = async () => {
    setRemindStatus('Scheduling local notification...');
    const scheduled = await scheduleSyncReminder();
    if (scheduled) {
      setRemindStatus('Reminder set for 10 seconds! Background the app to test notification.');
    } else {
      setRemindStatus('Notification permission denied or unavailable.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={handleBack} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <Text style={[styles.backText, { color: colors.text }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sync Center</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={queueItems}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Sync queue empty</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
              All local mutations have synced to the local simulated server.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.headerGroup}>
            {/* Real Connectivity Indicator & Simulated Server Label */}
            <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        networkStatus === 'online'
                          ? colors.status
                          : networkStatus === 'offline'
                            ? colors.danger
                            : colors.warning,
                    },
                  ]}
                />
                <Text style={[styles.statusTitle, { color: colors.text }]}>
                  {networkStatus === 'online'
                    ? 'REAL Device Online'
                    : networkStatus === 'offline'
                      ? 'REAL Device Offline'
                      : 'REAL Connection Unknown'}
                </Text>
              </View>
              <Text style={[styles.simulatedBadge, { color: colors.primary }]}>
                Durable SQLite Outbox • Simulated Server Engine
              </Text>
              <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
                SiteProof writes locally first, enqueues mutations, and syncs against a local simulated server.
              </Text>
            </View>

            {/* Sync Action & Metrics */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Queue summary</Text>
              <View style={styles.metricsRow}>
                <MetricBox colors={colors} label="Pending" value={summary.pendingCount} />
                <MetricBox colors={colors} label="Failed" value={summary.failedCount} warning={summary.failedCount > 0} />
                <MetricBox colors={colors} label="Conflict" value={summary.conflictCount} danger={summary.conflictCount > 0} />
                <MetricBox colors={colors} label="Synced" value={summary.syncedCount} />
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={isSyncing}
                onPress={handleSyncNow}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              >
                {isSyncing ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Sync now</Text>
                )}
              </Pressable>
            </View>

            {/* Simulation Controls */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Simulation controls</Text>
              <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
                Reproducible test tools for demonstrating offline sync, retries, and version conflicts.
              </Text>

              <View style={styles.simActionsRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleInjectConflict}
                  style={[styles.secondaryButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Inject remote conflict</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleFailNext}
                  style={[styles.secondaryButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Fail next request</Text>
                </Pressable>
              </View>

              {simMessage ? (
                <Text style={[styles.simMessageText, { color: colors.primary }]}>{simMessage}</Text>
              ) : null}
            </View>

            {/* Local Notification Reminder */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Local notification reminder</Text>
              <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
                Schedules a real 10-second local OS notification that routes back to Sync Center when tapped.
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={handleScheduleReminder}
                style={[styles.secondaryButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Remind me in 10s</Text>
              </Pressable>

              {remindStatus ? (
                <Text style={[styles.simMessageText, { color: colors.textMuted }]}>{remindStatus}</Text>
              ) : null}
            </View>

            {/* Expo Go Deep Link Demo */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Deep Link Demo (Expo Go)</Text>
              <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
                Session-specific link generated via expo-linking:
              </Text>
              <Text style={[styles.codeText, { color: colors.primary }]}>{deepLinkUrl}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL(deepLinkUrl)}
                style={[styles.secondaryButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Test deep link</Text>
              </Pressable>
            </View>

            <Text accessibilityRole="header" style={[styles.sectionHeader, { color: colors.text }]}>Outbox Queue Items</Text>
          </View>
        }
        renderItem={({ item }) => (
          <QueueItemRow colors={colors} item={item} />
        )}
      />
    </SafeAreaView>
  );
}

function MetricBox({
  colors,
  danger = false,
  label,
  value,
  warning = false,
}: {
  colors: ReturnType<typeof getColors>;
  danger?: boolean;
  label: string;
  value: number;
  warning?: boolean;
}) {
  const textColor = danger ? colors.danger : warning ? colors.warning : colors.text;
  return (
    <View style={[styles.metricBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[styles.metricValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function QueueItemRow({ colors, item }: { colors: ReturnType<typeof getColors>; item: SyncQueueItem }) {
  const isConflict = item.status === 'conflict';

  const handlePress = () => {
    if (isConflict) {
      router.push({
        pathname: '/sync/conflicts/[conflictId]',
        params: { conflictId: item.id },
      } as Href);
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'synced':
        return colors.status;
      case 'failed':
        return colors.danger;
      case 'conflict':
        return colors.warning;
      case 'syncing':
        return colors.primary;
      default:
        return colors.textMuted;
    }
  };

  return (
    <Pressable
      accessibilityRole={isConflict ? 'button' : undefined}
      disabled={!isConflict}
      onPress={handlePress}
      style={[
        styles.queueRow,
        { backgroundColor: colors.surface, borderColor: isConflict ? colors.warning : colors.border },
      ]}
    >
      <View style={styles.queueHeader}>
        <Text style={[styles.queueType, { color: colors.text }]}>{item.mutationType}</Text>
        <View style={[styles.statusBadge, { backgroundColor: colors.background, borderColor: getStatusColor() }]}>
          <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={[styles.queueSubText, { color: colors.textMuted }]}>
        Task: {item.taskId} • Entity: {item.entityId}
      </Text>

      {item.baseVersion != null ? (
        <Text style={[styles.queueSubText, { color: colors.textMuted }]}>
          Base version: {item.baseVersion}
        </Text>
      ) : null}

      {item.lastError ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          Error: {item.lastError} (Attempts: {item.attemptCount})
        </Text>
      ) : null}

      {isConflict ? (
        <Text style={[styles.conflictPrompt, { color: colors.warning }]}>
          ⚠️ Conflict detected! Tap to review and resolve →
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  backText: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  cardCopy: {
    fontSize: typography.label,
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: typography.title,
    fontWeight: '800',
  },
  codeText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  conflictPrompt: {
    fontSize: typography.label,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  headerGroup: {
    gap: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
  },
  listContent: {
    alignSelf: 'center',
    gap: spacing.md,
    maxWidth: 720,
    padding: spacing.lg,
    width: '100%',
  },
  metricBox: {
    borderRadius: radii.sm,
    borderWidth: 1,
    flex: 1,
    padding: spacing.sm,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  placeholder: {
    width: 60,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  queueHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  queueRow: {
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  queueSubText: {
    fontSize: 12,
  },
  queueType: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    fontSize: typography.label,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: typography.title,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  simActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  simMessageText: {
    fontSize: 12,
    fontWeight: '700',
  },
  simulatedBadge: {
    fontSize: typography.label,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  statusCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  statusDot: {
    borderRadius: radii.pill,
    height: 10,
    width: 10,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
