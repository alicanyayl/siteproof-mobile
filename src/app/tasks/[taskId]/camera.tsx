import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteEvidenceFile, persistEvidenceFile } from '@/features/evidence/services/evidenceStorage';
import { triggerSuccessHaptic } from '@/features/haptics/haptics';
import { useTaskRepository } from '@/features/tasks/hooks/useTaskRepository';
import { getColors, radii, spacing, typography } from '@/theme';

export default function CameraRoute() {
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const taskId = Array.isArray(params.taskId) ? (params.taskId[0] ?? '') : (params.taskId ?? '');

  const colors = getColors(useColorScheme());
  const repository = useTaskRepository();

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);

  const handleBack = () => {
    router.back();
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      return;
    }
    setSaveError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      if (photo?.uri != null) {
        setCapturedUri(photo.uri);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to capture photo.');
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setSaveError(null);
  };

  const handleUsePhoto = async () => {
    if (capturedUri == null || !taskId) {
      return;
    }
    setIsSaving(true);
    setSaveError(null);

    let persistedUri: string | null = null;
    try {
      const persisted = await persistEvidenceFile({ sourceUri: capturedUri, taskId });
      persistedUri = persisted.fileUri;

      await repository.addEvidence({
        fileUri: persisted.fileUri,
        taskId,
      });

      await triggerSuccessHaptic();
      router.back();
    } catch (err) {
      if (persistedUri != null) {
        deleteEvidenceFile(persistedUri);
      }
      setSaveError(err instanceof Error ? err.message : 'Failed to save photo evidence.');
      setIsSaving(false);
    }
  };

  if (!taskId) {
    return (
      <SafeAreaView style={[styles.stateScreen, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.text }]}>Task not found</Text>
        <Pressable
          accessibilityRole="button"
          onPress={handleBack}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (permission == null) {
    return (
      <SafeAreaView style={[styles.stateScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.stateTitle, { color: colors.text }]}>Checking camera permissions...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.stateScreen, { backgroundColor: colors.background }]}>
        <View style={[styles.permissionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.stateTitle, { color: colors.text }]}>
            Camera access required
          </Text>
          <Text style={[styles.explanationText, { color: colors.textMuted }]}>
            SiteProof requires camera access to capture inspection photo evidence directly on your device.
          </Text>

          {permission.canAskAgain ? (
            <Pressable
              accessibilityLabel="Allow camera access"
              accessibilityRole="button"
              onPress={requestPermission}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Allow camera</Text>
            </Pressable>
          ) : (
            <View style={styles.settingsGroup}>
              <Text style={[styles.explanationText, { color: colors.warning }]}>
                Camera permission is blocked in your system settings. Please enable camera access in iOS Settings.
              </Text>
              <Pressable
                accessibilityLabel="Open settings"
                accessibilityRole="button"
                onPress={() => Linking.openSettings()}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Open settings</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            accessibilityLabel="Cancel and go back"
            accessibilityRole="button"
            onPress={handleBack}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {capturedUri != null ? (
        <View style={styles.previewContainer}>
          <Image resizeMode="contain" source={{ uri: capturedUri }} style={styles.previewImage} />

          <SafeAreaView style={styles.overlayControls}>
            {saveError != null ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{saveError}</Text>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel="Retake photo"
                accessibilityRole="button"
                disabled={isSaving}
                onPress={handleRetake}
                style={({ pressed }) => [
                  styles.retakeButton,
                  { opacity: pressed || isSaving ? 0.6 : 1 },
                ]}
              >
                <Text style={styles.actionButtonText}>Retake</Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Use photo evidence"
                accessibilityRole="button"
                disabled={isSaving}
                onPress={handleUsePhoto}
                style={({ pressed }) => [
                  styles.usePhotoButton,
                  { backgroundColor: colors.primary, opacity: pressed || isSaving ? 0.82 : 1 },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={[styles.usePhotoText, { color: colors.onPrimary }]}>Use photo</Text>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            facing="back"
            onCameraReady={() => setIsCameraReady(true)}
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
          />

          <SafeAreaView style={styles.cameraControls}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityLabel="Cancel camera"
                accessibilityRole="button"
                onPress={handleBack}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕ Cancel</Text>
              </Pressable>
            </View>

            {saveError != null ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{saveError}</Text>
              </View>
            ) : null}

            <View style={styles.shutterBar}>
              <Pressable
                accessibilityHint="Takes an evidence photograph"
                accessibilityLabel="Capture photo"
                accessibilityRole="button"
                disabled={!isCameraReady}
                onPress={handleTakePicture}
                style={({ pressed }) => [
                  styles.shutterButton,
                  { opacity: pressed || !isCameraReady ? 0.6 : 1 },
                ]}
              >
                <View style={styles.shutterInner} />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '700',
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-around',
    padding: spacing.md,
  },
  buttonText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  cameraContainer: {
    backgroundColor: '#000000',
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    justifyContent: 'space-between',
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '700',
  },
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
  errorBanner: {
    borderRadius: radii.sm,
    marginHorizontal: spacing.md,
    padding: spacing.sm,
  },
  errorText: {
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  explanationText: {
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
  },
  overlayControls: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  permissionCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 480,
    padding: spacing.lg,
    width: '100%',
  },
  previewContainer: {
    backgroundColor: '#000000',
    flex: 1,
  },
  previewImage: {
    flex: 1,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  retakeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 120,
    paddingHorizontal: spacing.lg,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  settingsGroup: {
    gap: spacing.sm,
  },
  shutterBar: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  shutterButton: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 4,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  shutterInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 60,
    width: 60,
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
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  usePhotoButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 120,
    paddingHorizontal: spacing.lg,
  },
  usePhotoText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
});
