import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskCard } from '@/features/tasks/components/TaskCard';
import type { InspectionTask, TaskRepository } from '@/features/tasks/domain/task';
import { getColors, radii, spacing, typography } from '@/theme';

type AssignedTasksScreenProps = {
  onSelectTask: (taskId: string) => void;
  refreshKey?: string;
  repository: TaskRepository;
};

type TaskListState =
  | { kind: 'error' }
  | { kind: 'loading' }
  | { kind: 'ready'; tasks: InspectionTask[] };

export function AssignedTasksScreen({ onSelectTask, refreshKey, repository }: AssignedTasksScreenProps) {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 360 ? spacing.md : spacing.lg;
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<TaskListState>({ kind: 'loading' });

  useEffect(() => {
    let active = true;

    repository.listAssignedTasks().then(
      (tasks) => {
        if (active) {
          setState({ kind: 'ready', tasks });
        }
      },
      () => {
        if (active) {
          setState({ kind: 'error' });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [refreshKey, reloadToken, repository]);

  const handleRetry = useCallback(() => {
    setState({ kind: 'loading' });
    setReloadToken((value) => value + 1);
  }, []);

  const tasks = state.kind === 'ready' ? state.tasks : [];
  const highPriorityCount = tasks.filter((task) => task.priority === 'high').length;
  const inProgressCount = tasks.filter((task) => task.status === 'in_progress').length;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <FlatList
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: horizontalPadding },
          tasks.length === 0 && styles.emptyListContent,
        ]}
        data={tasks}
        ItemSeparatorComponent={TaskSeparator}
        keyExtractor={(task) => task.id}
        ListEmptyComponent={
          state.kind === 'loading' ? (
            <TaskListLoading colors={colors} />
          ) : state.kind === 'error' ? (
            <TaskListError colors={colors} onRetry={handleRetry} />
          ) : (
            <TaskListEmpty colors={colors} />
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={[styles.brandMark, { backgroundColor: colors.primary }]} />
              <Text style={[styles.brand, { color: colors.primary }]}>SITEPROOF</Text>
            </View>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Assigned tasks</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Inspection work stored locally on this device.</Text>

            {state.kind === 'ready' && tasks.length > 0 ? (
              <View accessibilityLabel={`${tasks.length} active tasks, ${inProgressCount} in progress, ${highPriorityCount} high priority`} style={styles.summaryRow}>
                <SummaryMetric colors={colors} label="Active" value={tasks.length} />
                <SummaryMetric colors={colors} label="In progress" value={inProgressCount} />
                <SummaryMetric colors={colors} label="High priority" value={highPriorityCount} warning />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard colors={colors} onPress={() => onSelectTask(item.id)} task={item} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function SummaryMetric({ colors, label, value, warning = false }: { colors: ReturnType<typeof getColors>; label: string; value: number; warning?: boolean }) {
  return (
    <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.metricValue, { color: warning ? colors.warning : colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function TaskListLoading({ colors }: { colors: ReturnType<typeof getColors> }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.stateBlock}>
      <ActivityIndicator accessibilityLabel="Loading assigned tasks" color={colors.primary} size="large" />
      <Text style={[styles.stateTitle, { color: colors.text }]}>Loading local tasks</Text>
      <Text style={[styles.stateCopy, { color: colors.textMuted }]}>Reading assignments from SiteProof on this device.</Text>
    </View>
  );
}

function TaskListError({ colors, onRetry }: { colors: ReturnType<typeof getColors>; onRetry: () => void }) {
  return (
    <View accessibilityLiveRegion="assertive" style={[styles.stateCard, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
      <Text style={[styles.stateTitle, { color: colors.text }]}>Tasks could not be loaded</Text>
      <Text style={[styles.stateCopy, { color: colors.textMuted }]}>Your local records remain on this device. Try reading them again.</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.stateButton, { backgroundColor: colors.primary }]}>
        <Text style={[styles.stateButtonText, { color: colors.onPrimary }]}>Try again</Text>
      </Pressable>
    </View>
  );
}

function TaskListEmpty({ colors }: { colors: ReturnType<typeof getColors> }) {
  return (
    <View style={[styles.stateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.stateTitle, { color: colors.text }]}>No assigned tasks</Text>
      <Text style={[styles.stateCopy, { color: colors.textMuted }]}>There is no active local inspection work to display.</Text>
    </View>
  );
}

function TaskSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  brand: {
    fontSize: typography.label,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  brandMark: {
    borderRadius: radii.pill,
    height: 9,
    width: 9,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  listContent: {
    alignSelf: 'center',
    maxWidth: 720,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
    width: '100%',
  },
  metric: {
    borderRadius: radii.sm,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minHeight: 76,
    minWidth: 88,
    padding: spacing.sm,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  safeArea: {
    flex: 1,
  },
  separator: {
    height: spacing.md,
  },
  stateBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 240,
    padding: spacing.lg,
  },
  stateButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  stateButtonText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  stateCard: {
    alignItems: 'flex-start',
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  stateCopy: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  stateTitle: {
    fontSize: typography.title,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 24,
    maxWidth: 520,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
});
