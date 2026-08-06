import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography, type ColorTokens } from '@/theme';

type CapabilityRowProps = {
  code: string;
  colors: ColorTokens;
  description: string;
  title: string;
};

export function CapabilityRow({ code, colors, description, title }: CapabilityRowProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${title}. Planned capability. ${description}`}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.codeBadge, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.code, { color: colors.primary }]}>{code}</Text>
      </View>

      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.state, { color: colors.textMuted }]}>Planned</Text>
        </View>
        <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  code: {
    fontSize: typography.label,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  codeBadge: {
    alignItems: 'center',
    borderRadius: radii.sm,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    alignItems: 'flex-start',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  state: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
