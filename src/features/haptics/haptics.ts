import * as Haptics from 'expo-haptics';

export async function triggerSuccessHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Non-critical: swallow haptic errors on unsupported devices/platforms
  }
}

export async function triggerWarningHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Non-critical: swallow haptic errors on unsupported devices/platforms
  }
}
