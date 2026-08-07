import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PriorityBadge, StatusBadge } from '@/features/tasks/components/TaskBadges';
import type { InspectionTask } from '@/features/tasks/domain/task';
import { radii, spacing, typography, type ColorTokens } from '@/theme';

type TaskCardProps = {
  colors: ColorTokens;
  onPress: () => void;
  task: InspectionTask;
};

export function formatDueAt(dueAt: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(dueAt));
}

export function TaskCard({ colors, onPress, task }: TaskCardProps) {
  return (
    <Pressable
      accessibilityHint="Opens the task checklist"
      accessibilityLabel={`Open ${task.id}, ${task.title}, ${task.siteName}, ${task.area}, ${task.priority} priority, ${task.status.replace('_', ' ')}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.headingRow}>
        <Text style={[styles.identifier, { color: colors.primary }]}>{task.id}</Text>
        <StatusBadge colors={colors} status={task.status} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
      <Text style={[styles.location, { color: colors.textMuted }]}>
        {task.siteName} · {task.area}
      </Text>

      <View style={styles.footer}>
        <PriorityBadge colors={colors} priority={task.priority} />
        <Text style={[styles.due, { color: colors.textMuted }]}>Due {formatDueAt(task.dueAt)}</Text>
        <Text accessible={false} style={[styles.chevron, { color: colors.primary }]}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 152,
    padding: spacing.md,
  },
  chevron: {
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 28,
    marginLeft: 'auto',
  },
  due: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  identifier: {
    fontSize: typography.label,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  location: {
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
});
