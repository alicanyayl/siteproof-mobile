import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EvidenceSection } from '@/features/evidence/components/EvidenceSection';
import { triggerSuccessHaptic } from '@/features/haptics/haptics';
import { LocationSection } from '@/features/location/components/LocationSection';
import { FadeInView } from '@/features/motion/FadeInView';
import { createInspectionPdfReport } from '@/features/reports/services/reportGenerator';
import { shareInspectionReport } from '@/features/reports/services/reportSharing';
import { ChecklistRow } from '@/features/tasks/components/ChecklistRow';
import { formatDueAt } from '@/features/tasks/components/TaskCard';
import { PriorityBadge, StatusBadge } from '@/features/tasks/components/TaskBadges';
import type {
  ChecklistItem,
  TaskDetail,
  TaskEvidence,
  TaskLocationCheck,
  TaskRepository,
} from '@/features/tasks/domain/task';
import { getColors, radii, spacing, typography } from '@/theme';

type TaskDetailScreenProps = {
  onBack: () => void;
  repository: TaskRepository;
  taskId: string;
};

type DetailState =
  | { kind: 'error' }
  | { kind: 'loading' }
  | { kind: 'notFound' }
  | {
      detail: TaskDetail;
      evidenceList: TaskEvidence[];
      initialLocationCheck: TaskLocationCheck | null;
      kind: 'ready';
    };

type SaveState = 'error' | 'idle' | 'saved' | 'saving';

