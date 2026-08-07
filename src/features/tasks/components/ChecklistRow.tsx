import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChecklistItem } from '@/features/tasks/domain/task';
import { radii, spacing, typography, type ColorTokens } from '@/theme';

type ChecklistRowProps = {
  colors: ColorTokens;
  disabled: boolean;
  item: ChecklistItem;
  onToggle: (item: ChecklistItem) => void;
};

export function ChecklistRow({ colors, disabled, item, onToggle }: ChecklistRowProps) {
  return (
    <Pressable
      accessibilityHint="Saves this checklist draft on the device"
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.checked, disabled }}
      disabled={disabled}
      onPress={() => onToggle(item)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: item.checked ? colors.statusSoft : colors.surface,
          borderColor: item.checked ? colors.status : colors.border,
          opacity: disabled ? 0.65 : pressed ? 0.82 : 1,
        },
      ]}
    >
      <View
        accessible={false}
        style={[
          styles.checkbox,
          {
            backgroundColor: item.checked ? colors.status : 'transparent',
            borderColor: item.checked ? colors.status : colors.textMuted,
          },
        ]}
      >
        {item.checked ? <Text style={[styles.checkmark, { color: colors.onPrimary }]}>✓</Text> : null}
      </View>

      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.text }, item.checked && styles.checkedLabel]}>{item.label}</Text>
        <Text style={[styles.requirement, { color: colors.textMuted }]}>{item.required ? 'Required' : 'Recommended'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkedLabel: {
    textDecorationLine: 'line-through',
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkmark: {
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 20,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 23,
  },
  requirement: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'flex-start',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    padding: spacing.md,
  },
});
