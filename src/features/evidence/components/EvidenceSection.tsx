import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { checkEvidenceFileExists } from '@/features/evidence/services/evidenceStorage';
import type { TaskEvidence } from '@/features/tasks/domain/task';
import { getColors, radii, spacing, typography } from '@/theme';

type EvidenceSectionProps = {
  evidenceList: TaskEvidence[];
  taskId: string;
};

export function EvidenceSection({ evidenceList, taskId }: EvidenceSectionProps) {
  const colors = getColors(useColorScheme());
  const router = useRouter();

  const handleAddPhoto = () => {
    router.push(`/tasks/${taskId}/camera` as const);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            Photo evidence
          </Text>

          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{evidenceList.length}</Text>
          </View>
        </View>

        <Pressable
          accessibilityHint="Navigates to full-screen camera to capture photo evidence"
          accessibilityLabel="Add photo evidence"
          accessibilityRole="button"
          onPress={handleAddPhoto}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <Text style={[styles.addButtonText, { color: colors.onPrimary }]}>+ Add photo</Text>
        </Pressable>
      </View>

      {evidenceList.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No photo evidence captured for this task.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {evidenceList.map((item, index) => {
            const exists = checkEvidenceFileExists(item.fileUri);
            const dateStr = new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View
                key={item.id}
                style={[styles.thumbnailCard, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                {exists ? (
                  <Image
                    accessibilityLabel={`Evidence thumbnail ${index + 1} captured at ${dateStr}`}
                    resizeMode="cover"
                    source={{ uri: item.fileUri }}
                    style={styles.thumbnailImage}
                  />
                ) : (
                  <View style={[styles.missingBox, { backgroundColor: colors.dangerSoft }]}>
                    <Text style={[styles.missingText, { color: colors.danger }]}>
                      Photo unavailable on this device
                    </Text>
                  </View>
                )}
                <Text style={[styles.timestampText, { color: colors.textMuted }]}>{dateStr}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  addButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: typography.label,
    fontWeight: '800',
  },
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  emptyBox: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    padding: spacing.md,
  },
  emptyText: {
    fontSize: typography.body,
    textAlign: 'center',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  missingBox: {
    alignItems: 'center',
    height: 100,
    justifyContent: 'center',
    padding: spacing.xs,
    width: 100,
  },
  missingText: {
    fontSize: typography.label,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContent: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  thumbnailCard: {
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.xs,
  },
  thumbnailImage: {
    borderRadius: radii.sm,
    height: 100,
    width: 100,
  },
  timestampText: {
    fontSize: typography.label,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
  },
});