export function TaskDetailScreen({ onBack, repository, taskId }: TaskDetailScreenProps) {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 360 ? spacing.md : spacing.lg;
  const [reloadToken, setReloadToken] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [state, setState] = useState<DetailState>({ kind: 'loading' });

  useEffect(() => {
    let active = true;

    Promise.all([
      repository.getTaskDetail(taskId),
      repository.listEvidenceForTask(taskId),
      repository.getLatestLocationCheck(taskId),
    ]).then(
      ([detail, evidenceList, initialLocationCheck]) => {
        if (active) {
          setState(
            detail == null
              ? { kind: 'notFound' }
              : { detail, evidenceList, initialLocationCheck, kind: 'ready' },
          );
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
  }, [reloadToken, repository, taskId]);

  const handleRetry = useCallback(() => {
    setState({ kind: 'loading' });
    setSaveState('idle');
    setReloadToken((value) => value + 1);
  }, []);

  const handleToggle = useCallback(
    async (item: ChecklistItem) => {
      if (savingItemId != null) {
        return;
      }

      setSavingItemId(item.id);
      setSaveState('saving');

      try {
        await repository.setChecklistItemChecked(item.id, !item.checked);
        const [detail, evidenceList, initialLocationCheck] = await Promise.all([
          repository.getTaskDetail(taskId),
          repository.listEvidenceForTask(taskId),
          repository.getLatestLocationCheck(taskId),
        ]);
        if (detail == null) {
          setState({ kind: 'notFound' });
          setSaveState('idle');
        } else {
          setState({ detail, evidenceList, initialLocationCheck, kind: 'ready' });
          setSaveState('saved');
        }
      } catch {
        setSaveState('error');
      } finally {
        setSavingItemId(null);
      }
    },
    [repository, savingItemId, taskId],
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.navigation, { borderBottomColor: colors.border, paddingHorizontal: horizontalPadding }]}>
        <Pressable
          accessibilityLabel="Back to assigned tasks"
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
        >
          <Text accessible={false} style={[styles.backArrow, { color: colors.primary }]}>‹</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Tasks</Text>
        </Pressable>
        <Text numberOfLines={1} style={[styles.navigationId, { color: colors.textMuted }]}>{taskId || 'Unknown task'}</Text>
      </View>

      {state.kind === 'loading' ? (
        <DetailLoading colors={colors} />
      ) : state.kind === 'error' ? (
        <DetailError colors={colors} onRetry={handleRetry} />
      ) : state.kind === 'notFound' ? (
        <DetailNotFound colors={colors} taskId={taskId} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <TaskDetailContent
            colors={colors}
            detail={state.detail}
            evidenceList={state.evidenceList}
            initialLocationCheck={state.initialLocationCheck}
            onToggle={handleToggle}
            repository={repository}
            saveState={saveState}
            savingItemId={savingItemId}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function TaskDetailContent({
  colors,
  detail,
  evidenceList,
  initialLocationCheck,
  onToggle,
  repository,
  saveState,
  savingItemId,
}: {
  colors: ReturnType<typeof getColors>;
  detail: TaskDetail;
  evidenceList: TaskEvidence[];
  initialLocationCheck: TaskLocationCheck | null;
  onToggle: (item: ChecklistItem) => void;
  repository: TaskRepository;
  saveState: SaveState;
  savingItemId: string | null;
}) {
  const { checklist, task } = detail;
  const checkedCount = checklist.filter((item) => item.checked).length;
  const requiredCount = checklist.filter((item) => item.required).length;
  const progress = checklist.length === 0 ? 0 : Math.round((checkedCount / checklist.length) * 100);
  const saveMessage: Record<SaveState, string> = {
    error: 'That change was not saved. Check the local database and try again.',
    idle: 'Checklist progress is stored locally on this device.',
    saved: 'Draft saved on this device.',
    saving: 'Saving draft on this device…',
  };

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (isGeneratingReport) return;
    setIsGeneratingReport(true);
    setReportError(null);
    triggerSuccessHaptic();

    try {
      const pdf = await createInspectionPdfReport({
        checklist: detail.checklist,
        evidenceList,
        initialLocationCheck,
        task: detail.task,
      });
      const shareRes = await shareInspectionReport(pdf.filePath);
      if (shareRes.outcome === 'unavailable') {
        setReportError(shareRes.reason);
      } else if (shareRes.outcome === 'error') {
        setReportError(shareRes.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not generate report.';
      setReportError(msg);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <FadeInView style={styles.content}>
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{task.inspectionType.toUpperCase()}</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{task.title}</Text>
        <Text style={[styles.location, { color: colors.textMuted }]}>{task.siteName} · {task.area}</Text>
        <View style={styles.badgeRow}>
          <PriorityBadge colors={colors} priority={task.priority} />
          <StatusBadge colors={colors} status={task.status} />
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.primarySoft }]}>
        <View style={styles.summaryHeading}>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.primary }]}>CHECKLIST PROGRESS</Text>
            <Text style={[styles.progressValue, { color: colors.text }]}>{checkedCount} of {checklist.length} checked</Text>
          </View>
          <Text style={[styles.progressPercent, { color: colors.primary }]}>{progress}%</Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ max: checklist.length, min: 0, now: checkedCount, text: `${checkedCount} of ${checklist.length} checked` }}
          style={styles.progressSegments}
        >
          {checklist.map((item) => (
            <View key={item.id} style={[styles.progressSegment, { backgroundColor: item.checked ? colors.status : colors.border }]} />
          ))}
        </View>
        <Text style={[styles.summaryMeta, { color: colors.textMuted }]}>
          Due {formatDueAt(task.dueAt)} · {requiredCount} required checks
        </Text>
      </View>

      {/* Report Action Card */}
      <View style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.reportHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reportCardTitle, { color: colors.text }]}>Inspection Report</Text>
            <Text style={[styles.reportCardSubtitle, { color: colors.textMuted }]}>
              Export &amp; share official PDF report with checklist and evidence summary.
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel="Generate inspection report PDF"
          accessibilityRole="button"
          disabled={isGeneratingReport}
          onPress={handleGenerateReport}
          style={({ pressed }) => [
            styles.reportButton,
            {
              backgroundColor: colors.primary,
              opacity: isGeneratingReport || pressed ? 0.8 : 1,
            },
          ]}
        >
          {isGeneratingReport ? (
            <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: spacing.xs }} />
          ) : null}
          <Text style={styles.reportButtonText}>
            {isGeneratingReport ? 'Preparing PDF Report…' : 'Generate & Share Report'}
          </Text>
        </Pressable>
        {reportError ? (
          <Text accessibilityLiveRegion="polite" style={[styles.reportErrorText, { color: colors.danger }]}>
            {reportError}
          </Text>
        ) : null}
      </View>

      <View accessibilityLiveRegion="polite" style={[styles.saveNotice, { backgroundColor: saveState === 'error' ? colors.dangerSoft : colors.statusSoft, borderColor: saveState === 'error' ? colors.danger : colors.status }]}>
        {saveState === 'saving' ? <ActivityIndicator color={colors.status} size="small" /> : <View style={[styles.saveMark, { backgroundColor: saveState === 'error' ? colors.danger : colors.status }]} />}
        <Text style={[styles.saveText, { color: saveState === 'error' ? colors.danger : colors.text }]}>{saveMessage[saveState]}</Text>
      </View>

      <View style={styles.checklistSection}>
        <View style={styles.sectionHeading}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Inspection checklist</Text>
          <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{checklist.length} items</Text>
        </View>
        <View style={styles.checklist}>
          {checklist.map((item) => (
            <ChecklistRow
              colors={colors}
              disabled={savingItemId != null}
              item={item}
              key={item.id}
              onToggle={onToggle}
            />
          ))}
        </View>
      </View>

      <EvidenceSection evidenceList={evidenceList} taskId={task.id} />

      <LocationSection initialCheck={initialLocationCheck} repository={repository} task={task} />
    </FadeInView>
  );
}


