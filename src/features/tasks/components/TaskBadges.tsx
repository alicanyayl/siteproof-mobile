import { StyleSheet, Text, View } from 'react-native';

import type { TaskPriority, TaskStatus } from '@/features/tasks/domain/task';
import { radii, type ColorTokens } from '@/theme';

type BadgeColors = {
  background: string;
  text: string;
};

type BadgeProps = {
  colors: BadgeColors;
  label: string;
};

function Badge({ colors, label }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

export function PriorityBadge({ colors, priority }: { colors: ColorTokens; priority: TaskPriority }) {
  const badgeColors: Record<TaskPriority, BadgeColors> = {
    high: { background: colors.warningSoft, text: colors.warning },
    low: { background: colors.statusSoft, text: colors.status },
    medium: { background: colors.primarySoft, text: colors.primary },
  };

  return <Badge colors={badgeColors[priority]} label={`${priority} priority`} />;
}

export function StatusBadge({ colors, status }: { colors: ColorTokens; status: TaskStatus }) {
  const badgeColors: Record<TaskStatus, BadgeColors> = {
    assigned: { background: colors.surfaceMuted, text: colors.textMuted },
    completed: { background: colors.statusSoft, text: colors.status },
    in_progress: { background: colors.primarySoft, text: colors.primary },
  };
  const labels: Record<TaskStatus, string> = {
    assigned: 'Assigned',
    completed: 'Completed',
    in_progress: 'In progress',
  };

  return <Badge colors={badgeColors[status]} label={labels[status]} />;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
});
