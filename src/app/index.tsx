import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CapabilityRow } from '@/components/CapabilityRow';
import { getColors, radii, spacing, typography } from '@/theme';

type Capability = {
  code: string;
  description: string;
  title: string;
};

const capabilities: Capability[] = [
  {
    code: 'CAM',
    description: 'Capture and retain on-device inspection evidence.',
    title: 'Camera evidence',
  },
  {
    code: 'LOC',
    description: 'Verify an explicit foreground position against a site radius.',
    title: 'Location verification',
  },
  {
    code: 'SQL',
    description: 'Keep inspection progress dependable without connectivity.',
    title: 'Offline records',
  },
  {
    code: 'LFC',
    description: 'Retry queued work on active-app connectivity and resume events.',
    title: 'Lifecycle-aware synchronization',
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const colors = getColors(colorScheme);
  const compact = width < 360;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: compact ? spacing.md : spacing.lg },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.eyebrow}>
              <View style={[styles.eyebrowMark, { backgroundColor: colors.primary }]} />
              <Text style={[styles.eyebrowText, { color: colors.primary }]}>MOBILE ENGINEERING PORTFOLIO</Text>
            </View>

            <Text accessibilityRole="header" style={[styles.productName, compact && styles.productNameCompact, { color: colors.text }]}>
              SiteProof
            </Text>
            <Text style={[styles.summary, { color: colors.textMuted }]}>
              Focused field inspections built around reliable device workflows and honest offline behavior.
            </Text>
          </View>

          <View
            accessible
            accessibilityLabel="Foundation ready. Expo SDK 57 application baseline is configured."
            style={[styles.foundationCard, { backgroundColor: colors.statusSoft, borderColor: colors.status }]}
          >
            <View style={styles.foundationHeading}>
              <View style={[styles.statusMark, { backgroundColor: colors.status }]} />
              <Text style={[styles.foundationState, { color: colors.status }]}>Foundation ready</Text>
            </View>
            <Text style={[styles.foundationCopy, { color: colors.text }]}>
              Expo Router, strict TypeScript, development builds, and deterministic quality checks are configured.
            </Text>
          </View>

          <View style={[styles.offlineCard, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.cardLabel, { color: colors.primary }]}>WORKFLOW TARGET</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Offline-ready mobile inspection workflow</Text>
            <Text style={[styles.cardCopy, { color: colors.textMuted }]}>
              Field work will remain available through weak connectivity, with local state kept visible and explainable.
            </Text>
          </View>

          <View style={styles.capabilitySection}>
            <View style={styles.sectionHeading}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Capability preview</Text>
              <Text style={[styles.sectionNote, { color: colors.textMuted }]}>Phase roadmap</Text>
            </View>

            <View style={styles.capabilityList}>
              {capabilities.map((capability) => (
                <CapabilityRow key={capability.code} colors={colors} {...capability} />
              ))}
            </View>
          </View>

          <View style={[styles.phaseNote, { borderColor: colors.border }]}>
            <Text style={[styles.phaseNoteText, { color: colors.textMuted }]}>
              Device workflows are intentionally not active yet. Camera, location, offline records, and synchronization arrive in later phases.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  capabilityList: {
    gap: spacing.sm,
  },
  capabilitySection: {
    gap: spacing.md,
  },
  cardCopy: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  cardLabel: {
    fontSize: typography.label,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  cardTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    lineHeight: 27,
  },
  container: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: 680,
    width: '100%',
  },
  eyebrow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  eyebrowMark: {
    borderRadius: radii.pill,
    height: 8,
    width: 8,
  },
  eyebrowText: {
    fontSize: typography.label,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  foundationCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  foundationCopy: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  foundationHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  foundationState: {
    fontSize: typography.title,
    fontWeight: '800',
  },
  hero: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  offlineCard: {
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  phaseNote: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  phaseNoteText: {
    fontSize: 14,
    lineHeight: 21,
  },
  productName: {
    fontSize: typography.display,
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  productNameCompact: {
    fontSize: 34,
    lineHeight: 40,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xl,
  },
  sectionHeading: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  sectionNote: {
    fontSize: typography.label,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: typography.title,
    fontWeight: '800',
  },
  statusMark: {
    borderRadius: radii.pill,
    height: 10,
    width: 10,
  },
  summary: {
    fontSize: 18,
    lineHeight: 27,
    maxWidth: 560,
  },
});
