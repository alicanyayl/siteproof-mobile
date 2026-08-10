import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { triggerSuccessHaptic, triggerWarningHaptic } from '@/features/haptics/haptics';
import { calculateHaversineDistance } from '@/features/location/domain/haversine';
import {
  evaluateLocationVerification,
  type VerificationResultState,
} from '@/features/location/domain/verificationRule';
import {
  acquireCurrentPosition,
  getForegroundLocationPermissionStatus,
  requestForegroundLocationPermission,
} from '@/features/location/services/locationService';
import type { InspectionTask, TaskLocationCheck, TaskRepository } from '@/features/tasks/domain/task';
import { getColors, radii, spacing, typography } from '@/theme';

type LocationSectionProps = {
  initialCheck: TaskLocationCheck | null;
  repository: TaskRepository;
  task: InspectionTask;
};

export function LocationSection({ initialCheck, repository, task }: LocationSectionProps) {
  const colors = getColors(useColorScheme());
  const [latestCheck, setLatestCheck] = useState<TaskLocationCheck | null>(initialCheck);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getResultState = (check: TaskLocationCheck | null): VerificationResultState => {
    if (check == null) {
      return 'not_checked';
    }
    const { state } = evaluateLocationVerification({
      accuracyMeters: check.accuracyMeters,
      distanceMeters: check.distanceMeters,
      verificationRadiusMeters: check.verificationRadiusMeters,
    });
    return state;
  };

  const currentStatusState = getResultState(latestCheck);

  const handleVerifyLocation = useCallback(async () => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      let status = await getForegroundLocationPermissionStatus();

      if (status !== 'granted') {
        const granted = await requestForegroundLocationPermission();
        if (!granted) {
          setErrorMessage('Foreground location access was not granted.');
          setIsVerifying(false);
          await triggerWarningHaptic();
          return;
        }
      }

      const position = await acquireCurrentPosition();

      const distanceMeters = calculateHaversineDistance(
        { latitude: position.latitude, longitude: position.longitude },
        { latitude: task.latitude, longitude: task.longitude },
      );

      const evaluation = evaluateLocationVerification({
        accuracyMeters: position.accuracyMeters,
        distanceMeters,
        verificationRadiusMeters: task.verificationRadiusMeters,
      });

      const savedRecord = await repository.addLocationCheck({
        accuracyMeters: position.accuracyMeters,
        distanceMeters,
        latitude: position.latitude,
        longitude: position.longitude,
        taskId: task.id,
        verificationRadiusMeters: task.verificationRadiusMeters,
        verified: evaluation.verified,
      });

      setLatestCheck(savedRecord);

      if (evaluation.verified) {
        await triggerSuccessHaptic();
      } else {
        await triggerWarningHaptic();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not obtain location fix.');
      await triggerWarningHaptic();
    } finally {
      setIsVerifying(false);
    }
  }, [repository, task]);

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const getStatusBadgeStyle = (state: VerificationResultState) => {
    switch (state) {
      case 'verified':
        return { bg: colors.statusSoft, fg: colors.status, label: 'Verified' };
      case 'outside_radius':
        return { bg: colors.warningSoft, fg: colors.warning, label: 'Outside inspection area' };
      case 'accuracy_insufficient':
        return { bg: colors.warningSoft, fg: colors.warning, label: 'Accuracy insufficient' };
      case 'location_unavailable':
        return { bg: colors.dangerSoft, fg: colors.danger, label: 'Location unavailable' };
      default:
        return { bg: colors.surfaceMuted, fg: colors.textMuted, label: 'Not verified' };
    }
  };

  const statusBadge = getStatusBadgeStyle(currentStatusState);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          Location verification
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusBadge.fg }]}>{statusBadge.label}</Text>
        </View>
      </View>

      <Text style={[styles.explanationText, { color: colors.textMuted }]}>
        SiteProof uses your current device location only to compare your position with the assigned site target.
      </Text>

      {latestCheck != null ? (
        <View style={[styles.detailsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Distance to site:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatDistance(latestCheck.distanceMeters)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Required radius:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatDistance(latestCheck.verificationRadiusMeters)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Reported GPS accuracy:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {latestCheck.accuracyMeters != null ? `±${Math.round(latestCheck.accuracyMeters)} m` : 'Unknown'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Last checked:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(latestCheck.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      ) : null}

      {errorMessage != null ? (
        <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityHint="Requests foreground location and verifies distance to inspection site"
        accessibilityLabel="Verify location"
        accessibilityRole="button"
        disabled={isVerifying}
        onPress={handleVerifyLocation}
        style={({ pressed }) => [
          styles.verifyButton,
          { backgroundColor: colors.primary, opacity: pressed || isVerifying ? 0.82 : 1 },
        ]}
      >
        {isVerifying ? (
          <ActivityIndicator color={colors.onPrimary} size="small" />
        ) : (
          <Text style={[styles.verifyButtonText, { color: colors.onPrimary }]}>
            {latestCheck != null ? 'Re-verify location' : 'Verify location'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  detailLabel: {
    fontSize: typography.body,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailValue: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  detailsCard: {
    borderRadius: radii.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  errorBox: {
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  errorText: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  explanationText: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBadge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: typography.label,
    fontWeight: '800',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
  },
  verifyButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  verifyButtonText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
});
