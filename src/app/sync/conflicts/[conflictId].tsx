import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { triggerSuccessHaptic } from '@/features/haptics/haptics';
import { resolveSyncConflict } from '@/features/sync/services/conflictResolver';
import type { SyncConflictItem } from '@/features/tasks/domain/task';
import { useTaskRepository } from '@/features/tasks/hooks/useTaskRepository';
import { getColors, radii, spacing, typography } from '@/theme';

type State =
  | { kind: 'error' }
  | { kind: 'loading' }
  | { kind: 'notFound' }
  | { conflict: SyncConflictItem; itemLabel: string; kind: 'ready' };

export default function ConflictRoute() {
  const params = useLocalSearchParams<{ conflictId?: string | string[] }>();
  const rawId = Array.isArray(params.conflictId) ? (params.conflictId[0] ?? '') : (params.conflictId ?? '');

  const db = useSQLiteContext();
  const repository = useTaskRepository();
  const colors = getColors(useColorScheme());

  const [state, setState] = useState<State>({ kind: 'loading' });
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadConflict() {
      if (!rawId) {
        if (active) setState({ kind: 'notFound' });
        return;
      }

      try {
        // Try getting directly by ID first
        let conflict = await repository.getSyncConflictById(rawId);

        // If not found directly, search list by queue_id or id
        if (conflict == null) {
          const list = await repository.listSyncConflicts();
          conflict = list.find((c) => c.id === rawId || c.queueId === rawId) ?? null;
        }

        if (conflict == null || conflict.resolvedAt != null) {
          if (active) setState({ kind: 'notFound' });
          return;
        }

        // Fetch task checklist to display human-readable item label
        const taskDetail = await repository.getTaskDetail(conflict.taskId);
        const item = taskDetail?.checklist.find((i) => i.id === conflict.itemId);
        const itemLabel = item?.label ?? conflict.itemId;

        if (active) {
          setState({ conflict, itemLabel, kind: 'ready' });
        }
      } catch (err) {
        console.warn('Error loading conflict:', err);
        if (active) setState({ kind: 'error' });
      }
    }

    loadConflict();

    return () => {
      active = false;
    };
  }, [rawId, repository]);

  const handleResolve = async (resolution: 'keep_local' | 'use_remote') => {
    if (state.kind !== 'ready') return;
    setIsResolving(true);

    try {
      await resolveSyncConflict(db, state.conflict.id, resolution);
      await triggerSuccessHaptic();
      router.back();
    } catch (err) {
      console.warn('Failed to resolve conflict:', err);
      setIsResolving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (state.kind === 'loading') {
    return (
      <SafeAreaView style={[styles.stateScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.stateTitle, { color: colors.text }]}>Loading conflict details...</Text>
      </SafeAreaView>
    );
  }

  if (state.kind === 'notFound') {
    return (
      <SafeAreaView style={[styles.stateScreen, { backgroundColor: colors.background }]}>
        <Text accessibilityRole="header" style={[styles.stateTitle, { color: colors.text }]}>Conflict not found</Text>
        <Text style={[styles.stateCopy, { color: colors.textMuted }]}>
          This conflict has already been resolved or does not exist.
        </Text>
        <Pressable accessibilityRole="button" onPress={handleBack} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Back to Sync Center</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (state.kind === 'error') {
    return (
      <SafeAreaView style={[styles.stateScreen, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.text }]}>Error loading conflict</Text>
        <Pressable accessibilityRole="button" onPress={handleBack} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { conflict, itemLabel } = state;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={handleBack} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <Text style={[styles.backText, { color: colors.text }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Conflict Resolution</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={[styles.warningCard, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}>
          <Text style={[styles.warningTitle, { color: colors.warning }]}>Version Mismatch Detected</Text>
          <Text style={[styles.warningCopy, { color: colors.text }]}>
            The simulated server version ({conflict.remoteVersion}) differs from the local mutation base version. Choose which state to keep.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.itemLabel, { color: colors.text }]}>{itemLabel}</Text>
          <Text style={[styles.itemSubText, { color: colors.textMuted }]}>
            Task: {conflict.taskId} • Item: {conflict.itemId}
          </Text>
        </View>

        {/* Side by side comparison */}
        <View style={styles.comparisonRow}>
          <View style={[styles.compareCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Text style={[styles.compareHeader, { color: colors.primary }]}>Local Device State</Text>
            <Text style={[styles.compareValue, { color: colors.text }]}>
              {conflict.localChecked ? '☑ Checked' : '☐ Unchecked'}
            </Text>
            <Text style={[styles.compareSub, { color: colors.textMuted }]}>
              Unsent local edit
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={isResolving}
              onPress={() => handleResolve('keep_local')}
              style={[styles.resolveButton, { backgroundColor: colors.primary }]}
            >
              {isResolving ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={[styles.resolveButtonText, { color: colors.onPrimary }]}>Keep local</Text>
              )}
            </Pressable>
          </View>

          <View style={[styles.compareCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.compareHeader, { color: colors.text }]}>Simulated Server</Text>
            <Text style={[styles.compareValue, { color: colors.text }]}>
              {conflict.remoteChecked ? '☑ Checked' : '☐ Unchecked'}
            </Text>
            <Text style={[styles.compareSub, { color: colors.textMuted }]}>
              Remote version {conflict.remoteVersion}
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={isResolving}
              onPress={() => handleResolve('use_remote')}
              style={[styles.resolveButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
            >
              {isResolving ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Text style={[styles.resolveButtonText, { color: colors.text }]}>Use simulated server</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
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
    gap: spacing.xs,
    padding: spacing.lg,
  },
  compareCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  compareHeader: {
    fontSize: typography.label,
    fontWeight: '800',
  },
  compareSub: {
    fontSize: 12,
  },
  compareValue: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  container: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: 720,
    padding: spacing.lg,
    width: '100%',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
  },
  itemLabel: {
    fontSize: typography.title,
    fontWeight: '800',
  },
  itemSubText: {
    fontSize: typography.label,
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
  resolveButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  resolveButtonText: {
    fontSize: typography.label,
    fontWeight: '800',
  },
  stateCopy: {
    fontSize: typography.body,
    textAlign: 'center',
  },
  stateScreen: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  stateTitle: {
    fontSize: typography.title,
    fontWeight: '800',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  warningCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  warningCopy: {
    fontSize: typography.label,
  },
  warningTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
});