function DetailLoading({ colors }: { colors: ReturnType<typeof getColors> }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.centeredState}>
      <ActivityIndicator accessibilityLabel="Loading task checklist" color={colors.primary} size="large" />
      <Text style={[styles.stateTitle, { color: colors.text }]}>Loading local checklist</Text>
    </View>
  );
}

function DetailError({ colors, onRetry }: { colors: ReturnType<typeof getColors>; onRetry: () => void }) {
  return (
    <View accessibilityLiveRegion="assertive" style={styles.centeredState}>
      <Text style={[styles.stateTitle, { color: colors.text }]}>Task could not be loaded</Text>
      <Text style={[styles.stateCopy, { color: colors.textMuted }]}>SiteProof could not read this task from the local database.</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
        <Text style={[styles.retryText, { color: colors.onPrimary }]}>Try again</Text>
      </Pressable>
    </View>
  );
}

function DetailNotFound({ colors, taskId }: { colors: ReturnType<typeof getColors>; taskId: string }) {
  return (
    <View style={styles.centeredState}>
      <Text accessibilityRole="header" style={[styles.stateTitle, { color: colors.text }]}>Task not found</Text>
      <Text style={[styles.stateCopy, { color: colors.textMuted }]}>No local inspection matches {taskId || 'this route'}.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backArrow: {
    fontSize: 29,
    fontWeight: '500',
    lineHeight: 30,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  backLabel: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  centeredState: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  checklist: {
    gap: spacing.sm,
  },
  checklistSection: {
    gap: spacing.md,
  },
  content: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: 720,
    width: '100%',
  },
  eyebrow: {
    fontSize: typography.label,
    fontWeight: '900',
    letterSpacing: 1,
  },
  hero: {
    gap: spacing.sm,
  },
  location: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  navigation: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    minHeight: 68,
    paddingVertical: spacing.sm,
  },
  navigationId: {
    flexShrink: 1,
    fontSize: typography.label,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  phaseBoundary: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  phaseBoundaryText: {
    fontSize: 14,
    lineHeight: 21,
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: '900',
  },
  progressSegment: {
    borderRadius: radii.pill,
    flex: 1,
    height: 7,
  },
  progressSegments: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  retryButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  safeArea: {
    flex: 1,
  },
  saveMark: {
    borderRadius: radii.pill,
    height: 10,
    width: 10,
  },
  saveNotice: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    padding: spacing.md,
  },
  saveText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  sectionCount: {
    fontSize: typography.label,
    fontWeight: '700',
  },
  sectionHeading: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: typography.title,
    fontWeight: '800',
  },
  stateCopy: {
    fontSize: typography.body,
    lineHeight: 24,
    maxWidth: 480,
    textAlign: 'center',
  },
  stateTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: radii.lg,
    gap: spacing.md,
    padding: spacing.lg,
  },
  summaryHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  summaryMeta: {
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 37,
  },
  reportButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '800',
  },
  reportCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  reportCardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  reportCardTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  reportErrorText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
